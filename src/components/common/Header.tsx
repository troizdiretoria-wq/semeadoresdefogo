import React, { useState } from 'react';
import {
  Menu,
  MapPin,
  Sparkles,
  Database,
  LogOut,
  LogIn,
  AlertCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { NavTab } from './Sidebar.js';

interface HeaderProps {
  currentTab: NavTab;
  onOpenMobileSidebar: () => void;
  onOpenAiAnalysis?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileSidebar,
  onOpenAiAnalysis,
}) => {
  const {
    currentUser,
    firebaseUser,
    loginWithGoogle,
    logout,
    regions,
    activeRegionFilter,
    setActiveRegionFilter,
    isGlobalAdmin,
    isLoading,
    authError,
    clearAuthError,
    firestoreConnected,
  } = useAuth();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const getPageTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Painel de Supervisão Global';
      case 'regions':
        return 'Gestão das Regionais';
      case 'evangelisms':
        return 'Planejamento e Execução de Evangelismos';
      case 'courses':
        return 'Escola de Formação Ministerial';
      case 'certificates':
        return 'Emissão de Certificados Digitais';
      case 'reports':
        return 'Relatórios Bimestrais das Regionais';
      case 'departments':
        return 'Departamentos Ministeriais';
      case 'ai_analysis':
        return 'Inteligência Artificial — Análise de Relatórios';
      default:
        return 'Semeadores de Fogo Global';
    }
  };

  const activeRegion = regions.find((r) => r.id === activeRegionFilter);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 sm:px-6 py-3.5 transition-all">
      {/* Auth Error Notification Banner */}
      {authError && (
        <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{authError}</span>
          </div>
          <button
            onClick={clearAuthError}
            className="text-stone-400 hover:text-stone-700 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="p-2 -ml-2 text-stone-600 hover:text-stone-900 rounded-lg lg:hidden hover:bg-stone-100 transition-colors"
            title="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-stone-900 truncate">
              {getPageTitle(currentTab)}
            </h1>
            <p className="text-[11px] text-stone-500 font-medium hidden sm:block">
              Semeadores de Fogo Global • Gestão Ministerial Unificada
            </p>
          </div>
        </div>

        {/* Right: Regional Filter & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Cloud Database Status */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200 text-[11px] font-medium text-stone-700">
            <span
              className={`w-2 h-2 rounded-full ${
                firestoreConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            ></span>
            <Database className="w-3.5 h-3.5 text-stone-600" />
            <span>{firestoreConnected ? 'Nuvem Firestore' : 'Conectando Firestore'}</span>
          </div>

          {/* AI Quick Button */}
          {onOpenAiAnalysis && (
            <button
              onClick={onOpenAiAnalysis}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-800 hover:bg-red-100 border border-red-200 rounded-lg transition-colors shadow-xs cursor-pointer"
              title="Análise Rápida de Relatórios com IA"
            >
              <Sparkles className="w-3.5 h-3.5 text-red-600" />
              <span>Síntese IA</span>
            </button>
          )}

          {/* Regional Selector */}
          <div className="relative">
            {isGlobalAdmin ? (
              <div className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200/80 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-700 transition-colors border border-stone-200">
                <MapPin className="w-3.5 h-3.5 text-red-700 shrink-0" />
                <select
                  aria-label="Filtrar por Regional"
                  value={activeRegionFilter}
                  onChange={(e) => setActiveRegionFilter(e.target.value)}
                  className="bg-transparent border-none text-stone-800 font-semibold focus:outline-none cursor-pointer pr-1 text-xs"
                >
                  <option value="ALL">Todas as Regionais (Global)</option>
                  {regions.map((reg) => (
                    <option key={reg.id} value={reg.id}>
                      {reg.name} ({reg.state})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-stone-100 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-700 border border-stone-200">
                <MapPin className="w-3.5 h-3.5 text-red-700 shrink-0" />
                <span className="font-semibold text-stone-800 truncate max-w-[140px] sm:max-w-[200px]">
                  {activeRegion ? activeRegion.name : 'Supervisão Global'}
                </span>
              </div>
            )}
          </div>

          {/* User Authentication Status */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 transition-colors bg-white shadow-2xs"
              >
                <div className="w-7 h-7 rounded-full bg-red-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-stone-900 leading-tight">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-stone-500 font-medium">
                    {currentUser.role === 'admin_global'
                      ? 'Liderança Global'
                      : currentUser.role === 'coordenador_regional'
                      ? 'Coord. Regional'
                      : currentUser.role === 'lider_evangelismo'
                      ? 'Líder Evangelismo'
                      : currentUser.role === 'equipe_consolidacao'
                      ? 'Consolidação'
                      : currentUser.role === 'equipe_ensino'
                      ? 'Ensino'
                      : 'Mídia'}
                  </p>
                </div>
              </button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-stone-200 z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-stone-100">
                      <p className="text-xs font-bold text-stone-900">{currentUser.name}</p>
                      <p className="text-[11px] text-stone-500 truncate">{currentUser.email}</p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-100 text-stone-700">
                        {currentUser.role.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="pt-2 px-1">
                      <button
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          await logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sair da Conta</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={loginWithGoogle}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-red-800 hover:bg-red-700 text-white rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isLoading ? 'Conectando...' : 'Entrar com Google'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
