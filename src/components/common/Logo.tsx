import React from 'react';

interface LogoProps {
  variant?: 'light' | 'dark' | 'collapsed';
  className?: string;
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'dark',
  className = '',
  showSubtitle = true,
}) => {
  const isLight = variant === 'light';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official Emblem Container (Respects the official dove symbol requirement) */}
      <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-700 via-red-800 to-stone-900 shadow-md border border-red-600/30 shrink-0">
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-white"
        >
          {/* Stylized ministerial dove & flame heraldic motif */}
          <path
            d="M20 5C17 11 11 14 11 21C11 26.5 15 31 20 31C25 31 29 26.5 29 21C29 14 23 11 20 5Z"
            fill="url(#flameGradient)"
          />
          <path
            d="M20 10C18 14 14.5 16.5 14.5 21C14.5 24.5 17 27.5 20 27.5C23 27.5 25.5 24.5 25.5 21C25.5 16.5 22 14 20 10Z"
            fill="#FEF08A"
            opacity="0.9"
          />
          {/* Wings of the Dove */}
          <path
            d="M20 17C17 14 12 16 7 19C12 21 16 21 19 19L20 17Z"
            fill="white"
            opacity="0.95"
          />
          <path
            d="M20 17C23 14 28 16 33 19C28 21 24 21 21 19L20 17Z"
            fill="white"
            opacity="0.95"
          />
          <circle cx="20" cy="18" r="1.5" fill="#991B1B" />
          <defs>
            <linearGradient id="flameGradient" x1="20" y1="5" x2="20" y2="31" gradientUnits="userSpaceOnUse">
              <stop stopColor="#EF4444" />
              <stop offset="0.6" stopColor="#DC2626" />
              <stop offset="1" stopColor="#991B1B" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {variant !== 'collapsed' && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-extrabold tracking-wider text-base ${
              isLight ? 'text-white' : 'text-stone-900'
            }`}
          >
            SEMEADORES <span className="text-red-700">DE FOGO</span>
          </span>
          {showSubtitle && (
            <span
              className={`text-[9.5px] font-semibold tracking-widest uppercase mt-0.5 ${
                isLight ? 'text-stone-400' : 'text-stone-500'
              }`}
            >
              GLOBAL • MINISTÉRIO
            </span>
          )}
        </div>
      )}
    </div>
  );
};
