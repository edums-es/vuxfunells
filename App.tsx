import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ScreenStep, ChatMessage, PublicFunnelResponse, FunnelDefinition, OfferConfig, FlowNode } from './types';
import { cn } from './lib/utils';
import { GraphEngine } from './lib/graph-engine';
import IncomingCall from './components/IncomingCall';
import LockScreen from './components/LockScreen';
import ChatInterface from './components/ChatInterface';
import VideoCall from './components/VideoCall';
import TikTokReviews from './components/TikTokReviews';
import Checkout from './components/Checkout';
import TikTokLoading from './components/TikTokLoading';
import { fetchPublicFunnel, trackEvent, upsertLeadContact, adminTokenStorage, adminMe } from './lib/api';
import { getVisitorId } from './lib/visitor';
import AdminLogin from './components/admin/AdminLogin';
import AdminLayout from './components/admin/AdminLayout';
import AdminOverview from './components/admin/AdminOverview';
import AdminFunnels from './components/admin/AdminFunnels';
import AdminLeads from './components/admin/AdminLeads';
import AdminUsers from './components/admin/AdminUsers';
import AdminEmailMarketing from './components/admin/AdminEmailMarketing';
import AdminWebhooks from './components/admin/AdminWebhooks';
import AdminPlan from './components/admin/AdminPlan';
import AdminWhatsapp from './components/admin/AdminWhatsapp';
import AdminCheckout from './components/admin/AdminCheckout';

const ScreenWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="w-full h-full animate-in fade-in duration-500 fill-mode-forwards">
    {children}
  </div>
);

