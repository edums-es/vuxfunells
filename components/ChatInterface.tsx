import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Video, Phone, Send, Mic, Plus, Play, Pause, Camera } from 'lucide-react';
import { ChatMessage, AudioConfig } from '../types';
import StatusBar from './StatusBar';
import { cn } from '../lib/utils';

interface ChatInterfaceProps {
  script: ChatMessage[];
  onAction: (action: string) => void;
  startDelay?: number;
  initialHistory: ChatMessage[];
  onHistoryUpdate: (msgs: ChatMessage[]) => void;
  doctorName: string;
  doctorAvatarUrl: string;
  onUserMessage?: (text: string) => void;
  theme?: 'dark' | 'light';
  audioConfig?: AudioConfig;
}

const AudioMessage: React.FC<{ duration: string; avatarUrl: string; audioUrl?: string }> = ({ duration, avatarUrl, audioUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const togglePlay = () => {
      if (!audioRef.current || !audioUrl) return;

      if (isPlaying) {
          audioRef.current.pause();
      } else {
          audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
      if (audioRef.current) {
          const current = audioRef.current.currentTime;
          const total = audioRef.current.duration || 1;
          setProgress((current / total) * 100);
          
          if (current >= total) {
              setIsPlaying(false);
              setProgress(0);
          }
      }
  };

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <audio 
          ref={audioRef} 
          src={audioUrl} 
          onTimeUpdate={handleTimeUpdate} 
          onEnded={() => { setIsPlaying(false); setProgress(0); }}
          className="hidden"
      />
      <button 
        onClick={togglePlay}
        disabled={!audioUrl}
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${audioUrl ? 'bg-gray-200 hover:bg-gray-300 text-gray-600' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
      >
        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
      </button>
      <div className="flex-1 flex flex-col justify-center">
         <div className="flex items-center gap-[2px] h-6">
            {[...Array(25)].map((_, i) => (
              <div 
                key={i} 
                className={`w-[3px] rounded-full ${i / 25 * 100 < progress ? 'bg-blue-500' : 'bg-gray-400'} ${isPlaying ? 'animate-pulse' : ''}`}
                style={{ height: `${Math.max(30, Math.random() * 100)}%` }}
              ></div>
            ))}
         </div>
         <div className="flex justify-between text-[11px] text-gray-500 mt-1">
            <span>{isPlaying && audioRef.current ? formatTime(audioRef.current.currentTime) : '0:00'}</span>
            <span>{duration}</span>
         </div>
      </div>
      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-100">
         <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
         <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
      </div>
    </div>
  );
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  script = [], 
  onAction, 
  startDelay = 0, 
  initialHistory = [], 
  onHistoryUpdate, 
  doctorName, 
  doctorAvatarUrl, 
  onUserMessage,
  theme = 'light',
  audioConfig
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialHistory);
  
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (!script || script.length === 0) return 0;
    const firstUnplayedIndex = script.findIndex(scriptMsg => 
      !initialHistory.some(historyMsg => historyMsg.id === scriptMsg.id)
    );
    return firstUnplayedIndex === -1 ? script.length : firstUnplayedIndex;
  });
  
  const [typingActivity, setTypingActivity] = useState<'text' | 'audio' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Sound Effects
  useEffect(() => {
    if (audioConfig?.backgroundMusicUrl) {
      const bgAudio = new Audio(audioConfig.backgroundMusicUrl);
      bgAudio.loop = audioConfig.loop ?? true;
      bgAudio.volume = audioConfig.backgroundMusicVolume ?? 0.1;
      const playPromise = bgAudio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Auto-play was prevented", error);
        });
      }
      
      return () => {
        bgAudio.pause();
        bgAudio.currentTime = 0;
      };
    }
  }, [audioConfig?.backgroundMusicUrl, audioConfig?.backgroundMusicVolume, audioConfig?.loop]);

  const playMessageSound = (type: 'sent' | 'received') => {
    // Vibration
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
       navigator.vibrate(200);
    }

    if (audioConfig?.messageSoundEnabled) {
       const soundUrl = type === 'sent' 
         ? 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_c8c8a73467.mp3' // Pop sound
         : 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_736a5124b6.mp3'; // Notification sound
       const audio = new Audio(soundUrl);
       audio.volume = 0.5;
       audio.play().catch(() => {});
    }
  };

  const prevMessagesLength = useRef(messages.length);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Sync existing messages with updated script content (live preview)
    setMessages(prev => {
        let hasChanges = false;
        const newMsgs = prev.map(m => {
            const s = script.find(sm => sm.id === m.id);
            if (s && (s.content !== m.content || s.mediaUrl !== m.mediaUrl || s.forceVideo !== m.forceVideo || JSON.stringify(s.quickReplies) !== JSON.stringify(m.quickReplies))) {
                hasChanges = true;
                return { ...m, ...s };
            }
            return m;
        });
        return hasChanges ? newMsgs : prev;
    });
  }, [script]);

  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
        scrollToBottom();
    }
    prevMessagesLength.current = messages.length;

    const timer = setTimeout(() => {
        onHistoryUpdate(messages);
    }, 0);
    return () => clearTimeout(timer);
  }, [messages, typingActivity, onHistoryUpdate]);

  useEffect(() => {
    if (currentIndex >= script.length) return;

    const msg = script[currentIndex];
    
    // Only proceed automatically if it's the doctor's turn
    if (msg.sender === 'doctor') {
         const isFirstInSession = messages.length === initialHistory.length; 
         const initialWait = (isFirstInSession) ? startDelay : 500;
         
         let stepTimer: ReturnType<typeof setTimeout>;
         
         const startProcess = setTimeout(() => {
             // Set status based on message type
             setTypingActivity(msg.type === 'audio' ? 'audio' : 'text');
             
             const typingDuration = msg.type === 'audio' ? 2500 : 1000 + (msg.content.length * 15); 

             stepTimer = setTimeout(() => {
               setTypingActivity(null);
               setMessages(prev => {
                   if (prev.find(m => m.id === msg.id)) return prev;
                   playMessageSound('received');
                   return [...prev, msg];
               });
               
               if (msg.action) {
                  // INCREASED DELAY: Give user 4.5 seconds to read the last message before action triggers
                  setTimeout(() => onAction(msg.action!), 4500);
               } else if (msg.requiresInput) {
                  // Stop and wait for user
               } else {
                  // Calculate extra delay if it was an audio message to simulate user listening
                  const listeningBuffer = msg.type === 'audio' ? 3500 : 0;
                  
                  setTimeout(() => {
                     setCurrentIndex(prev => prev + 1);
                  }, 1000 + (msg.delay || 0) + listeningBuffer);
               }
             }, typingDuration);
         }, initialWait);

         return () => {
            clearTimeout(startProcess);
            clearTimeout(stepTimer);
         };
    }
  }, [currentIndex, script, startDelay, onAction]); 

  const handleSendMessage = (textOverride?: string) => {
    const text = textOverride || inputValue;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      content: text,
      sender: 'user',
      type: 'text',
      delay: 0
    };

    onUserMessage?.(text);
    playMessageSound('sent');
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    
    if (currentIndex < script.length) {
        const currentScriptMsg = script[currentIndex];
        
        // CHECK CONDITIONAL LOGIC FOR VIDEO
        if (currentScriptMsg.id === '7') { // ID 7 is the question about video
            const lowerInput = inputValue.toLowerCase();
            const positiveKeywords = ['sim', 'pode', 'quero', 'ok', 'claro', 'bora', 'com certeza'];
            const isPositive = positiveKeywords.some(w => lowerInput.includes(w));
            
            setTypingActivity('text'); 
            
            setTimeout(() => {
               setTypingActivity(null);
               if (isPositive) {
                  onAction('open_video');
               } else {
                  // Handle rejection politely and move to PART 2
                  const rejectionResponse: ChatMessage = {
                      id: `doc-reject-${Date.now()}`,
                      content: "Sem problemas, entendo perfeitamente. Vamos continuar por aqui então. 💛",
                      sender: 'doctor',
                      type: 'text',
                      delay: 0
                  };
                  setMessages(prev => [...prev, rejectionResponse]);
                  setTimeout(() => onAction('skip_video'), 2000);
               }
            }, 1500);

            // Advance script index so we don't repeat
            setCurrentIndex(prev => prev + 1);
            return;
        }

        if (currentScriptMsg.requiresInput || currentScriptMsg.sender === 'doctor') {
             setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
             }, 800);
        }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  // Helper to render the status text
  const getStatusText = () => {
      if (typingActivity === 'audio') return 'gravando áudio...';
      if (typingActivity === 'text') return 'digitando...';
      return 'Online';
  };

  return (
    <div className={cn("flex flex-col h-full relative transition-colors", theme === 'dark' ? "bg-neutral-900" : "bg-[#E5DDD5]")}>
      <StatusBar theme={theme} />
      
      {/* WhatsApp Header (iOS) */}
      <div className={cn(
        "pt-10 pb-2 px-3 flex items-center border-b z-10 backdrop-blur-md bg-opacity-90 sticky top-0 transition-colors",
        theme === 'dark' ? "bg-neutral-900/90 border-white/10" : "bg-[#F6F6F6] border-gray-300"
      )}>
        <div className="flex items-center text-[#007AFF] -ml-1">
           <ArrowLeft className="w-6 h-6" />
           <span className="text-[17px]">Voltar</span>
        </div>
        
        <div className="flex-1 flex flex-col items-center mr-6">
           <h3 className={cn("font-semibold text-[17px]", theme === 'dark' ? "text-white" : "text-black")}>{doctorName}</h3>
           {/* Dynamic Status Text */}
           <p className={`text-[12px] transition-all duration-300 ${typingActivity ? 'text-[#007AFF] font-medium' : 'text-gray-500'}`}>
              {getStatusText()}
           </p>
        </div>
        
        <div className="flex gap-4 text-[#007AFF]">
          <Video className="w-6 h-6" />
          <Phone className="w-6 h-6" />
        </div>
      </div>

      {/* Chat Area - Added scrollbar-hide class */}
      <div 
        ref={chatContainerRef}
        className={cn(
        "flex-1 overflow-y-auto p-4 space-y-3 relative scrollbar-hide transition-colors",
        theme === 'dark' ? "bg-neutral-950" : "bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"
      )}>
        
        {initialHistory.length === 0 && (
            <div className="flex justify-center my-4 animate-in fade-in zoom-in duration-500">
                <div className={cn(
                  "rounded-lg p-2 shadow-sm max-w-[85%] text-center border transition-colors",
                  theme === 'dark' ? "bg-yellow-900/30 border-yellow-700/50 text-yellow-200" : "bg-[#FFF3C2] border-[#FBE3B8] text-gray-600"
                )}>
                    <p className="text-[11px] leading-3">As mensagens e as chamadas desta conversa são protegidas com a criptografia de ponta a ponta.</p>
                </div>
            </div>
        )}

        {messages.map((msg, idx) => (
          <div 
            key={msg.id} 
            className={`flex flex-col w-full animate-in slide-in-from-bottom-2 duration-300 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div 
              className={cn(
                "max-w-[85%] rounded-[18px] px-3 py-2 shadow-sm text-[16px] leading-snug relative transition-colors",
                msg.sender === 'user' 
                  ? (theme === 'dark' ? 'bg-[#005c4b] text-white rounded-tr-none' : 'bg-[#DCF8C5] text-black rounded-tr-none')
                  : (theme === 'dark' ? 'bg-[#202c33] text-white rounded-tl-none' : 'bg-white text-black rounded-tl-none')
              )}
            >
              {msg.type === 'audio' ? (
                <AudioMessage duration={msg.content} avatarUrl={doctorAvatarUrl} audioUrl={msg.mediaUrl} />
              ) : msg.type === 'image' ? (
                <div className="flex flex-col gap-2">
                  <div className="rounded-lg overflow-hidden max-h-[300px]">
                     <img src={msg.mediaUrl} alt="Imagem" className="w-full h-full object-cover" />
                  </div>
                  {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                </div>
              ) : msg.type === 'video' ? (
                <div className="flex flex-col gap-2">
                  <div className="rounded-lg overflow-hidden max-h-[300px]">
                     <video 
                       src={msg.mediaUrl} 
                       className="w-full h-full object-cover" 
                       controls={!msg.forceVideo} 
                       playsInline
                       onContextMenu={(e) => e.preventDefault()}
                       onClick={(e) => {
                         if (msg.forceVideo) {
                           const v = e.currentTarget;
                           v.paused ? v.play() : v.pause();
                         }
                       }}
                     />
                  </div>
                  {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
              
              <span className={cn(
                "text-[11px] block text-right mt-1 -mb-1",
                msg.sender === 'user' ? (theme === 'dark' ? 'text-green-200' : 'text-[#3E7B44]') : 'text-gray-400'
              )}>
                {new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
            
            {/* Quick Replies */}
            {msg.sender === 'doctor' && msg.quickReplies && msg.quickReplies.length > 0 && idx === messages.length - 1 && (
              <div className="flex flex-wrap gap-2 mt-2 ml-2">
                {msg.quickReplies.map((reply, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(reply.value)}
                    className="bg-[#007AFF] text-white px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:bg-blue-600 transition-colors active:scale-95"
                  >
                    {reply.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className={cn(
        "px-3 py-2 flex items-end gap-3 border-t pb-8 transition-colors",
        theme === 'dark' ? "bg-neutral-900 border-white/10" : "bg-[#F6F6F6] border-gray-300"
      )}>
        <Plus className="w-7 h-7 text-[#007AFF] mb-1.5" />
        
        <div className={cn(
          "flex-1 rounded-[20px] border flex items-center px-3 py-1.5 max-h-24 overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 transition-colors",
          theme === 'dark' ? "bg-[#202c33] border-white/10" : "bg-white border-gray-300"
        )}>
          <input 
            type="text" 
            className={cn(
              "w-full text-[16px] placeholder-gray-400 outline-none bg-transparent",
              theme === 'dark' ? "text-white" : "text-black"
            )}
            placeholder="Digite uma mensagem"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
          />
        </div>

        {inputValue ? (
            <button onClick={handleSendMessage} className="mb-1.5 transform transition active:scale-95">
                <div className="w-8 h-8 bg-[#007AFF] rounded-full flex items-center justify-center">
                    <Send className="w-4 h-4 text-white ml-0.5" />
                </div>
            </button>
        ) : (
            <div className="flex gap-4 mb-1.5 text-[#007AFF]">
                <Camera className="w-7 h-7" />
                <Mic className="w-7 h-7" />
            </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
