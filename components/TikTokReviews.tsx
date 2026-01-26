import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Music2, Plus, X, Play, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../lib/utils';
import { ReviewData, CommentData } from '../types';
import StatusBar from './StatusBar';

interface TikTokReviewsProps {
  reviews: ReviewData[];
  onFinish: () => void;
  theme?: 'light' | 'dark';
}

const TikTokReviews: React.FC<TikTokReviewsProps> = ({ reviews = [], onFinish, theme = 'dark' }) => {
  const [activeReviewId, setActiveReviewId] = useState(0);
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  const [likesCount, setLikesCount] = useState<Record<number, number>>({});
  const [showComments, setShowComments] = useState(false);
  const [currentComments, setCurrentComments] = useState<CommentData[] | undefined>(reviews?.[0]?.comments);
  const [videoError, setVideoError] = useState<Record<number, boolean>>({});
  const [showPlayButton, setShowPlayButton] = useState<Record<number, boolean>>({});
  const [isMuted, setIsMuted] = useState(true);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Safety check for empty reviews
  if (!reviews || reviews.length === 0) {
    return (
      <div className={cn(
        "h-full w-full relative font-sans flex items-center justify-center",
        theme === 'dark' ? "bg-black text-white" : "bg-white text-gray-900"
      )}>
        <StatusBar theme={theme === 'dark' ? 'dark' : 'light'} />
        <div className="text-center p-6 opacity-50">
           <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
           <p className="text-sm">Nenhum review configurado.</p>
           <p className="text-xs mt-1">Adicione reviews no painel para visualizar.</p>
        </div>
      </div>
    );
  }

  // Update comments when slide changes
  useEffect(() => {
    setCurrentComments(reviews[activeReviewId]?.comments);
    
    // Manage video playback
    videoRefs.current.forEach((video, index) => {
        if (!video) return;
        
        if (index === activeReviewId) {
            video.currentTime = 0;
            video.play().then(() => {
                setShowPlayButton(prev => ({ ...prev, [index]: false }));
            }).catch(() => {
                setShowPlayButton(prev => ({ ...prev, [index]: true }));
            });
        } else {
            video.pause();
        }
    });

  }, [activeReviewId, reviews]);

  const handleManualPlay = (index: number) => {
      const video = videoRefs.current[index];
      if (video) {
          if (video.paused) {
              video.play();
              setShowPlayButton(prev => ({ ...prev, [index]: false }));
              setVideoError(prev => ({ ...prev, [index]: false }));
          } else {
              video.pause();
              setShowPlayButton(prev => ({ ...prev, [index]: true }));
          }
      }
  };

  const toggleMute = () => {
      const newState = !isMuted;
      setIsMuted(newState);
      videoRefs.current.forEach(video => {
          if (video) video.muted = newState;
      });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollPosition = e.currentTarget.scrollTop;
    const height = e.currentTarget.clientHeight;
    const index = Math.round(scrollPosition / height);
    if (index !== activeReviewId && index < reviews.length) {
      setActiveReviewId(index);
    }
  };

  const toggleLike = (id: number, initialLikes: string) => {
    setLiked(prev => ({ ...prev, [id]: !prev[id] }));
    
    // Parse '12.4K' to number approximately for visual feedback
    if (!likesCount[id]) {
       const base = parseFloat(initialLikes) * (initialLikes.includes('K') ? 1000 : 1);
       setLikesCount(prev => ({ ...prev, [id]: base }));
    }
    
    setLikesCount(prev => ({
        ...prev,
        [id]: liked[id] ? prev[id] - 1 : prev[id] + 1
    }));
  };

  const formatLikes = (id: number, initial: string) => {
      const count = likesCount[id];
      if (!count) return initial;
      if (count > 9999) return (count / 1000).toFixed(1) + 'K';
      return count.toString();
  };

  return (
    <div className={cn(
      "h-full w-full relative font-sans",
      theme === 'dark' ? "bg-black text-white" : "bg-white text-gray-900"
    )}>
      <StatusBar theme={theme === 'dark' ? 'dark' : 'light'} />
      
      {/* Top Navigation Tabs */}
      <div className="absolute top-12 left-0 w-full z-30 flex justify-center items-center gap-4 text-[15px] font-bold shadow-lg">
          <span className={cn(theme === 'dark' ? "text-gray-400" : "text-gray-500")}>Seguindo</span>
          <div className="h-4 w-[1px] bg-gray-600"></div>
          <span className={cn("border-b-2 pb-1", theme === 'dark' ? "text-white border-white" : "text-black border-black")}>Para Você</span>
      </div>

      {/* Scroll Container */}
      <div 
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        onScroll={handleScroll}
      >
        {reviews.map((review, index) => (
          <div key={review.id} className="h-full w-full snap-center relative bg-gray-900 border-b border-gray-800">
            {/* Background Video */}
            <div className="absolute inset-0 bg-black">
               <video 
                  ref={(el) => {
                    videoRefs.current[index] = el;
                  }}
                  src={review.videoUrl} 
                  className="w-full h-full object-cover"
                  loop
                  playsInline
                  muted={isMuted}
                  onError={() => setVideoError(prev => ({ ...prev, [index]: true }))}
               />
               
               {/* Error State */}
               {videoError[index] && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 z-10 p-6 text-center">
                      <p className="text-red-500 font-bold mb-2">Erro ao carregar vídeo</p>
                      <button 
                        onClick={() => handleManualPlay(index)}
                        className="px-4 py-2 bg-white/10 rounded-full text-sm"
                      >
                        Tentar novamente
                      </button>
                  </div>
               )}

               {/* Play Button Overlay */}
               {!videoError[index] && showPlayButton[index] && (
                   <div 
                       className="absolute inset-0 flex items-center justify-center z-20 bg-black/20"
                       onClick={() => handleManualPlay(index)}
                   >
                       <Play className="w-16 h-16 text-white/80 fill-white/80 animate-pulse" />
                   </div>
               )}

               {/* Click to Pause/Play Area */}
               <div className="absolute inset-0 z-10" onClick={() => handleManualPlay(index)}></div>

               <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none"></div>
            </div>

            {/* Right Side Actions */}
            <div className="absolute right-2 bottom-20 flex flex-col items-center gap-6 z-20">
               {/* Avatar */}
               <div className="relative mb-2">
                 <div className="w-[48px] h-[48px] rounded-full border border-white p-[1px] overflow-hidden">
                    <img src={`https://picsum.photos/id/${100+index}/100/100`} alt="User" className="w-full h-full rounded-full object-cover" />
                 </div>
                 <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[#EA4359] w-5 h-5 rounded-full flex items-center justify-center">
                    <Plus className="w-3 h-3 text-white" />
                 </div>
               </div>

               {/* Like */}
               <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => toggleLike(review.id, review.likes)}>
                 <Heart className={`w-[35px] h-[35px] drop-shadow-md transition-all duration-300 ${liked[review.id] ? 'fill-[#EA4359] text-[#EA4359] scale-110' : 'text-white fill-white/10'}`} />
                 <span className="text-[12px] font-semibold drop-shadow-md">{formatLikes(review.id, review.likes)}</span>
               </div>
               
               {/* Comment */}
               <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => setShowComments(true)}>
                 <MessageCircle className="w-[34px] h-[34px] text-white fill-white drop-shadow-md" />
                 <span className="text-[12px] font-semibold drop-shadow-md">{currentComments ? currentComments.length + 320 : 320}</span>
               </div>

               {/* Share */}
               <div className="flex flex-col items-center gap-1">
                 <Share2 className="w-[34px] h-[34px] text-white fill-white drop-shadow-md" />
                 <span className="text-[12px] font-semibold drop-shadow-md">Share</span>
               </div>

               {/* Mute Toggle */}
               <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={toggleMute}>
                 {isMuted ? (
                    <VolumeX className="w-[34px] h-[34px] text-white drop-shadow-md" />
                 ) : (
                    <Volume2 className="w-[34px] h-[34px] text-white drop-shadow-md" />
                 )}
               </div>

               {/* Spinning Disc */}
               <div className="mt-4 relative">
                  <div className="w-[50px] h-[50px] bg-[#222] rounded-full border-[8px] border-[#111] flex items-center justify-center animate-spin-slow overflow-hidden">
                      <img src={`https://picsum.photos/id/${100+index}/100/100`} className="w-6 h-6 rounded-full object-cover" />
                  </div>
                  {/* Floating music notes */}
                  <div className="absolute -top-4 -left-2 text-gray-200">
                      <Music2 className="w-3 h-3 animate-float-note opacity-0" style={{ animationDelay: '0s' }} />
                  </div>
                  <div className="absolute -top-6 left-2 text-gray-200">
                      <Music2 className="w-4 h-4 animate-float-note opacity-0" style={{ animationDelay: '1.2s' }} />
                  </div>
               </div>
            </div>

            {/* Overlay Content */}
            <div className="absolute bottom-0 left-0 w-full p-4 pb-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                <div className="flex items-end justify-between">
                    <div className="flex-1 mr-12">
                        <h3 className="font-bold text-lg mb-1 drop-shadow-md">@{review.name.replace(/\s+/g, '').toLowerCase()}</h3>
                        <p className="text-base leading-snug drop-shadow-md opacity-90">{review.text}</p>
                        
                        <div className="flex items-center gap-2 mt-2 text-xs font-semibold">
                            <Music2 className="w-3 h-3" />
                            <span>Som original - {review.name}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Last Slide Button Overlay */}
            {index === reviews.length - 1 && (
               <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full px-10 pointer-events-none">
                  <div className={cn(
                    "pointer-events-auto backdrop-blur-sm p-6 rounded-2xl text-center shadow-2xl",
                    theme === 'dark' ? "bg-black/40 border border-white/10" : "bg-white/80 border border-gray-200"
                  )}>
                    <p className={cn("mb-4 text-lg font-bold", theme === 'dark' ? "text-white" : "text-black")}>Você quer ser a próxima?</p>
                    <button 
                      onClick={onFinish}
                      className="w-full bg-[#EA4359] text-white font-bold py-3.5 rounded-md text-lg shadow-lg animate-pulse"
                    >
                      Quero meu Positivo
                    </button>
                  </div>
               </div>
            )}
          </div>
        ))}
        {/* Spacer */}
        <div className="h-10 w-full bg-black snap-center"></div>
      </div>

      {/* Comments Drawer */}
      {showComments && (
        <div className="absolute inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowComments(false)}></div>
            <div className={cn(
                "absolute bottom-0 w-full h-[65%] rounded-t-xl animate-in slide-in-from-bottom-full duration-300 flex flex-col",
                theme === 'dark' ? "bg-neutral-900 text-white" : "bg-white text-black"
            )}>
                
                {/* Drawer Header */}
                <div className={cn("flex justify-between items-center p-4 border-b", theme === 'dark' ? "border-gray-800" : "border-gray-100")}>
                    <div className="w-6"></div> {/* Spacer */}
                    <span className="font-bold text-[13px]">{currentComments ? currentComments.length + 320 : 320} comentários</span>
                    <button onClick={() => setShowComments(false)}>
                        <X className={cn("w-5 h-5", theme === 'dark' ? "text-gray-400" : "text-gray-500")} />
                    </button>
                </div>

                {/* Comments List */}
                <div className={cn("flex-1 overflow-y-auto p-4 space-y-5", theme === 'dark' ? "bg-neutral-900" : "bg-white")}>
                    {currentComments && currentComments.map((comment, i) => (
                        <div key={i} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                <img src={comment.avatarUrl || `https://i.pravatar.cc/100?img=${comment.avatarId}`} alt="user" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <p className={cn("text-[12px] font-semibold mb-0.5", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>{comment.user} · <span className="font-normal">{comment.time}</span></p>
                                <p className={cn("text-[13px] leading-snug", theme === 'dark' ? "text-gray-200" : "text-gray-800")}>{comment.text}</p>
                                <div className="flex items-center gap-4 mt-1.5 text-gray-400 text-[12px]">
                                    <span>Responder</span>
                                    <div className="flex items-center gap-1">
                                        <Heart className="w-3 h-3" />
                                        <span>{comment.likes}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-center pt-2">
                                <Heart className="w-4 h-4 text-gray-300" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Fake Comment Input */}
                <div className={cn("p-3 border-t flex items-center gap-3", theme === 'dark' ? "bg-neutral-900 border-gray-800" : "bg-white border-gray-200")}>
                    <div className="w-8 h-8 rounded-full bg-gray-300"></div>
                    <div className={cn("flex-1 rounded-full h-10 px-4 flex items-center text-sm", theme === 'dark' ? "bg-neutral-800 text-gray-400" : "bg-gray-100 text-gray-400")}>
                        Adicionar comentário...
                    </div>
                </div>
            </div>
        </div>
      )}

      <style>{`
        @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
        }
        .animate-marquee {
            animation: marquee 8s linear infinite;
        }
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
            animation: spin-slow 5s linear infinite;
        }
        @keyframes float-note {
            0% { transform: translateY(0) rotate(0deg); opacity: 0; }
            20% { opacity: 1; }
            100% { transform: translateY(-20px) rotate(20deg); opacity: 0; }
        }
        .animate-float-note {
            animation: float-note 2.5s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default TikTokReviews;
