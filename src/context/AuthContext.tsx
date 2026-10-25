import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Region, UserRole } from '../types/index.js';
import { getClientDb, universalFetch } from '../lib/clientStore.js';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  regions: Region[];
  activeRegionFilter: string | 'ALL';
  setActiveRegionFilter: (regionId: string | 'ALL') => void;
  loginAs: (userId: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  canAccessModule: (moduleKey: string) => boolean;
  canEditRegionalData: (targetRegionId: string) => boolean;
  isGlobalAdmin: boolean;
  isRegionalCoordinator: boolean;
  reloadRegions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronous safe initialization from local database so screen never starts blank/broken
  const initialDb = getClientDb();
  const initialUsers: User[] = initialDb.users || [];
  const initialRegions: Region[] = initialDb.regions || [];

  const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('sf_user_id') : null;
  const initialUser: User =
    (storedUserId && initialUsers.find((u) => u.id === storedUserId)) ||
    initialUsers.find((u) => u.name === 'Arthur') ||
    initialUsers[0];

  const [currentUser, setCurrentUser] = useState<User | null>(initialUser || null);
  const [allUsers, setAllUsers] = useState<User[]>(initialUsers);
  const [regions, setRegions] = useState<Region[]>(initialRegions);
  const [activeRegionFilter, setActiveRegionFilterState] = useState<string | 'ALL'>(
    initialUser?.role !== 'admin_global' && initialUser?.regionId ? initialUser.regionId : 'ALL'
  );
  const [isLoading, setIsLoading] = useState(false);

  // Load users & regions from server/fallback
  const loadInitialData = async () => {
    try {
      const [usersData, regionsData] = await Promise.all([
        universalFetch<User[]>('/api/auth/users'),
        universalFetch<Region[]>('/api/regions'),
      ]);

      if (usersData && usersData.length > 0) {
        setAllUsers(usersData);
        const stored = typeof window !== 'undefined' ? localStorage.getItem('sf_user_id') : null;
        const found =
          (stored && usersData.find((u) => u.id === stored)) ||
          usersData.find((u) => u.name === 'Arthur') ||
          usersData[0];

        if (found) {
          setCurrentUser(found);
          if (found.role !== 'admin_global' && found.regionId) {
            setActiveRegionFilterState(found.regionId);
          }
        }
      }

      if (regionsData && regionsData.length > 0) {
        setRegions(regionsData);
      }
    } catch (err) {
      console.warn('Notice: using resilient client data store for auth and regions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const reloadRegions = async () => {
    try {
      const data = await universalFetch<Region[]>('/api/regions');
      if (data && data.length > 0) {
        setRegions(data);
      }
    } catch (err) {
      console.error('Error reloading regions:', err);
    }
  };

  const loginAs = async (userId: string) => {
    try {
      const data = await universalFetch<{ user: User }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (data?.user) {
        setCurrentUser(data.user);
        localStorage.setItem('sf_user_id', data.user.id);

        if (data.user.role !== 'admin_global' && data.user.regionId) {
          setActiveRegionFilterState(data.user.regionId);
        } else {
          setActiveRegionFilterState('ALL');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const logout = () => {
    const arthur = allUsers.find((u) => u.name === 'Arthur') || allUsers[0];
    setCurrentUser(arthur || null);
    localStorage.removeItem('sf_user_id');
  };

  const setActiveRegionFilter = (regionId: string | 'ALL') => {
    if (currentUser?.role !== 'admin_global' && currentUser?.regionId) {
      // Locked to own regional for non-global admins
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

  // RBAC permissions helper
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
        allUsers,
        regions,
        activeRegionFilter,
        setActiveRegionFilter,
        loginAs,
        logout,
        isLoading,
        canAccessModule,
        canEditRegionalData,
        isGlobalAdmin,
        isRegionalCoordinator,
        reloadRegions,
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
