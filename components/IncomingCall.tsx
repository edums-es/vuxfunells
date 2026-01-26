import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, Grid, Volume2, Plus, Video, User } from 'lucide-react';
import { cn } from '../lib/utils';
import StatusBar from './StatusBar';

interface IncomingCallProps {
  onAnswer: () => void;
  doctorName: string;
  doctorAvatarUrl: string;
  duration?: number;
  ringtoneUrl?: string;
  voiceUrl?: string;
  theme?: 'light' | 'dark';
}

const IncomingCall: React.FC<IncomingCallProps> = ({ 
  onAnswer, 
  doctorName, 
  doctorAvatarUrl, 
  duration = 12, 
  ringtoneUrl, 
  voiceUrl,
  theme = 'dark'
}) => {
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected'>('ringing');
  const [timer, setTimer] = useState(0);
  const [ringtoneNeedsGesture, setRingtoneNeedsGesture] = useState(false);
  const ringtoneRef = React.useRef<HTMLAudioElement | null>(null);
  const voiceRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Play ringtone when component mounts if url provided
    if (ringtoneUrl && callStatus === 'ringing') {
       ringtoneRef.current = new Audio(ringtoneUrl);
       ringtoneRef.current.loop = true;
       ringtoneRef.current.play().catch(() => setRingtoneNeedsGesture(true));
    }

    return () => {
       if (ringtoneRef.current) {
         ringtoneRef.current.pause();
         ringtoneRef.current = null;
       }
    };
  }, [ringtoneUrl, callStatus]);

  useEffect(() => {
    if (!ringtoneNeedsGesture) return;
    if (!ringtoneUrl) return;
    if (callStatus !== 'ringing') return;

    const tryPlay = () => {
      if (!ringtoneRef.current) {
        ringtoneRef.current = new Audio(ringtoneUrl);
        ringtoneRef.current.loop = true;
      }
      ringtoneRef.current.play().then(() => setRingtoneNeedsGesture(false)).catch(() => {});
    };

    window.addEventListener('pointerdown', tryPlay, { once: true });
    return () => window.removeEventListener('pointerdown', tryPlay);
  }, [ringtoneNeedsGesture, ringtoneUrl, callStatus]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);

      // Auto end call delay
      const autoEnd = setTimeout(() => {
        onAnswer(); 
      }, duration * 1000); 

      return () => {
        clearInterval(interval);
        clearTimeout(autoEnd);
        if (voiceRef.current) {
            voiceRef.current.pause();
            voiceRef.current = null;
        }
      };
    } else if (callStatus === 'ringing') {
        // Handle ringing state
        // If autoStartVideo is enabled, we might want to auto-accept?
        // No, usually autoStartVideo is handled by parent onAnswer.
        // But if there's a duration for RINGING, we should probably respect it?
        // Let's assume 'duration' prop is for the CONNECTED call duration (VSL/Audio).
        // If it's for ringing, we need a separate prop.
    }
  }, [callStatus, onAnswer, voiceUrl, duration]);

  const handleAccept = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current = null;
    }
    if (voiceUrl) {
      voiceRef.current = new Audio(voiceUrl);
      voiceRef.current.play().catch(() => {});
    }
    setCallStatus('connected');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // iOS Call Button Component
  const CallButton = ({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
    <div className="flex flex-col items-center gap-2">
      <button className={`w-[75px] h-[75px] rounded-full flex items-center justify-center transition-all ${active ? 'bg-white text-gray-900' : 'bg-white/10 backdrop-blur-md text-white'}`}>
        <Icon className="w-8 h-8 fill-current" strokeWidth={1.5} />
      </button>
      <span className="text-white text-[13px] font-medium tracking-wide">{label}</span>
    </div>
  );

  return (
    <div className={cn(
      "h-full w-full flex flex-col relative overflow-hidden transition-all duration-700",
      theme === 'dark' ? "bg-gray-900" : "bg-gray-100"
    )}>
      {/* Background Image with heavy blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40 blur-3xl scale-125"
        style={{ backgroundImage: `url(${doctorAvatarUrl})` }}
      />
      
      {/* Dark overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-800/50 via-gray-900/80 to-black/90" />

      <StatusBar theme="dark" />

      {/* Main Content */}
      <div className={`z-10 flex flex-col pt-24 px-6 items-center transition-all duration-500 ${callStatus === 'connected' ? 'scale-90 opacity-90' : ''}`}>
        <div className="flex flex-col items-center">
           <div className={`rounded-full overflow-hidden shadow-2xl border-0 transition-all duration-500 ${callStatus === 'connected' ? 'w-24 h-24 mb-3' : 'w-32 h-32 mb-5'}`}>
             <img src={doctorAvatarUrl} alt="Doctor" className="w-full h-full object-cover" />
           </div>
           
           <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">{doctorName}</h2>
           
           <div className="flex items-center text-white/80 text-lg font-medium">
             {callStatus === 'ringing' ? (
               <span className="animate-pulse">WhatsApp de áudio...</span>
             ) : (
               <span className="text-white">{formatTime(timer)}</span>
             )}
           </div>
        </div>
      </div>

      {/* Connected State - iOS Grid */}
      {callStatus === 'connected' && (
        <div className="z-20 flex-1 flex flex-col justify-center px-8 animate-in fade-in slide-in-from-bottom-10 duration-500">
           <div className="grid grid-cols-3 gap-x-6 gap-y-8 mb-10">
              <CallButton icon={Mic} label="mudo" />
              <CallButton icon={Grid} label="teclado" />
              <CallButton icon={Volume2} label="audio" active />
              <CallButton icon={Plus} label="adicionar" />
              <CallButton icon={Video} label="FaceTime" />
              <CallButton icon={User} label="contatos" />
           </div>
        </div>
      )}

      {/* Bottom Action Buttons */}
      <div className="z-20 w-full pb-14 px-8 absolute bottom-0">
        {callStatus === 'ringing' ? (
          <div className="flex justify-between items-center w-full max-w-sm mx-auto">
             <div className="flex flex-col items-center gap-3">
                <button className="w-[75px] h-[75px] bg-[#FF3B30] rounded-full flex items-center justify-center shadow-lg transition active:scale-95 active:brightness-90">
                  <PhoneOff className="text-white w-9 h-9 fill-current" />
                </button>
                <span className="text-white font-medium text-sm">Recusar</span>
             </div>

             <div className="flex flex-col items-center gap-3">
                <button 
                  onClick={handleAccept}
                  className="w-[75px] h-[75px] bg-[#34C759] rounded-full flex items-center justify-center shadow-lg animate-pulse transition active:scale-95 active:brightness-90"
                >
                  <Phone className="text-white w-9 h-9 fill-current" />
                </button>
                <span className="text-white font-medium text-sm">Aceitar</span>
             </div>
          </div>
        ) : (
          <div className="flex justify-center items-center">
             <button 
               onClick={onAnswer}
               className="w-[75px] h-[75px] bg-[#FF3B30] rounded-full flex items-center justify-center shadow-lg transform transition active:scale-95"
             >
               <PhoneOff className="text-white w-9 h-9 fill-current" />
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomingCall;
