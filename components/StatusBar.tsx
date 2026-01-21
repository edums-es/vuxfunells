import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

const StatusBar: React.FC<{ theme?: 'light' | 'dark' }> = ({ theme = 'light' }) => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const colorClass = theme === 'light' ? 'text-black' : 'text-white';

  return (
    <div className={`absolute top-0 left-0 w-full px-6 pt-3 pb-2 flex justify-between items-center z-50 text-[15px] font-semibold ${colorClass}`}>
      <span className="w-12 text-center">{time}</span>
      <div className="flex items-center gap-1.5">
        <Signal className="w-4 h-4 fill-current" />
        <Wifi className="w-4 h-4" />
        <Battery className="w-5 h-5" />
      </div>
    </div>
  );
};

export default StatusBar;
