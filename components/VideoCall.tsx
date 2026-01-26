import React, { useState, useEffect } from 'react';
import { PhoneOff, Video, Mic, RefreshCw, Volume2, User, Phone } from 'lucide-react';
import { cn } from '../lib/utils';
import StatusBar from './StatusBar';

interface VideoCallProps {
  onEndCall: () => void;
  doctorName: string;
  doctorAvatarUrl: string;
  videoUrl?: string;
  audioUrl?: string;
  duration?: number;
  theme?: 'light' | 'dark';
}

type CallState = 'incoming' | 'connecting' | 'connected' | 'ending';

function isProbablyDirectVideoUrl(url: string) {
  const u = url.toLowerCase();
  return (
    u.endsWith('.mp4') ||
    u.endsWith('.webm') ||
    u.endsWith('.ogg') ||
    u.endsWith('.mov') ||
    u.endsWith('.m4v')
  );
}

function getEmbedUrl(url: string) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();

    if (host.includes('youtu.be')) {
      const id = u.pathname.split('/').filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1` : null;
    }

    if (host.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1`;
      if (u.pathname.startsWith('/embed/')) return url;
    }

    if (host.includes('vimeo.com')) {
      const parts = u.pathname.split('/').filter(Boolean);
      const id = parts.find((p) => /^\d+$/.test(p));
      return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : null;
    }

    return null;
  } catch {
    return null;
  }
}

