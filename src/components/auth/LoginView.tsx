import React from 'react';
import { Shield, AlertCircle, Globe, Flame, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Logo } from '../common/Logo.js';

interface LoginViewProps {
  onGoToPublicSite: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onGoToPublicSite }) => {
  const { loginWithGoogle, isLoading, authError, clearAuthError } = useAuth();

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-between text-stone-200 font-['Montserrat',sans-serif] relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-900/20 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-amber-900/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Top Bar */}
      <header className="p-6 flex items-center justify-between max-w-6xl mx-auto w-full z-10">
        <Logo variant="light" showSubtitle={false} />
        <button
          onClick={onGoToPublicSite}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-stone-300 hover:text-white bg-stone-900/80 hover:bg-stone-800 border border-stone-800 transition-colors cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-red-500" />
          <span>Ver Site Público</span>
        </button>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-md bg-stone-900/90 border border-stone-800/80 rounded-2xl p-7 shadow-2xl backdrop-blur-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-800 to-amber-700 text-white shadow-lg shadow-red-950/50 mb-1">
              <Flame className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Portal de Gestão Ministerial
            </h1>
            <p className="text-xs text-stone-400 leading-relaxed">
              Acesso exclusivo para pastores supervisores, coordenadores regionais e líderes de evangelismo de campo cadastrados.
            </p>
          </div>

          {/* Auth Error Display */}
          {authError && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800/80 text-xs text-red-200 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="flex-1 leading-snug">{authError}</p>
              </div>
              <button
                onClick={clearAuthError}
                className="text-[11px] text-red-400 hover:text-red-300 underline font-medium block"
              >
                Tentar com outra conta
              </button>
            </div>
          )}

          {/* Action Button */}
          <div className="space-y-3 pt-2">
            <button
              onClick={loginWithGoogle}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isLoading ? 'Verificando autorização...' : 'Conectar com Google'}</span>
            </button>

            <button
              onClick={onGoToPublicSite}
              className="w-full py-2.5 px-4 rounded-xl bg-transparent hover:bg-stone-800/60 text-stone-400 hover:text-stone-200 text-xs font-semibold transition-colors border border-stone-800 text-center block cursor-pointer"
            >
              Visitar Portal Institucional Público
            </button>
          </div>

          {/* Security Notice */}
          <div className="pt-4 border-t border-stone-800/80 flex items-center justify-center gap-2 text-[10.5px] text-stone-500">
            <Shield className="w-3.5 h-3.5 text-stone-400" />
            <span>Autenticação criptografada via Firebase & Cloud Firestore</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-stone-600 z-10">
        <p>© 2026 Semeadores de Fogo Global. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};
