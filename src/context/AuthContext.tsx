import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Region } from '../types/index.js';
import { auth, googleProvider, signInWithPopup, signOut } from '../lib/firebase.js';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  fetchRegionsFromFirestore,
  fetchUsersFromFirestore,
  findUserByEmailOrUid,
  checkFirestoreConnection,
  triggerAdminBootstrap,
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
  getIdToken: () => Promise<string | null>;
  isLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  canAccessModule: (moduleKey: string) => boolean;
  canEditRegionalData: (targetRegionId: string) => boolean;
  isGlobalAdmin: boolean;
  isRegionalCoordinator: boolean;
  reloadRegions: () => Promise<void>;
  firestoreConnected: boolean;
  initializeMinisterialDatabase: () => Promise<{ success: boolean; message: string }>;
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

  // Check connectivity on boot (No unauthenticated seeding)
  useEffect(() => {
    let mounted = true;

    async function checkHealth() {
      try {
        const isConnected = await checkFirestoreConnection();
        if (mounted) setFirestoreConnected(isConnected);
      } catch (err) {
        if (mounted) setFirestoreConnected(false);
      }
    }

    checkHealth();

    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        try {
          setIsLoading(true);
          const email = fbUser.email?.toLowerCase().trim();
          const idToken = await fbUser.getIdToken();

          // Verify with server endpoint or Firestore
          const ministerialUser = await findUserByEmailOrUid(email, fbUser.uid);

          if (!ministerialUser) {
            // Check if primary admin Arthur logging in for the first time
            if (email === 'arthursantosprojetos@gmail.com') {
              const res = await triggerAdminBootstrap(idToken);
              const reloadedUser = await findUserByEmailOrUid(email, fbUser.uid);
              if (reloadedUser) {
                setCurrentUser(reloadedUser);
                setAuthError(null);
                const [r, u] = await Promise.all([fetchRegionsFromFirestore(), fetchUsersFromFirestore()]);
                setRegions(r);
                setAllUsers(u);
                setIsLoading(false);
                return;
              }
            }

            // Unregistered user attempting access -> block and sign out
            await signOut(auth);
            setCurrentUser(null);
            setAuthError(
              `O e-mail Google (${fbUser.email}) não possui autorização ministerial cadastrada. Solicite liberação ao Administrador Global (Arthur).`
            );
            setIsLoading(false);
            return;
          }

          if (ministerialUser.status !== 'active') {
            await signOut(auth);
            setCurrentUser(null);
            setAuthError(
              `O cadastro de ${ministerialUser.name} está com status inativo. Contate a Liderança Global.`
            );
            setIsLoading(false);
            return;
          }

          // Authorized ministerial user
          setCurrentUser(ministerialUser);
          setAuthError(null);

          // Populate authorized metadata
          const [initialRegions, initialUsers] = await Promise.all([
            fetchRegionsFromFirestore(),
            fetchUsersFromFirestore(),
          ]);
          setRegions(initialRegions);
          setAllUsers(initialUsers);

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
        setIsLoading(false);
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
        setIsLoading(false);
        return;
      }
      if (err.code === 'auth/unauthorized-domain') {
        setAuthError(
          "Domínio não autorizado pelo Firebase Authentication: O domínio atual ('semeadoresdefogo.vercel.app') precisa ser adicionado na lista de Domínios Autorizados no Firebase Console (Console Firebase → Authentication → Configurações → Domínios Autorizados)."
        );
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

  const getIdToken = async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    try {
      return await auth.currentUser.getIdToken();
    } catch {
      return null;
    }
  };

  const initializeMinisterialDatabase = async () => {
    if (!currentUser || currentUser.role !== 'admin_global') {
      return { success: false, message: 'Operação exclusiva do Administrador Global.' };
    }
    const token = await getIdToken();
    if (!token) return { success: false, message: 'Token de autenticação indisponível.' };
    const res = await triggerAdminBootstrap(token);
    if (res.success) {
      await reloadRegions();
    }
    return res;
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
    if (!currentUser) return false;
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
        return false;
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
        getIdToken,
        isLoading,
        authError,
        clearAuthError,
        canAccessModule,
        canEditRegionalData,
        isGlobalAdmin,
        isRegionalCoordinator,
        reloadRegions,
        firestoreConnected,
        initializeMinisterialDatabase,
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