const VideoCall: React.FC<VideoCallProps> = ({ onEndCall, doctorName, doctorAvatarUrl, videoUrl, audioUrl, duration = 60, theme = 'dark' }) => {
  const [callState, setCallState] = useState<CallState>('incoming');
  const [timeLeft, setTimeLeft] = useState(duration); 

  const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null;
  const useIframe = !!(videoUrl && embedUrl && !isProbablyDirectVideoUrl(videoUrl));

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (callState === 'connecting') {
        const connectTimer = setTimeout(() => {
            setCallState('connected');
        }, 2000);
        return () => clearTimeout(connectTimer);
    }

    if (callState === 'connected') {
        // We rely on onEnded event of media elements.
        // We ONLY use this interval for visual countdown if needed, but NOT for ending call automatically
        // unless media is missing.
        interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    // Only hangup if NO media is present to drive the flow
                    if (!videoUrl && !audioUrl) {
                        handleHangup();
                        return 0;
                    }
                    if (useIframe) {
                        handleHangup();
                        return 0;
                    }
                    // If media exists, let it finish naturally. 
                    // Do NOT auto-hangup here to avoid premature cuts.
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState, videoUrl, audioUrl, useIframe]); // Added videoUrl/audioUrl dependencies

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    if (callState === 'connected') {
        if (videoUrl && videoRef.current && !useIframe) {
            videoRef.current.play().catch(() => setShowPlayButton(true));
        } else if (audioUrl && audioRef.current) {
            audioRef.current.play().catch(() => setShowPlayButton(true));
        }
    }
  }, [callState, videoUrl, audioUrl, useIframe]);

  const handleManualPlay = () => {
      if (videoUrl && videoRef.current && !useIframe) {
          videoRef.current.play();
      } else if (audioUrl && audioRef.current) {
          audioRef.current.play();
      }
      setShowPlayButton(false);
      setVideoError(false);
  };

  const handleAnswer = () => {
    setCallState('connecting');
  };

  const handleHangup = () => {
    setCallState('ending');
    setTimeout(() => {
      onEndCall();
    }, 1500); 
  };

  return (
    <div className={cn(
      "h-full w-full relative overflow-hidden flex flex-col",
      theme === 'dark' ? "bg-gray-900" : "bg-gray-100"
    )}>
      <StatusBar theme={callState === 'connected' ? 'light' : (theme === 'dark' ? 'dark' : 'light')} />
      
      {/* Content based on state */}
      <div className="absolute inset-0 flex flex-col items-center">
        
        {/* INCOMING OR CONNECTING STATE */}
        {(callState === 'incoming' || callState === 'connecting') && (
           <div className="w-full h-full flex flex-col items-center pt-24 relative z-10">
              {/* Blurred Background */}
              <div 
                 className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl scale-110" 
                 style={{ backgroundImage: `url(${doctorAvatarUrl})` }} 
              />
              
              <div className="flex flex-col items-center z-20">
                <div className={cn(
                  "w-32 h-32 rounded-full mb-6 p-1 border-2 shadow-2xl overflow-hidden",
                  theme === 'dark' ? "border-white/20" : "border-gray-900/10"
                )}>
                    <img src={doctorAvatarUrl} alt="Doctor" className="w-full h-full object-cover" />
                </div>
                <h2 className={cn("text-3xl font-bold mb-2", theme === 'dark' ? "text-white" : "text-gray-900")}>{doctorName}</h2>
                <p className={cn("text-lg flex items-center gap-2", theme === 'dark' ? "text-gray-300" : "text-gray-600")}>
                    {callState === 'incoming' ? (
                        <>
                            <Video className="w-5 h-5" /> Chamada de vídeo do WhatsApp
                        </>
                    ) : (
                        'Conectando...'
                    )}
                </p>
              </div>

              {/* Incoming Buttons */}
              {callState === 'incoming' && (
                 <div className="absolute bottom-16 w-full px-12 flex justify-between items-center z-30 animate-in slide-in-from-bottom-10 fade-in duration-500">
                     <div className="flex flex-col items-center gap-2">
                        <button 
                            onClick={handleHangup} // Optional: user declines
                            className="w-[70px] h-[70px] bg-[#FF3B30] rounded-full flex items-center justify-center shadow-lg transition active:scale-95"
                        >
                            <PhoneOff className="text-white w-8 h-8 fill-current" />
                        </button>
                        <span className={cn("text-sm font-medium", theme === 'dark' ? "text-white" : "text-gray-900")}>Recusar</span>
                     </div>

                     <div className="flex flex-col items-center gap-2">
                        <button 
                            onClick={handleAnswer}
                            className="w-[70px] h-[70px] bg-[#34C759] rounded-full flex items-center justify-center shadow-lg animate-pulse transition active:scale-95"
                        >
                            <Video className="text-white w-8 h-8 fill-current" />
                        </button>
                        <span className={cn("text-sm font-medium", theme === 'dark' ? "text-white" : "text-gray-900")}>Aceitar</span>
                     </div>
                 </div>
              )}
              
              {/* Connecting Buttons (Just hangup) */}
              {callState === 'connecting' && (
                  <div className="absolute bottom-16 w-full flex justify-center z-30">
                     <button 
                        onClick={handleHangup} 
                        className="w-[70px] h-[70px] bg-[#FF3B30] rounded-full flex items-center justify-center shadow-lg"
                     >
                        <PhoneOff className="text-white w-8 h-8 fill-current" />
                     </button>
                  </div>
              )}
           </div>
        )}

        {/* CONNECTED STATE */}
        {callState === 'connected' && (
           <div className="w-full h-full bg-black relative">
                {/* Active Video/Audio Feed */}
                {videoUrl ? (
                  <>
                    {useIframe ? (
                      <iframe
                        src={embedUrl || videoUrl}
                        className="w-full h-full"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video 
                        ref={videoRef}
                        src={videoUrl} 
                        className="w-full h-full object-cover animate-in fade-in duration-1000"
                        playsInline
                        muted={false}
                        controls={false}
                        preload="auto"
                        onEnded={handleHangup}
                        onError={(e) => {
                          console.error('Video Error:', e);
                          setVideoError(true);
                        }}
                      />
                    )}
                     {videoError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-neutral-900/90 text-center p-6">
                            <p className="text-red-500 font-bold mb-2">Erro ao carregar vídeo</p>
                            <p className="text-white/60 text-sm mb-4">O arquivo pode estar corrompido ou o formato não é suportado pelo navegador.</p>
                            <button 
                                onClick={handleHangup}
                                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm font-medium transition-colors"
                            >
                                Encerrar chamada
                            </button>
                        </div>
                     )}
                     {!videoError && showPlayButton && !useIframe && (
                         <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/40">
                             <button 
                                 onClick={handleManualPlay}
                                className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
                            >
                                <Video className="w-10 h-10 text-white fill-current" />
                            </button>
                        </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full relative animate-in fade-in duration-1000">
                       {/* Background Image (Avatar) */}
                       <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${doctorAvatarUrl})` }} />
                       <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                       
                       {/* Audio Element */}
                       {audioUrl && (
                           <audio 
                               ref={audioRef}
                               src={audioUrl}
                               onEnded={handleHangup}
                               onError={() => setVideoError(true)}
                           />
                       )}

                       {/* Voice Call UI */}
                       <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                           <div className="w-40 h-40 rounded-full p-1 border-4 border-white/10 shadow-2xl overflow-hidden relative">
                               <img src={doctorAvatarUrl} alt="Doctor" className="w-full h-full object-cover" />
                               {/* Pulsing rings */}
                               <div className="absolute inset-0 rounded-full border-4 border-green-500/30 animate-ping" />
                           </div>
                           <h2 className="text-3xl font-bold text-white mt-8 mb-2 tracking-tight">{doctorName}</h2>
                           <p className="text-white/60 text-lg font-medium">Chamada de voz</p>
                       </div>

                       {videoError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-neutral-900/90 text-center p-6">
                            <p className="text-red-500 font-bold mb-2">Erro ao carregar áudio</p>
                            <button onClick={handleHangup} className="px-6 py-2 bg-white/10 rounded-full text-white text-sm">Encerrar</button>
                        </div>
                       )}

                       {!videoError && showPlayButton && (
                         <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/40">
                             <button onClick={handleManualPlay} className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-all">
                                <Video className="w-10 h-10 text-white fill-current" />
                            </button>
                        </div>
                       )}
                  </div>
                )}
                
                {/* Top Info Overlay */}
                <div className="absolute top-12 left-0 w-full flex justify-between items-start px-4 z-20">
                    <div className="bg-black/30 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-white text-sm font-medium">
                            {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </span>
                    </div>

                    <button 
                        onClick={handleHangup}
                        className="bg-black/30 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-medium hover:bg-black/50 transition-colors"
                    >
                        Pular Vídeo
                    </button>
                    
                    {/* PIP (User Self View) */}
                    <div className="w-28 h-40 bg-gray-900 rounded-xl overflow-hidden border border-white/20 shadow-2xl">
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <User className="text-white/40 w-8 h-8" />
                        </div>
                    </div>
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-20 pb-10 px-6 z-30">
                    <div className="text-white mb-6">
                        <h3 className="text-2xl font-bold">{doctorName}</h3>
                        <p className="text-white/80 text-sm">WhatsApp Video</p>
                    </div>

                    <div className="flex justify-between items-center bg-gray-800/90 backdrop-blur-xl rounded-[35px] p-2 px-5 h-[80px]">
                        <button className="p-3 bg-white/10 rounded-full">
                        <Volume2 className="text-white w-6 h-6" />
                        </button>
                        <button className="p-3">
                        <Video className="text-white w-6 h-6 fill-current" />
                        </button>
                        <button className="p-3">
                        <Mic className="text-white w-6 h-6 fill-current" />
                        </button>
                        <button className="p-3">
                        <RefreshCw className="text-white w-6 h-6" />
                        </button>
                        <button 
                        onClick={handleHangup} 
                        className="w-14 h-14 bg-[#FF3B30] rounded-full flex items-center justify-center shadow-lg transform active:scale-95 transition-transform"
                        >
                        <PhoneOff className="text-white w-7 h-7 fill-current" />
                        </button>
                    </div>
                </div>
           </div>
        )}

        {/* ENDING STATE */}
        {callState === 'ending' && (
           <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center relative z-40">
               <h2 className="text-2xl font-semibold text-gray-400 mb-2">Encerrando...</h2>
           </div>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
