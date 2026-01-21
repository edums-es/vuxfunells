import React from 'react';
import { Music2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface TikTokLoadingProps {
  theme?: 'dark' | 'light';
}

const TikTokLoading: React.FC<TikTokLoadingProps> = ({ theme = 'light' }) => {
  return (
    <div className={cn(
      "h-full w-full flex flex-col items-center justify-center z-50",
      theme === 'dark' ? "bg-black" : "bg-white"
    )}>
      {/* TikTok Logo Construction */}
      <div className="relative mb-6 animate-pulse">
        {/* Simplified TikTok Logo using SVG logic or creative CSS/Icon */}
        <div className="w-20 h-20 relative">
             {/* Cyan offset */}
             <Music2 className="w-20 h-20 text-[#25F4EE] absolute top-[-2px] left-[-2px] opacity-80" strokeWidth={2.5} />
             {/* Red offset */}
             <Music2 className="w-20 h-20 text-[#FE2C55] absolute top-[2px] left-[2px] opacity-80" strokeWidth={2.5} />
             {/* Main White */}
             <Music2 className={cn("w-20 h-20 absolute top-0 left-0 mix-blend-multiply", theme === 'dark' ? "text-white" : "text-black")} strokeWidth={2.5} />
        </div>
      </div>
      <div className={cn("w-32 h-1 rounded-full overflow-hidden", theme === 'dark' ? "bg-gray-800" : "bg-gray-200")}>
          <div className={cn("h-full w-1/2 animate-[loading_1s_ease-in-out_infinite]", theme === 'dark' ? "bg-white" : "bg-black")}></div>
      </div>
      <style>{`
        @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default TikTokLoading;