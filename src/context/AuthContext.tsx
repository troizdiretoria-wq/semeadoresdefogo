import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Region } from '../types/index.js';
import { auth, googleProvider, signInWithPopup, signOut } from '../lib/firebase.js';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  fetchRegionsFromFirestore,
  fetchUsersFromFirestore,
  findUserByEmailOrUid,
  seedFirestoreIfEmpty,
  checkFirestoreConnection,
} from '../lib/firestoreService.js';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  allUsers: User[];
  regions: Region[];
  activeRegionFilter: string | 'ALL';
  setActiveRegionFilter: (regionId: string | 'ALL') => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  canAccessModule: (moduleKey: string) => boolean;
  canEditRegionalData: (targetRegionId: string) => boolean;
  isGlobalAdmin: boolean;
  isRegionalCoordinator: boolean;
  reloadRegions: () => Promise<void>;
  firestoreConnected: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [activeRegionFilter, setActiveRegionFilterState] = useState<string | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [firestoreConnected, setFirestoreConnected] = useState<boolean>(true);

  // Initialize and check connection
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const isConnected = await checkFirestoreConnection();
        if (mounted) setFirestoreConnected(isConnected);

        // Seed initial collections if empty
        await seedFirestoreIfEmpty();

        const [initialRegions, initialUsers] = await Promise.all([
          fetchRegionsFromFirestore(),
          fetchUsersFromFirestore(),
        ]);

        if (mounted) {
          setRegions(initialRegions);
          setAllUsers(initialUsers);
        }
      } catch (err) {
        console.warn('[AuthContext] Erro na inicialização:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    init();

    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        try {
          setIsLoading(true);
          const email = fbUser.email?.toLowerCase().trim();
          const ministerialUser = await findUserByEmailOrUid(email, fbUser.uid);

          if (!ministerialUser) {
            // Unregistered user attempting access -> block and sign out
            await signOut(auth);
            setCurrentUser(null);
            setAuthError(
              `O e-mail Google (${fbUser.email}) não está cadastrado na base ministerial dos Semeadores de Fogo. Solicite liberação ao Administrador Global.`
            );
            return;
          }

          if (ministerialUser.status !== 'active') {
            await signOut(auth);
            setCurrentUser(null);
            setAuthError(
              `O cadastro de ${ministerialUser.name} está com status inativo. Contate a Liderança Global.`
            );
            return;
          }

          // Authorized ministerial user
          setCurrentUser(ministerialUser);
          setAuthError(null);

          // Constrain regional filter to their assigned regional if coordinator or field leader
          if (ministerialUser.role !== 'admin_global' && ministerialUser.regionId) {
            setActiveRegionFilterState(ministerialUser.regionId);
          } else {
            setActiveRegionFilterState('ALL');
          }
        } catch (err: any) {
          console.error('[AuthContext] Erro ao validar usuário no Firestore:', err);
          setAuthError('Falha ao autenticar com o banco de dados Cloud Firestore: ' + (err.message || 'Erro de rede'));
        } finally {
          setIsLoading(false);
        }
      } else {
        // Logged out
        setCurrentUser(null);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    setAuthError(null);
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed popup deliberately
        setIsLoading(false);
        return;
      }
      console.error('[Auth] Erro no login Google:', err);
      setAuthError(`Erro na autenticação Google: ${err.message || 'Falha ao autenticar'}`);
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      setCurrentUser(null);
      setFirebaseUser(null);
      setAuthError(null);
      setActiveRegionFilterState('ALL');
    } catch (err: any) {
      console.error('[Auth] Erro ao sair:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const reloadRegions = async () => {
    try {
      const data = await fetchRegionsFromFirestore();
      setRegions(data);
    } catch (err) {
      console.error('Erro ao recarregar regionais:', err);
    }
  };

  const setActiveRegionFilter = (regionId: string | 'ALL') => {
    if (currentUser?.role !== 'admin_global' && currentUser?.regionId) {
      setActiveRegionFilterState(currentUser.regionId);
    } else {
      setActiveRegionFilterState(regionId);
    }
  };

  const isGlobalAdmin = currentUser?.role === 'admin_global';
  const isRegionalCoordinator = currentUser?.role === 'coordenador_regional';

  const canEditRegionalData = (targetRegionId: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin_global') return true;
    if (currentUser.role === 'coordenador_regional' && currentUser.regionId === targetRegionId) return true;
    if (currentUser.role === 'lider_evangelismo' && currentUser.regionId === targetRegionId) return true;
    return false;
  };

  const canAccessModule = (moduleKey: string): boolean => {
    if (!currentUser) return true;
    if (currentUser.role === 'admin_global') return true;

    switch (moduleKey) {
      case 'dashboard':
      case 'evangelisms':
      case 'reports':
      case 'departments':
      case 'courses':
        return true;
      case 'regions':
        return currentUser.role === 'coordenador_regional';
      case 'consolidation':
        return currentUser.role === 'equipe_consolidacao' || currentUser.role === 'coordenador_regional';
      default:
        return true;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        allUsers,
        regions,
        activeRegionFilter,
        setActiveRegionFilter,
        loginWithGoogle,
        logout,
        isLoading,
        authError,
        clearAuthError,
        canAccessModule,
        canEditRegionalData,
        isGlobalAdmin,
        isRegionalCoordinator,
        reloadRegions,
        firestoreConnected,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
