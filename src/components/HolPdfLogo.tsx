import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  horizontal?: boolean;
}

export const HolPdfLogo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  horizontal = false,
}) => {
  const iconSizes = {
    sm: 'w-6 h-7',
    md: 'w-8 h-10',
    lg: 'w-12 h-15',
    xl: 'w-16 h-20',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const subSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm',
  };

  return (
    <div
      className={`flex items-center gap-2.5 ${horizontal ? 'flex-row' : 'flex-row'} ${className}`}
    >
      {/* Official HolPdf Document Emblem from Splash Page */}
      <div
        className={`relative flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:scale-105 drop-shadow-[0_4px_14px_rgba(220,38,38,0.3)] ${iconSizes[size]}`}
      >
        <svg
          viewBox="0 0 88 108"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible"
        >
          {/* Sheet background */}
          <path
            d="M6 10C6 5.58172 9.58172 2 14 2H58L82 26V98C82 102.418 78.4183 106 74 106H14C9.58172 106 6 102.418 6 98V10Z"
            fill="#0F172A"
            stroke="#334155"
            strokeWidth="2.5"
          />
          {/* Folded corner flap */}
          <path
            d="M58 2V22C58 24.2091 59.7909 26 62 26H82L58 2Z"
            fill="#1E293B"
            stroke="#334155"
            strokeWidth="2"
          />

          {/* Document internal simulated text lines */}
          <rect x="18" y="34" width="30" height="3.5" rx="1.75" fill="#475569" />
          <rect x="18" y="44" width="52" height="3.5" rx="1.75" fill="#334155" />
          <rect x="18" y="54" width="46" height="3.5" rx="1.75" fill="#334155" />

          {/* Red PDF Badge */}
          <g>
            <rect
              x="13"
              y="67"
              width="62"
              height="27"
              rx="6"
              fill="#DC2626"
              className="drop-shadow-sm"
            />
            <text
              x="44"
              y="85.5"
              fill="#FFFFFF"
              fontSize="14.5"
              fontWeight="800"
              fontFamily="system-ui, -apple-system, sans-serif"
              textAnchor="middle"
              letterSpacing="0.05em"
            >
              PDF
            </text>
          </g>
        </svg>
      </div>

      <div className="flex flex-col">
        <div className={`font-extrabold tracking-tight leading-none inline-flex items-center gap-0.5 ${titleSizes[size]}`}>
          <span className="text-slate-900 dark:text-white">Hol</span>
          <span className="text-red-600 dark:text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]">
            Pdf
          </span>
        </div>
        {showSubtitle && (
          <span className={`text-slate-500 dark:text-slate-400 font-medium tracking-wide mt-1 ${subSizes[size]}`}>
            Lis. Écoute. Avance.
          </span>
        )}
      </div>
    </div>
  );
};
