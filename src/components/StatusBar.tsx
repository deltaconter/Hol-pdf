import React from 'react';
import { Wifi } from 'lucide-react';

interface StatusBarProps {
  time?: string;
  theme?: 'dark' | 'light';
}

export const StatusBar: React.FC<StatusBarProps> = ({
  time = '9:41',
  theme = 'dark',
}) => {
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const strokeColor = theme === 'dark' ? 'white' : '#0f172a';

  return (
    <div
      className={`w-full px-7 pt-3.5 pb-2 flex items-center justify-between text-xs font-semibold select-none ${textColor}`}
    >
      <span>{time}</span>
      <div className="flex items-center gap-1.5">
        {/* Cellular signal bars */}
        <div className="flex items-end gap-0.5 h-2.5">
          <span className="w-[3px] h-1 rounded-xs bg-current"></span>
          <span className="w-[3px] h-1.5 rounded-xs bg-current"></span>
          <span className="w-[3px] h-2 rounded-xs bg-current"></span>
          <span className="w-[3px] h-2.5 rounded-xs bg-current"></span>
        </div>
        <Wifi size={13} strokeWidth={2.4} />
        {/* Battery icon */}
        <div className="relative w-5 h-2.5 border border-current rounded-[3px] p-0.5 flex items-center">
          <div className="h-full w-3 bg-current rounded-[1.5px]"></div>
          <div
            className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-1 rounded-r-xs bg-current"
          ></div>
        </div>
      </div>
    </div>
  );
};
