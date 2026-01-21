import React, { useState, useEffect } from 'react';
import { Lock, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import StatusBar from './StatusBar';

interface LockScreenProps {
  onUnlock: () => void;
  doctorName: string;
  wallpaperUrl: string;
  theme?: 'light' | 'dark';
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, doctorName, wallpaperUrl, theme = 'dark' }) => {
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
      setDateStr(now.toLocaleDateString('pt-BR', options));
    };
    updateTime();
  }, []);

  const handleNotificationClick = () => {
    setIsUnlocking(true);
    setTimeout(onUnlock, 600);
  };

  return (
    <div 
      className={`h-full w-full bg-cover bg-center flex flex-col items-center relative overflow-hidden transition-all duration-700 ${isUnlocking ? 'scale-110 blur-sm opacity-0' : 'scale-100'}`}
      style={{ backgroundImage: `url(${wallpaperUrl})` }}
    >
      <StatusBar theme="dark" />
      
      <div className="mt-12 flex flex-col items-center text-white drop-shadow-lg">
        <Lock className="w-5 h-5 mb-2 opacity-90 fill-white/20" />
        <h1 className="text-[5.5rem] font-medium leading-none tracking-tight font-[system-ui]">{timeStr}</h1>
        <p className="text-xl font-medium mt-2 capitalize opacity-90">{dateStr}</p>
      </div>

      {/* Notification Stack iOS Style */}
      <div className="w-full px-3 mt-8 space-y-2">
        <div 
          onClick={handleNotificationClick}
          className={cn(
            "backdrop-blur-xl rounded-[20px] p-4 shadow-sm active:scale-[0.98] transition-transform cursor-pointer animate-in slide-in-from-bottom-8 fade-in duration-700",
            theme === 'dark' ? "bg-neutral-900/80 border border-white/10" : "bg-white/70"
          )}
        >
          <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-2">
               <div className="bg-[#25D366] w-5 h-5 rounded-[5px] flex items-center justify-center">
                 <MessageCircle className="w-3.5 h-3.5 text-white fill-current" />
               </div>
               <span className={cn("text-[13px] font-semibold uppercase opacity-70", theme === 'dark' ? "text-gray-300" : "text-gray-800")}>WHATSAPP</span>
             </div>
             <span className={cn("text-[13px] opacity-70", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>agora</span>
          </div>
          <div>
            <h4 className={cn("font-bold text-[15px]", theme === 'dark' ? "text-white" : "text-black")}>{doctorName}</h4>
            <p className={cn("text-[15px] leading-snug mt-0.5", theme === 'dark' ? "text-gray-200" : "text-black")}>
              Posso te explicar em 2 minutos o que pode estar impedindo sua gravidez 💛
            </p>
          </div>
        </div>
      </div>

      {/* Flashlight/Camera Buttons */}
      <div className="absolute bottom-12 left-0 right-0 px-12 flex justify-between">
         <div className="w-[50px] h-[50px] rounded-full bg-black/40 backdrop-blur-lg flex items-center justify-center">
            {/* Flashlight placeholder */}
            <div className="w-6 h-6 bg-white rounded-full opacity-80" />
         </div>
         <div className="w-[50px] h-[50px] rounded-full bg-black/40 backdrop-blur-lg flex items-center justify-center">
            {/* Camera placeholder */}
            <div className="w-6 h-6 bg-white rounded-full opacity-80" />
         </div>
      </div>
    </div>
  );
};

export default LockScreen;
