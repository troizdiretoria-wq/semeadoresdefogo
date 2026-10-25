import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Region, UserRole } from '../types/index.js';

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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [activeRegionFilter, setActiveRegionFilterState] = useState<string | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Load users & regions from server
  const loadInitialData = async () => {
    try {
      const [usersRes, regionsRes] = await Promise.all([
        fetch('/api/auth/users'),
        fetch('/api/regions'),
      ]);

      if (usersRes.ok && regionsRes.ok) {
        const usersData: User[] = await usersRes.json();
        const regionsData: Region[] = await regionsRes.json();
        setAllUsers(usersData);
        setRegions(regionsData);

        // Check stored user id
        const storedUserId = localStorage.getItem('sf_user_id');
        if (storedUserId) {
          const found = usersData.find((u) => u.id === storedUserId);
          if (found) {
            setCurrentUser(found);
            if (found.role !== 'admin_global' && found.regionId) {
              setActiveRegionFilterState(found.regionId);
            }
          } else {
            const arthur = usersData.find((u) => u.name === 'Arthur') || usersData[0];
            setCurrentUser(arthur);
          }
        } else {
          const arthur = usersData.find((u) => u.name === 'Arthur') || usersData[0];
          setCurrentUser(arthur);
          if (arthur) localStorage.setItem('sf_user_id', arthur.id);
        }
      }
    } catch (err) {
      console.error('Error initializing auth and regions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const reloadRegions = async () => {
    try {
      const res = await fetch('/api/regions');
      if (res.ok) {
        const data = await res.json();
        setRegions(data);
      }
    } catch (err) {
      console.error('Error reloading regions:', err);
    }
  };

  const loginAs = async (userId: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const data = await res.json();
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
    setCurrentUser(null);
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
    if (!currentUser) return false;
    if (currentUser.role === 'admin_global') return true;

    switch (moduleKey) {
      case 'dashboard':
      case 'evangelisms':
      case 'reports':
        return true;
      case 'regions':
        return currentUser.role === 'coordenador_regional';
      case 'consolidation':
        return currentUser.role === 'equipe_consolidacao' || currentUser.role === 'coordenador_regional';
      case 'courses':
        return currentUser.role === 'equipe_ensino' || currentUser.role === 'coordenador_regional';
      case 'crusades':
      case 'departments':
      case 'meetings':
      case 'media':
        return true;
      case 'admin_users':
      case 'financial_legal':
        return false;
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