function formatMoneyCents(valueCents: number) {
  const n = Number(valueCents || 0);
  if (!Number.isFinite(n)) return 'R$ 0,00';
  return (n / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const OfferScreen: React.FC<{
  title: string;
  subtitle: string;
  offer: OfferConfig;
  onAccept: () => void;
  onDecline: () => void;
  theme?: 'dark' | 'light';
}> = ({ title, subtitle, offer, onAccept, onDecline, theme = 'light' }) => {
  return (
    <div className={cn(
      "h-full w-full overflow-y-auto overflow-x-hidden pb-10 scrollbar-hide",
      theme === 'dark' ? "bg-neutral-950" : "bg-white"
    )}>
      <header className={cn(
        "p-4 text-center sticky top-0 z-10",
        theme === 'dark' ? "bg-pink-950/90 text-white backdrop-blur-sm" : "bg-neutral-950 text-white"
      )}>
        <div className="text-xs font-bold tracking-wider uppercase text-neutral-300">{title}</div>
        <div className="text-lg font-extrabold mt-1">{subtitle}</div>
      </header>

      <div className="px-6 py-8 text-center">
        <div className={cn("text-2xl font-extrabold leading-tight mb-2", theme === 'dark' ? "text-white" : "text-gray-900")}>{offer.title}</div>
        <div className={cn("text-sm mb-6", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>{offer.subtitle}</div>

        <div className={cn(
          "border-2 rounded-2xl p-6 relative mb-6 shadow-sm",
          theme === 'dark' ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-900"
        )}>
          <div className="flex justify-center items-end gap-2 mb-3">
            {offer.compareAtPrice ? <span className="text-gray-400 text-lg line-through">{offer.compareAtPrice}</span> : null}
            <span className={cn("text-4xl font-extrabold", theme === 'dark' ? "text-white" : "text-neutral-900")}>{offer.price}</span>
          </div>

          <div className="space-y-2 text-left">
            {offer.bullets.map((b, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                <div className={cn("text-sm", theme === 'dark' ? "text-gray-300" : "text-gray-800")}>{b}</div>
              </div>
            ))}
            {offer.bullets.length === 0 ? <div className="text-gray-500 text-sm">—</div> : null}
          </div>
        </div>

        <button
          onClick={onAccept}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl text-lg shadow-lg"
        >
          {offer.acceptText}
        </button>
        <button onClick={onDecline} className="w-full text-gray-500 font-semibold py-3 rounded-xl">
          {offer.declineText}
        </button>
      </div>
    </div>
  );
};

const ThankYouScreen: React.FC<{ totalValueCents: number; onRestart: () => void; theme?: 'dark' | 'light' }> = ({ totalValueCents, onRestart, theme = 'light' }) => {
  return (
    <div className={cn(
      "h-full w-full overflow-y-auto overflow-x-hidden pb-10 scrollbar-hide flex items-center justify-center",
      theme === 'dark' ? "bg-neutral-950" : "bg-white"
    )}>
      <div className="px-6 py-10 text-center max-w-full">
        <div className={cn("text-3xl font-extrabold mb-2", theme === 'dark' ? "text-white" : "text-gray-900")}>Pedido confirmado</div>
        <div className={cn("text-sm mb-6", theme === 'dark' ? "text-gray-400" : "text-gray-600")}>Obrigada. Em instantes você vai receber as instruções.</div>
        <div className={cn(
          "border rounded-2xl p-5 mb-6",
          theme === 'dark' ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
        )}>
          <div className={cn("text-xs font-bold uppercase", theme === 'dark' ? "text-neutral-500" : "text-neutral-600")}>Total</div>
          <div className={cn("text-3xl font-extrabold", theme === 'dark' ? "text-white" : "text-neutral-900")}>{formatMoneyCents(totalValueCents)}</div>
        </div>
        <button
          onClick={onRestart}
          className={cn(
            "w-full font-bold py-3.5 rounded-xl text-lg shadow-xl",
            theme === 'dark' ? "bg-white text-black hover:bg-gray-200" : "bg-neutral-900 hover:bg-neutral-800 text-white"
          )}
        >
          Voltar ao início
        </button>
      </div>
    </div>
  );
};

const FunnelExperience: React.FC = () => {
  const [funnel, setFunnel] = useState<PublicFunnelResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState<ScreenStep>(ScreenStep.INCOMING_CALL);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [orderValueCents, setOrderValueCents] = useState(0);
  const [offerPointer, setOfferPointer] = useState<{ kind: 'upsell' | 'downsell'; index: number } | null>(null);

  // Graph Mode State
  const [graphMode, setGraphMode] = useState(false);
  const [engine, setEngine] = useState<GraphEngine | null>(null);
  const [currentNode, setCurrentNode] = useState<FlowNode | null>(null);

  const handleGraphNext = useCallback((output?: string) => {
      if (!engine) return;
      const nextNode = engine.next(output);
      setCurrentNode(nextNode);
  }, [engine]);


  const handleStepTransition = useCallback((nextStep: ScreenStep) => {
    setCurrentStep(nextStep);
  }, []);

  // Sync Graph Node to ScreenStep
  useEffect(() => {
     if (!graphMode || !currentNode) return;

     // Handle logic nodes that don't render a screen
     if (currentNode.type === 'redirect') {
         if (currentNode.data.url) {
             window.location.href = currentNode.data.url;
             return; // Stop execution
         }
         handleGraphNext(); // Skip if no URL
         return;
     }

     if (currentNode.type === 'condition') {
         const { variable, operator, value } = currentNode.data;
         const varValue = engine?.getVariable(variable);
         
         let result = false;
         if (operator === 'equals') result = varValue == value;
         else if (operator === 'not_equals') result = varValue != value;
         else if (operator === 'contains') result = String(varValue || '').includes(value);
         else if (operator === 'greater_than') result = Number(varValue) > Number(value);
         else if (operator === 'less_than') result = Number(varValue) < Number(value);
         
         setTimeout(() => handleGraphNext(result ? 'true' : 'false'), 0);
         return;
     }

     if (currentNode.type === 'api_action') {
         // Mock API Action
         console.log('Executing API Action:', currentNode.data);
         setTimeout(() => handleGraphNext('success'), 500);
         return;
     }

     if (currentNode.type === 'delay') {
         const duration = currentNode.data.duration || 1000;
         setTimeout(() => handleGraphNext(), duration);
         return;
     }

     if (currentNode.type === 'start') {
         setTimeout(() => handleGraphNext(), 100); // Small delay to ensure smooth transition
         return;
     }

     if (currentNode.type === 'doctor') {
         // Doctor node is just configuration, skip it
         setTimeout(() => handleGraphNext(), 0);
         return;
     }

     switch (currentNode.type) {
       case 'incoming_call':
       case 'incoming-call':
         handleStepTransition(ScreenStep.INCOMING_CALL);
         break;
       case 'lock_screen':
       case 'lock-screen':
         handleStepTransition(ScreenStep.LOCK_SCREEN);
         break;
       case 'video_call':
       case 'video-call':
         handleStepTransition(ScreenStep.VIDEO_CALL);
         break;
       case 'reviews':
         handleStepTransition(ScreenStep.REVIEWS);
         break;
       case 'checkout':
         handleStepTransition(ScreenStep.CHECKOUT);
         break;
       case 'upsell':
        handleStepTransition(ScreenStep.UPSELL);
        break;
      case 'offers':
         // Graph node 'offers' usually contains a list. We might need to start the offers flow.
         // For now, let's map it to UPSELL screen and let it handle logic.
         // Or maybe the graph should have individual nodes for each offer?
         // The 'offers' node in AdminFunnels (line 1509) allows adding multiple upsells/downsells.
         // If the node type is 'offers', we treat it as starting the offers sequence.
         handleStepTransition(ScreenStep.UPSELL);
         break;
       case 'end':
         handleStepTransition(ScreenStep.THANK_YOU);
         break;
       default:
         // message, image, video, audio, user_input
         // We use CHAT_PART_1 as the generic "Chat Screen" for the graph
         handleStepTransition(ScreenStep.CHAT_PART_1);
         break;
     }
   }, [currentNode, graphMode, handleStepTransition, handleGraphNext, engine]);

  // Convert FlowNode to ChatMessage for ChatInterface
  const currentGraphMessage = useMemo((): ChatMessage | null => {
      if (!currentNode) return null;
      
      // Map generic nodes to ChatMessage
      if (['message', 'image', 'video', 'audio', 'user_input'].includes(currentNode.type) || ['chat-message', 'text'].includes(currentNode.type)) {
          // Robust content recovery: check fullMessage first, then direct content
          const fullMsg = currentNode.data.fullMessage || {};
          const content = fullMsg.content || currentNode.data.content || '';
          
          // Robust mediaUrl recovery
          const mediaUrl = fullMsg.mediaUrl || currentNode.data.url || currentNode.data.mediaUrl;
          
          // Robust requiresInput check
          // It is required if:
          // 1. Node type is user_input
          // 2. data.requiresInput is true
          // 3. fullMessage.requiresInput is true
          const requiresInput = currentNode.type === 'user_input' || 
                                !!currentNode.data.requiresInput || 
                                !!fullMsg.requiresInput;

          return {
              id: currentNode.id,
              content: content,
              type: (currentNode.type === 'message' || currentNode.type === 'user_input' || currentNode.type === 'chat-message') ? 'text' : (currentNode.type as any),
              sender: currentNode.type === 'user_input' ? 'doctor' : 'doctor',
              mediaUrl: mediaUrl,
              delay: fullMsg.delay || currentNode.data.delay || 0,
              requiresInput: requiresInput,
              action: currentNode.data.action, 
              quickReplies: fullMsg.quickReplies || currentNode.data.quickReplies
          };
      }
      return null;
  }, [currentNode]);


  const visitorId = useMemo(() => getVisitorId(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await fetchPublicFunnel();
        if (cancelled) return;
        setFunnel(loaded);

        // Initialize Graph Engine if nodes are present
        if (loaded.definition.nodes && loaded.definition.nodes.length > 0) {
            const newEngine = new GraphEngine(loaded.definition);
            setGraphMode(true);
            setEngine(newEngine);
            setCurrentNode(newEngine.start());
        } else {
            setGraphMode(false);
        }

      } catch (e) {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : 'erro_ao_carregar');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const funnelId = funnel?.id || null;

  const track = useCallback(
    (type: string, step?: ScreenStep, payload?: unknown) => {
      const ts = new Date().toISOString();
      trackEvent({
        visitorId,
        type,
        step: step || undefined,
        funnelId: funnelId || undefined,
        payload,
        ts
      }).catch(() => {});
    },
    [visitorId, funnelId]
  );

  useEffect(() => {
    track('session_start', undefined, { path: location.pathname });
  }, [track]);

  useEffect(() => {
    track('step_view', currentStep);
  }, [currentStep, track]);

  const handleHistoryUpdate = useCallback((msgs: ChatMessage[]) => {
    setChatHistory(msgs);
  }, []);

  const handleChatPart1Action = useCallback((action: string) => {
    if (action === 'open_video') {
      handleStepTransition(ScreenStep.VIDEO_CALL);
    } else if (action === 'skip_video') {
      handleStepTransition(ScreenStep.CHAT_PART_2);
    }
  }, [handleStepTransition]);

  const handleChatPart2Action = useCallback((action: string) => {
    if (action === 'open_reviews') {
      handleStepTransition(ScreenStep.TIKTOK_LOADING);
      setTimeout(() => {
          handleStepTransition(ScreenStep.REVIEWS);
      }, 3000);
    }
  }, [handleStepTransition]);

  const definition: FunnelDefinition | null = funnel?.definition || null;
  const theme = definition?.theme || 'light';

  // Extract doctor info from Graph Nodes if available (Graph Mode priority)
  const doctorNode = definition?.nodes?.find(n => n.type === 'doctor');
  
  const doctorName = doctorNode?.data?.name || doctorNode?.data?.label || definition?.doctor?.name || 'Dra. Ana';
  const doctorAvatarUrl = doctorNode?.data?.avatarUrl || definition?.doctor?.avatarUrl || 'https://picsum.photos/id/64/200/200';
  const wallpaperUrl = doctorNode?.data?.wallpaperUrl || definition?.doctor?.wallpaperUrl || 'https://picsum.photos/id/28/800/1200';

  const chatPart1 = definition?.chat?.part1 || [];
  const chatPart2 = definition?.chat?.part2 || [];
  const reviews = definition?.reviews?.items || [];
  const checkoutConfig = definition?.checkout || null;
  const upsells = definition?.offers?.upsells || [];
  const downsells = definition?.offers?.downsells || [];
  const videoCallConfig = definition?.videoCall;
  const incomingCallConfig = definition?.incomingCall;

  // Handle skipCallScreen logic
  useEffect(() => {
    if (currentStep === ScreenStep.INCOMING_CALL && incomingCallConfig?.skipCallScreen) {
        if (incomingCallConfig.autoStartVideo) {
            handleStepTransition(ScreenStep.VIDEO_CALL);
        } else {
            handleStepTransition(ScreenStep.LOCK_SCREEN);
        }
    }
  }, [currentStep, incomingCallConfig, handleStepTransition]);

  useEffect(() => {
    if (currentStep === ScreenStep.UPSELL) {
      if (!offerPointer || offerPointer.kind !== 'upsell' || !upsells[offerPointer.index]) {
        handleStepTransition(ScreenStep.THANK_YOU);
      }
    }
    if (currentStep === ScreenStep.DOWNSELL) {
      if (!offerPointer || offerPointer.kind !== 'downsell' || !downsells[offerPointer.index]) {
        handleStepTransition(ScreenStep.THANK_YOU);
      }
    }
  }, [currentStep, offerPointer, upsells, downsells, handleStepTransition]);

  useEffect(() => {
    if (!definition) return;
    if (!offerPointer) return;
    if (currentStep !== ScreenStep.UPSELL && currentStep !== ScreenStep.DOWNSELL) return;
    const list = offerPointer.kind === 'upsell' ? upsells : downsells;
    const offer = list[offerPointer.index];
    if (!offer) return;
    track('offer_view', currentStep, { offerId: offer.id, kind: offerPointer.kind, index: offerPointer.index });
  }, [currentStep, definition, offerPointer, upsells, downsells, track]);

  if (loadError) {
    return (
      <div className="w-full h-screen bg-neutral-900 flex justify-center items-center font-sans">
        <div className="w-full h-full max-w-[430px] bg-white relative overflow-hidden shadow-2xl sm:rounded-[50px] sm:border-[8px] sm:border-neutral-800 ring-1 ring-gray-900/5 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="text-gray-900 font-semibold mb-2">Não foi possível carregar o funil</div>
            <div className="text-gray-500 text-sm break-all">{loadError}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!definition) {
    return (
      <div className="w-full h-screen bg-neutral-900 flex justify-center items-center font-sans">
        <div className="w-full h-full max-w-[430px] bg-white relative overflow-hidden shadow-2xl sm:rounded-[50px] sm:border-[8px] sm:border-neutral-800 ring-1 ring-gray-900/5 flex items-center justify-center">
          <div className="text-gray-600">Carregando…</div>
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentStep) {
      case ScreenStep.INCOMING_CALL:
        return (
          <ScreenWrapper key={ScreenStep.INCOMING_CALL}>
            <IncomingCall 
              doctorName={doctorName}
              doctorAvatarUrl={doctorAvatarUrl}
              duration={graphMode && currentNode?.data ? currentNode.data.duration : incomingCallConfig?.duration}
              ringtoneUrl={graphMode && currentNode?.data ? currentNode.data.ringtoneUrl : incomingCallConfig?.ringtoneUrl}
              voiceUrl={graphMode && currentNode?.data ? currentNode.data.voiceUrl : incomingCallConfig?.voiceUrl}
              theme={theme}
              onAnswer={() => {
             if (graphMode) {
                 handleGraphNext();
                 return;
             }
             if (incomingCallConfig?.autoStartVideo) {
               handleStepTransition(ScreenStep.VIDEO_CALL);
             } else {
               handleStepTransition(ScreenStep.LOCK_SCREEN);
             }
          }} 
        />
          </ScreenWrapper>
        );
      case ScreenStep.LOCK_SCREEN:
        return (
          <ScreenWrapper key={ScreenStep.LOCK_SCREEN}>
            <LockScreen 
              doctorName={doctorName}
              wallpaperUrl={wallpaperUrl}
              onUnlock={() => {
                  if (graphMode) {
                      handleGraphNext();
                  } else {
                      handleStepTransition(ScreenStep.CHAT_PART_1);
                  }
              }} 
              theme={theme}
            />
          </ScreenWrapper>
        );
      case ScreenStep.CHAT_PART_1:
        return (
          <ScreenWrapper key={ScreenStep.CHAT_PART_1}>
            <ChatInterface 
              doctorName={doctorName}
              doctorAvatarUrl={doctorAvatarUrl}
              script={graphMode ? [] : chatPart1}
              initialHistory={graphMode ? chatHistory : []}
              startDelay={1500}
              onHistoryUpdate={handleHistoryUpdate}
              onAction={(action) => {
                  if (graphMode) {
                      handleGraphNext(action);
                  } else {
                      handleChatPart1Action(action);
                  }
              }}
              onUserMessage={(text) => {
                track('user_message', ScreenStep.CHAT_PART_1, { text });
                
                // Handle Graph Mode User Input
                if (graphMode) {
                    if (currentNode?.type === 'user_input') {
                        const varName = currentNode.data.variable;
                        if (varName && engine) {
                            engine.setVariable(varName, text);
                        }
                    }
                    // Advance graph for both user_input AND chat-message with requiresInput
                    // We pass the text as output in case edges are conditional based on reply
                    handleGraphNext(text);
                }
              }}
              theme={theme}
              currentMessage={graphMode ? currentGraphMessage : undefined}
              onMessageComplete={graphMode ? () => handleGraphNext() : undefined}
            />
          </ScreenWrapper>
        );
      case ScreenStep.VIDEO_CALL:
        // DEBUG: Ensure video URL is valid
        const finalVideoUrl = currentNode?.data?.url || currentNode?.data?.videoUrl || videoCallConfig?.videoUrl;
        
        return (
          <ScreenWrapper key={ScreenStep.VIDEO_CALL}>
            <VideoCall 
              doctorName={doctorName}
              doctorAvatarUrl={doctorAvatarUrl}
              videoUrl={finalVideoUrl}
              audioUrl={videoCallConfig?.audioUrl}
              duration={videoCallConfig?.duration}
              onEndCall={() => {
                  console.log('Video Call Ended');
                  if (graphMode) {
                      handleGraphNext();
                  } else {
                      handleStepTransition(ScreenStep.CHAT_PART_2);
                  }
              }} 
            />
          </ScreenWrapper>
        );
      case ScreenStep.CHAT_PART_2:
        return (
          <ScreenWrapper key={ScreenStep.CHAT_PART_2}>
            <ChatInterface 
              doctorName={doctorName}
              doctorAvatarUrl={doctorAvatarUrl}
              script={chatPart2}
              initialHistory={chatHistory} 
              startDelay={800}
              onHistoryUpdate={handleHistoryUpdate}
              onAction={handleChatPart2Action}
              onUserMessage={(text) => track('user_message', ScreenStep.CHAT_PART_2, { text })}
            />
          </ScreenWrapper>
        );
      case ScreenStep.TIKTOK_LOADING:
        return (
            <ScreenWrapper key={ScreenStep.TIKTOK_LOADING}>
                <TikTokLoading theme={theme} />
            </ScreenWrapper>
        );
      case ScreenStep.REVIEWS:
        // FIX: Ensure reviews items are correctly loaded from graph node data
        const reviewItems = graphMode && currentNode?.type === 'reviews' 
            ? (currentNode.data.items || []) 
            : reviews;
            
        return (
          <ScreenWrapper key={ScreenStep.REVIEWS}>
            <TikTokReviews 
              reviews={reviewItems}
              onFinish={() => graphMode ? handleGraphNext() : handleStepTransition(ScreenStep.CHECKOUT)}
              theme={theme}
            />
          </ScreenWrapper>
        );
      case ScreenStep.CHECKOUT:
        const checkoutData = graphMode ? (currentNode?.data as any) : checkoutConfig;
        return (
          <ScreenWrapper key={ScreenStep.CHECKOUT}>
            {checkoutData ? (
              <Checkout
                config={checkoutData}
                integrations={definition.integrations}
                theme={theme}
                onCheckoutStart={() => {
                  track('checkout_started', ScreenStep.CHECKOUT, { source: 'cta' });
                }}
                onStartCheckout={async (contact) => {
                  if (contact) {
                    await upsertLeadContact({ visitorId, ...contact }).catch(() => {});
                  }
                  track('conversion', ScreenStep.CHECKOUT, { contactProvided: Boolean(contact) });
                  track('purchase', ScreenStep.CHECKOUT, { valueCents: checkoutData.valueCents });
                  setOrderValueCents(Number(checkoutData.valueCents || 0));
                  
                  if (graphMode) {
                      handleGraphNext('success');
                      return;
                  }

                  if (upsells.length > 0) {
                    setOfferPointer({ kind: 'upsell', index: 0 });
                    handleStepTransition(ScreenStep.UPSELL);
                  } else if (downsells.length > 0) {
                    setOfferPointer({ kind: 'downsell', index: 0 });
                    handleStepTransition(ScreenStep.DOWNSELL);
                  } else {
                    handleStepTransition(ScreenStep.THANK_YOU);
                  }
                }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-600">Checkout não configurado</div>
            )}
          </ScreenWrapper>
        );
      case ScreenStep.UPSELL: {
        if (graphMode) {
            const offer = currentNode?.data as OfferConfig;
            if (!offer) return <div />;
             return (
              <ScreenWrapper key={currentNode?.id || 'upsell'}>
                <OfferScreen
                  title="Oferta Especial"
                  subtitle="Só agora"
                  offer={offer}
                  onAccept={() => {
                     // Tracking logic duplicated or refactored? 
                     // For brevity, just tracking basic accept
                     track('offer_accept', ScreenStep.UPSELL, { offerId: offer.id, kind: 'upsell', valueCents: offer.valueCents });
                     setOrderValueCents((v) => v + Number(offer.valueCents || 0));
                     handleGraphNext('accepted');
                  }}
                  onDecline={() => {
                     track('offer_decline', ScreenStep.UPSELL, { offerId: offer.id, kind: 'upsell' });
                     handleGraphNext('declined');
                  }}
                  theme={theme}
                />
              </ScreenWrapper>
            );
        }

        if (!offerPointer || offerPointer.kind !== 'upsell') return <div />;
        const offer = upsells[offerPointer.index];
        if (!offer) return <div />;
        return (
          <ScreenWrapper key={`${ScreenStep.UPSELL}-${offerPointer.index}`}>
            <OfferScreen
              title="Oferta Especial"
              subtitle="Só agora"
              offer={offer}
              onAccept={() => {
                if (definition.integrations?.externalPlatform?.enabled && offer.externalId) {
                  const { provider, token } = definition.integrations.externalPlatform;
                  let url = '#';
                  if (provider === 'hotmart') url = `https://pay.hotmart.com/${offer.externalId}${token ? `?off=${token}` : ''}`;
                  else if (provider === 'kiwify') url = `https://pay.kiwify.com.br/${offer.externalId}`;
                  else if (provider === 'perfectpay') url = `https://perfectpay.com.br/checkout/${offer.externalId}`;

                  if (url !== '#') {
                    track('offer_accept', ScreenStep.UPSELL, { offerId: offer.id, kind: 'upsell', valueCents: offer.valueCents, external: true });
                    window.location.href = url;
                    return;
                  }
                }
                track('offer_accept', ScreenStep.UPSELL, { offerId: offer.id, kind: 'upsell', valueCents: offer.valueCents });
                track('purchase', ScreenStep.UPSELL, { offerId: offer.id, valueCents: offer.valueCents });
                setOrderValueCents((v) => v + Number(offer.valueCents || 0));
                const nextIdx = offerPointer.index + 1;
                if (nextIdx < upsells.length) {
                  setOfferPointer({ kind: 'upsell', index: nextIdx });
                  handleStepTransition(ScreenStep.UPSELL);
                } else {
                  handleStepTransition(ScreenStep.THANK_YOU);
                }
              }}
              onDecline={() => {
                track('offer_decline', ScreenStep.UPSELL, { offerId: offer.id, kind: 'upsell' });
                if (downsells.length > 0) {
                  setOfferPointer({ kind: 'downsell', index: 0 });
                  handleStepTransition(ScreenStep.DOWNSELL);
                } else {
                  handleStepTransition(ScreenStep.THANK_YOU);
                }
              }}
            />
          </ScreenWrapper>
        );
      }
      case ScreenStep.DOWNSELL: {
        if (graphMode) {
             const offer = currentNode?.data as OfferConfig;
             if (!offer) return <div />;
             return (
              <ScreenWrapper key={currentNode?.id || 'downsell'}>
                <OfferScreen
                  title="Última chance"
                  subtitle="Não perca"
                  offer={offer}
                  onAccept={() => {
                     track('offer_accept', ScreenStep.DOWNSELL, { offerId: offer.id, kind: 'downsell', valueCents: offer.valueCents });
                     setOrderValueCents((v) => v + Number(offer.valueCents || 0));
                     handleGraphNext('accepted');
                  }}
                  onDecline={() => {
                     track('offer_decline', ScreenStep.DOWNSELL, { offerId: offer.id, kind: 'downsell' });
                     handleGraphNext('declined');
                  }}
                  theme={theme}
                />
              </ScreenWrapper>
             );
        }

        if (!offerPointer || offerPointer.kind !== 'downsell') return <div />;
        const offer = downsells[offerPointer.index];
        if (!offer) return <div />;
        return (
          <ScreenWrapper key={`${ScreenStep.DOWNSELL}-${offerPointer.index}`}>
            <OfferScreen
              title="Última chance"
              subtitle="Não perca"
              offer={offer}
              onAccept={() => {
                if (definition.integrations?.externalPlatform?.enabled && offer.externalId) {
                  const { provider, token } = definition.integrations.externalPlatform;
                  let url = '#';
                  if (provider === 'hotmart') url = `https://pay.hotmart.com/${offer.externalId}${token ? `?off=${token}` : ''}`;
                  else if (provider === 'kiwify') url = `https://pay.kiwify.com.br/${offer.externalId}`;
                  else if (provider === 'perfectpay') url = `https://perfectpay.com.br/checkout/${offer.externalId}`;

                  if (url !== '#') {
                    track('offer_accept', ScreenStep.DOWNSELL, { offerId: offer.id, kind: 'downsell', valueCents: offer.valueCents, external: true });
                    window.location.href = url;
                    return;
                  }
                }
                track('offer_accept', ScreenStep.DOWNSELL, { offerId: offer.id, kind: 'downsell', valueCents: offer.valueCents });
                track('purchase', ScreenStep.DOWNSELL, { offerId: offer.id, valueCents: offer.valueCents });
                setOrderValueCents((v) => v + Number(offer.valueCents || 0));
                handleStepTransition(ScreenStep.THANK_YOU);
              }}
              onDecline={() => {
                track('offer_decline', ScreenStep.DOWNSELL, { offerId: offer.id, kind: 'downsell' });
                handleStepTransition(ScreenStep.THANK_YOU);
              }}
            />
          </ScreenWrapper>
        );
      }
      case ScreenStep.THANK_YOU:
        return (
          <ScreenWrapper key={ScreenStep.THANK_YOU}>
            <ThankYouScreen
              totalValueCents={orderValueCents}
              theme={theme}
              onRestart={() => {
                setOrderValueCents(0);
                setOfferPointer(null);
                setChatHistory([]);
                if (graphMode && engine) {
                    setCurrentNode(engine.start());
                    track('restart', ScreenStep.THANK_YOU);
                } else {
                    handleStepTransition(ScreenStep.INCOMING_CALL);
                    track('restart', ScreenStep.THANK_YOU);
                }
              }}
            />
          </ScreenWrapper>
        );
      default:
        return <div>Error: Unknown Step</div>;
    }
  };

  return (
    <div className="w-full h-screen bg-neutral-900 flex justify-center items-center font-sans">
      <div className="w-full h-full max-w-[430px] bg-white relative overflow-hidden shadow-2xl sm:rounded-[50px] sm:border-[8px] sm:border-neutral-800 ring-1 ring-gray-900/5">
        <div className="hidden sm:block absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl z-[60]"></div>
        {renderScreen()}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1.5 bg-gray-300/50 rounded-full z-[60] pointer-events-none"></div>
      </div>
    </div>
  );
};

const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = adminTokenStorage.get();
      if (!token) {
        navigate('/admin/login', { replace: true });
        return;
      }
      try {
        await adminMe();
        if (!cancelled) setChecked(true);
      } catch {
        adminTokenStorage.clear();
        navigate('/admin/login', { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (!checked) return null;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FunnelExperience />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<AdminOverview />} />
          <Route path="funnels" element={<AdminFunnels />} />
          <Route path="leads" element={<AdminLeads />} />
          <Route path="checkout" element={<AdminCheckout />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="email-marketing" element={<AdminEmailMarketing />} />
          <Route path="whatsapp" element={<AdminWhatsapp />} />
          <Route path="webhooks" element={<AdminWebhooks />} />
          <Route path="plan" element={<AdminPlan />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
