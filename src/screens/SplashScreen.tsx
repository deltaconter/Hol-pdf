import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
  onStart?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, onStart }) => {
  const handleProceed = onFinish || onStart || (() => {});
  const TOTAL_DURATION_MS = 10000; // 10 secondes
  const INTERVAL_MS = 50;
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const startTime = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.min(now - startTime, TOTAL_DURATION_MS);
      setElapsedMs(elapsed);

      if (elapsed >= TOTAL_DURATION_MS) {
        clearInterval(interval);
        handleProceed();
      }
    }, INTERVAL_MS);

    return () => clearInterval(interval);
  }, [handleProceed]);

  const progressPercent = Math.min(100, (elapsedMs / TOTAL_DURATION_MS) * 100);
  const remainingSeconds = Math.max(0, Math.ceil((TOTAL_DURATION_MS - elapsedMs) / 1000));

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-[#040612] text-white p-6 overflow-hidden select-none">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-[110px] pointer-events-none" />

      {/* Top Bar with Skip Option */}
      <div className="w-full flex justify-end z-10">
        <button
          type="button"
          onClick={handleProceed}
          className="text-xs text-slate-500 hover:text-slate-300 px-3 py-1 rounded-full transition-colors cursor-pointer"
        >
          Passer ({remainingSeconds}s)
        </button>
      </div>

      {/* Center Group: PDF Icon, HolPdf Name, Progress Bar */}
      <div className="flex flex-col items-center justify-center text-center z-10 my-auto">
        {/* 1. Logo: Un simple fichier PDF */}
        <div className="relative mb-6 drop-shadow-[0_10px_25px_rgba(239,68,68,0.25)] transition-transform duration-300 hover:scale-105">
          <svg
            width="88"
            height="108"
            viewBox="0 0 88 108"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="overflow-visible"
          >
            {/* Sheet background */}
            <path
              d="M6 10C6 5.58172 9.58172 2 14 2H58L82 26V98C82 102.418 78.4183 106 74 106H14C9.58172 106 6 102.418 6 98V10Z"
              fill="#0F172A"
              stroke="#334155"
              strokeWidth="2"
            />
            {/* Folded corner flap */}
            <path
              d="M58 2V22C58 24.2091 59.7909 26 62 26H82L58 2Z"
              fill="#1E293B"
              stroke="#334155"
              strokeWidth="1.5"
            />

            {/* Document internal simulated text lines */}
            <rect x="18" y="34" width="30" height="3" rx="1.5" fill="#475569" />
            <rect x="18" y="43" width="52" height="3" rx="1.5" fill="#334155" />
            <rect x="18" y="52" width="46" height="3" rx="1.5" fill="#334155" />

            {/* Red PDF Badge */}
            <g>
              <rect
                x="14"
                y="67"
                width="60"
                height="26"
                rx="6"
                fill="#DC2626"
                className="drop-shadow-sm"
              />
              <text
                x="44"
                y="84"
                fill="#FFFFFF"
                fontSize="14"
                fontWeight="800"
                fontFamily="system-ui, -apple-system, sans-serif"
                textAnchor="middle"
                letterSpacing="1"
              >
                PDF
              </text>
            </g>
          </svg>
        </div>

        {/* 2. Nom de l'application: "Hol" en blanc et "Pdf" en rouge */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-7 flex items-center">
          <span className="text-white">Hol</span>
          <span className="text-red-500">Pdf</span>
        </h1>

        {/* 3. Barre de progression (10 secondes) */}
        <div className="w-64 max-w-xs flex flex-col items-center gap-2.5">
          <div className="w-full h-1.5 bg-slate-800/90 rounded-full overflow-hidden p-[1px] border border-slate-700/60 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-75 ease-out shadow-[0_0_8px_rgba(239,68,68,0.7)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <span className="text-[11px] text-slate-500 font-mono tracking-wider">
            {remainingSeconds > 0 ? `Chargement... ${remainingSeconds}s` : 'Redirection...'}
          </span>
        </div>
      </div>

      {/* Bottom note: Nom de l'app, tous droits réservés et version */}
      <div className="z-10 pb-4 text-center">
        <p className="text-[11px] text-slate-400 tracking-wide flex items-center justify-center gap-1.5">
          <span>
            <span className="text-white font-bold">Hol</span>
            <span className="text-red-500 font-bold">Pdf</span>
          </span>
          <span className="text-slate-600">•</span>
          <span>Tous droits réservés.</span>
          <span className="text-slate-600">•</span>
          <span className="font-mono text-slate-400">v1.0.0</span>
        </p>
      </div>
    </div>
  );
};
