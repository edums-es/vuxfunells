import React, { useEffect, useMemo, useState } from 'react';
import { Settings, MessageSquare, Star, ShoppingCart, Tag, Plus, Trash2, ArrowUp, ArrowDown, Check, CheckCircle, ShieldCheck, HelpCircle, Code, AlertTriangle, X, ChevronRight, ChevronDown, Save, Play, Upload, Layout, Video, Image, Link, Mail, Sun, Moon, Smartphone, Monitor } from 'lucide-react';
import { adminCreateFunnel, adminListFunnels, adminUpdateFunnel, adminUploadFile, adminDeleteFunnel } from '../../lib/api';
import type { AdminFunnel } from '../../lib/api';
import type { ChatMessage, CheckoutConfig, FunnelDefinition, OfferConfig, ReviewData, CommentData, CheckoutBlock, VideoCallConfig, IntegrationsConfig, MarketingConfig } from '../../types';
import { cn } from '../../lib/utils';
import { nanoid } from 'nanoid';
import IncomingCall from '../IncomingCall';
import ChatInterface from '../ChatInterface';
import VideoCall from '../VideoCall';
import Checkout from '../Checkout';
import TikTokReviews from '../TikTokReviews';


function safeStringify(value: unknown) {
  return JSON.stringify(value, null, 2);
}

type EditorMode = 'builder' | 'json';
type BuilderTab = 'doctor' | 'chat' | 'calls' | 'reviews' | 'checkout' | 'offers' | 'integrations' | 'marketing';

function cloneDeep<T>(value: T): T {
  return structuredClone(value);
}

const FunnelPreview: React.FC<{ def: FunnelDefinition; tab: BuilderTab; device?: 'mobile' | 'desktop' }> = ({ def, tab, device = 'mobile' }) => {
  const [key, setKey] = useState(0);
  const [previewStep, setPreviewStep] = useState<'incoming' | 'video'>('incoming');

  // Force re-render when tab or def changes significantly to reset timers
  useEffect(() => {
    setKey(prev => prev + 1);
    setPreviewStep('incoming');
  }, [tab, def.doctor.avatarUrl, def.videoCall?.videoUrl]);

  const isMobile = device === 'mobile';

  return (
    <div className={cn("sticky top-6 transition-all duration-300", isMobile ? "w-full" : "w-full max-w-[1200px]")}>
       <div className={cn(
         "bg-neutral-900 border-neutral-800 shadow-2xl overflow-hidden relative mx-auto transition-all duration-300",
         isMobile ? "rounded-[3rem] border-8 max-w-[360px] h-[720px]" : "rounded-xl border-4 w-full h-[720px]"
       )}>
          {/* Status Bar Mockup - Mobile Only */}
          {isMobile && (
            <div className="absolute top-0 left-0 right-0 h-6 bg-black/20 z-50 flex justify-between items-center px-6 pt-2">
               <div className="text-[10px] font-bold text-white">9:41</div>
               <div className="flex gap-1">
                  <div className="w-3 h-3 bg-white rounded-full opacity-80" />
                  <div className="w-3 h-3 bg-white rounded-full opacity-80" />
               </div>
            </div>
          )}

          <div className="h-full bg-black overflow-y-auto no-scrollbar relative">
             {tab === 'doctor' && (
                <div className="h-full relative">
                   <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${def.doctor.wallpaperUrl})` }} />
                   <div className="absolute inset-0 bg-black/40" />
                   <div className="absolute bottom-20 left-6 right-6 text-white">
                      <h2 className="text-3xl font-bold mb-2">{def.doctor.name}</h2>
                      <p className="opacity-80">{def.doctor.role}</p>
                   </div>
                </div>
             )}

             {tab === 'calls' && (
                <>
                  {previewStep === 'incoming' ? (
                    <IncomingCall 
                       key={`preview-incoming-${key}`}
                       doctorName={def.doctor.name}
                       doctorAvatarUrl={def.doctor.avatarUrl}
                       duration={def.incomingCall?.duration || 12} // Use actual duration for preview flow
                       ringtoneUrl={def.incomingCall?.ringtoneUrl}
                       voiceUrl={def.incomingCall?.voiceUrl}
                       onAnswer={() => {
                         if (def.incomingCall?.autoStartVideo) {
                           setPreviewStep('video');
                         }
                       }}
                    />
                  ) : (
                    <VideoCall 
                       key={`preview-video-${key}`}
                       onEndCall={() => setPreviewStep('incoming')} // Loop back or just end
                       doctorName={def.doctor.name}
                       doctorAvatarUrl={def.doctor.avatarUrl}
                       videoUrl={def.videoCall?.videoUrl}
                       duration={def.videoCall?.duration}
                    />
                  )}
                </>
             )}

             {tab === 'chat' && (
                <ChatInterface 
                   key={`preview-chat-${key}`}
                   script={[...def.chat.part1, ...def.chat.part2]}
                   initialHistory={[]}
                   onAction={() => {}}
                   onHistoryUpdate={() => {}}
                   doctorName={def.doctor.name}
                   doctorAvatarUrl={def.doctor.avatarUrl}
                   startDelay={0}
                />
             )}

             {tab === 'reviews' && (
               <TikTokReviews 
                 reviews={def.reviews.items}
                 onFinish={() => {}}
               />
             )}

             {tab === 'checkout' && (
               <Checkout 
                 config={def.checkout}
                 integrations={def.integrations}
                 onStartCheckout={() => {}}
               />
             )}
             
             {tab === 'offers' && (
                <div className="flex items-center justify-center h-full text-white text-center p-6">
                   <div>
                      <h3 className="text-xl font-bold mb-2">Upsell/Downsell Preview</h3>
                      <p className="text-neutral-400">Configure as ofertas para visualizar.</p>
                   </div>
                </div>
             )}

             {(tab === 'integrations' || tab === 'marketing') && (
                <div className="flex items-center justify-center h-full text-white text-center p-6">
                   <div>
                      <h3 className="text-xl font-bold mb-2">Configurações</h3>
                      <p className="text-neutral-400">Essas configurações não afetam o visual do funil.</p>
                   </div>
                </div>
             )}
          </div>

          {/* Home Indicator - Mobile Only */}
          {isMobile && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full z-50" />
          )}
       </div>
    </div>
  );
};

function moveItem<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (toIndex < 0 || toIndex >= list.length) return list;
  if (fromIndex === toIndex) return list;
  const copy = list.slice();
  const [item] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, item);
  return copy;
}

function formatMoney(cents: number | undefined) {
  const n = Number(cents || 0);
  if (!Number.isFinite(n)) return '0,00';
  return (n / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const FieldLabel: React.FC<{ label: string; hint?: string; className?: string }> = ({ label, hint, className }) => {
  return (
    <div className={cn("mb-2 flex items-center justify-between", className)}>
      <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{label}</div>
      {hint ? <div className="text-[10px] font-medium text-neutral-500 bg-neutral-800/50 px-2 py-0.5 rounded-full border border-white/5">{hint}</div> : null}
    </div>
  );
};

const inputBaseClass = "w-full bg-neutral-900/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all text-sm placeholder:text-neutral-600 hover:bg-neutral-900/80 hover:border-white/20";

const TextInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'url';
  className?: string;
}> = ({ value, onChange, placeholder, type = 'text', className }) => (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    type={type}
    className={cn(inputBaseClass, className)}
  />
);

const NumberInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  min?: number;
  step?: number;
  className?: string;
}> = ({ value, onChange, placeholder, min, step, className }) => (
  <input
    value={Number.isFinite(value) ? String(value) : '0'}
    onChange={(e) => onChange(Number(e.target.value || 0))}
    placeholder={placeholder}
    type="number"
    min={min}
    step={step}
    className={cn(inputBaseClass, className)}
  />
);

const TextArea: React.FC<{ value: string; onChange: (value: string) => void; rows?: number; className?: string }> = ({
  value,
  onChange,
  rows = 3,
  className
}) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    rows={rows}
    className={cn(inputBaseClass, "resize-y min-h-[80px]", className)}
  />
);

const Select: React.FC<{ value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; className?: string }> = ({
  value,
  onChange,
  options,
  className
}) => (
  <div className={cn("relative", className)}>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(inputBaseClass, "appearance-none cursor-pointer pr-10")}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-neutral-900 text-neutral-200">
          {o.label}
        </option>
      ))}
    </select>
    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
      <ChevronDown className="w-4 h-4" />
    </div>
  </div>
);

const Toggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label: string }> = ({
  checked,
  onChange,
  label
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={cn(
      "w-full text-left rounded-xl px-4 py-3 border text-sm font-semibold transition-all flex items-center justify-between group",
      checked 
        ? "bg-purple-500/10 border-purple-500/40 text-purple-300" 
        : "bg-neutral-900/30 border-white/5 text-neutral-400 hover:bg-neutral-900/50 hover:border-white/10"
    )}
  >
    <span>{label}</span>
    <div className={cn(
      "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
      checked ? "bg-purple-500 border-purple-500 text-white" : "border-neutral-600"
    )}>
      {checked && <Check className="w-3 h-3" />}
    </div>
  </button>
);

function ensureDefinition(def: any): FunnelDefinition {
  const base: FunnelDefinition = {
    doctor: {
      name: 'Dra. Ana',
      role: 'Fertilidade',
      avatarUrl: 'https://picsum.photos/id/64/200/200',
      wallpaperUrl: 'https://picsum.photos/id/28/800/1200'
    },
    chat: { part1: [], part2: [] },
    videoCall: {
      videoUrl: '',
      duration: 60
    },
    incomingCall: {
      duration: 12
    },
    reviews: { items: [] },
    checkout: {
      headerLabel: 'Oferta',
      headline: 'Produto',
      subheadline: 'Descrição',
      badge: 'OFERTA',
      productName: 'Produto',
      price: 'R$ 0',
      compareAtPrice: 'R$ 0',
      valueCents: 0,
      primaryCtaText: 'Continuar',
      secondaryCtaText: 'Continuar',
      securePaymentText: 'Pagamento seguro',
      bullets: [],
      guaranteeTitle: 'Garantia',
      guaranteeText: 'Texto',
      checkoutReviews: [],
      footerLines: []
    },
    offers: { upsells: [], downsells: [] }
  };

  if (!def) return base;

  // Migration: Merge commentsByIndex into items if necessary
  let items = def.reviews?.items || [];
  const commentsByIndex = def.reviews?.commentsByIndex || {};
  
  if (items.length > 0) {
    items = items.map((item: any, idx: number) => ({
      ...item,
      comments: item.comments || commentsByIndex[idx] || []
    }));
  }

  return {
    ...base,
    ...def,
    doctor: { ...base.doctor, ...(def.doctor || {}) },
    chat: { ...base.chat, ...(def.chat || {}) },
    videoCall: { ...base.videoCall, ...(def.videoCall || {}) },
    incomingCall: { ...base.incomingCall, ...(def.incomingCall || {}) },
    reviews: { items },
    checkout: { 
      ...base.checkout, 
      ...(def.checkout || {}),
      bullets: def.checkout?.bullets || [],
      checkoutReviews: def.checkout?.checkoutReviews || [],
      footerLines: def.checkout?.footerLines || [],
      blocks: (def.checkout?.blocks || []).map((b: any) => ({ ...b, content: b.content || {} }))
    },
    offers: { ...base.offers, ...(def.offers || {}) }
  };
}

const EMPTY_FUNNEL_DEFINITION: FunnelDefinition = {
  doctor: { name: '', role: '', avatarUrl: '', wallpaperUrl: '' },
  chat: { part1: [], part2: [] },
  videoCall: { videoUrl: '', duration: 0 },
  incomingCall: { duration: 0 },
  reviews: { items: [] },
  checkout: {
    headerLabel: '', headline: '', subheadline: '', badge: '', productName: '', price: '', compareAtPrice: '',
    valueCents: 0, primaryCtaText: '', secondaryCtaText: '', securePaymentText: '',
    bullets: [], guaranteeTitle: '', guaranteeText: '', checkoutReviews: [], footerLines: []
  },
  offers: { upsells: [], downsells: [] }
};

const AdminFunnels: React.FC = () => {
  console.log('AdminFunnels mounting');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [funnels, setFunnels] = useState<AdminFunnel[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draftJson, setDraftJson] = useState('');
  const [draftDef, setDraftDef] = useState<FunnelDefinition | null>(null);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showJsonMobile, setShowJsonMobile] = useState(false);
  const [mode, setMode] = useState<EditorMode>('builder');
  const [tab, setTab] = useState<BuilderTab>('doctor');
  const [nameDraft, setNameDraft] = useState('');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  
  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFunnelName, setNewFunnelName] = useState('');
  const [newFunnelType, setNewFunnelType] = useState<'default' | 'empty'>('default');

  const active = useMemo(() => funnels.find((f) => f.id === activeId) || null, [funnels, activeId]);

  const refresh = async () => {
    const res = await adminListFunnels();
    setFunnels(res.funnels);
    const current = res.funnels.find((f) => f.status === 'active') || res.funnels[0] || null;
    setActiveId((prev) => prev || (current ? current.id : null));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await refresh();
        if (!cancelled) setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Falha ao carregar funis');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const def = ensureDefinition(active.definition);
    setDraftDef(cloneDeep(def));
    setDraftJson(safeStringify(def));
    setNameDraft(active.name);
  }, [activeId]);

  const saveDefinition = async () => {
    if (!active) return;
    setSaving(true);
    setError(null);
    try {
      const def = mode === 'json' ? (JSON.parse(draftJson) as FunnelDefinition) : draftDef;
      if (!def) throw new Error('Definição vazia');
      const res = await adminUpdateFunnel(active.id, { name: nameDraft.trim() || active.name, definition: def });
      setFunnels((prev) => prev.map((f) => (f.id === active.id ? res.funnel : f)));
      const normalized = ensureDefinition(res.funnel.definition);
      setDraftDef(cloneDeep(normalized));
      setDraftJson(safeStringify(normalized));
      setNameDraft(res.funnel.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const activate = async () => {
    if (!active) return;
    setSaving(true);
    setError(null);
    try {
      const res = await adminUpdateFunnel(active.id, { status: 'active' });
      await refresh();
      setFunnels((prev) => prev.map((f) => (f.id === active.id ? res.funnel : f)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao ativar');
    } finally {
      setSaving(false);
    }
  };

  const create = () => {
    setNewFunnelName(`Novo funil ${new Date().toLocaleDateString('pt-BR')}`);
    setNewFunnelType('default');
    setShowCreateModal(true);
  };

  const handleCreateConfirm = async () => {
    if (creating || !newFunnelName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const definition = newFunnelType === 'empty' ? EMPTY_FUNNEL_DEFINITION : undefined;
      const res = await adminCreateFunnel(newFunnelName, definition);
      setFunnels((prev) => [...prev, res.funnel]);
      setActiveId(res.funnel.id);
      setShowCreateModal(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao criar funil');
    } finally {
      setCreating(false);
    }
  };

  const deleteFunnel = async () => {
    if (!active || !window.confirm('Tem certeza que deseja excluir este funil? Esta ação não pode ser desfeita.')) return;
    setSaving(true);
    setError(null);
    try {
      await adminDeleteFunnel(active.id);
      await refresh();
      setDraftDef(null);
      setActiveId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao excluir');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-neutral-300">Carregando…</div>;

  const renderBuilder = () => {
    if (!draftDef) return null;

    const def = draftDef;

    const updateDoctor = (patch: Partial<FunnelDefinition['doctor']>) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        return { ...prev, doctor: { ...prev.doctor, ...patch } };
      });
    };

    const updateTheme = (theme: 'dark' | 'light') => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        return { ...prev, theme };
      });
    };

    const updateCheckout = (patch: Partial<CheckoutConfig>) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        return { ...prev, checkout: { ...prev.checkout, ...patch } };
      });
    };

    const updateIntegrations = (patch: Partial<IntegrationsConfig>) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        return { ...prev, integrations: { ...prev.integrations, ...patch } };
      });
    };

    const updateMarketing = (patch: Partial<MarketingConfig>) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        return { ...prev, marketing: { ...prev.marketing, ...patch } };
      });
    };

    const enablePagebuilder = () => {
      if (!draftDef) return;
      const c = draftDef.checkout;
      
      const safeReviews = (c.checkoutReviews || []).filter(r => r);
      const safeBullets = (c.bullets || []).filter(b => b);
      const safeFooter = (c.footerLines || []).filter(f => f);

      const blocks: CheckoutBlock[] = [
        { id: nanoid(), type: 'header', content: { text: c.headerLabel || 'Oferta' } },
        { id: nanoid(), type: 'hero', content: { 
            headline: c.headline || '', 
            subheadline: c.subheadline || '', 
            badge: c.badge || 'OFERTA',
            productName: c.productName || '',
            productImageUrl: c.productImageUrl || '',
            price: c.price || '',
            compareAtPrice: c.compareAtPrice || '',
            ctaText: c.primaryCtaText || 'Comprar Agora',
            secureText: c.securePaymentText || 'Pagamento seguro'
          } 
        },
        { id: nanoid(), type: 'bullets', content: { title: 'O que você vai receber:', items: safeBullets } },
        { id: nanoid(), type: 'guarantee', content: { title: c.guaranteeTitle || 'Garantia', text: c.guaranteeText || '' } },
        { id: nanoid(), type: 'reviews', content: { title: 'Quem já comprou e aprovou:', items: safeReviews } },
        { id: nanoid(), type: 'footer', content: { lines: safeFooter } }
      ];
      updateCheckout({ blocks });
    };

    const addBlock = (type: CheckoutBlock['type']) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        const blocks = prev.checkout.blocks ? prev.checkout.blocks.slice() : [];
        let content: any = {};
        if (type === 'header') content = { text: 'Nova Seção' };
        if (type === 'hero') content = { headline: 'Título', subheadline: 'Subtítulo', price: 'R$ 00,00', ctaText: 'Comprar' };
        if (type === 'bullets') content = { title: 'Benefícios', items: ['Item 1'] };
        if (type === 'guarantee') content = { title: 'Garantia', text: 'Texto da garantia' };
        if (type === 'reviews') content = { title: 'Avaliações', items: [] };
        if (type === 'faq') content = { title: 'Perguntas Frequentes', items: [{ question: 'Pergunta?', answer: 'Resposta.' }] };
        if (type === 'html') content = { html: '<p>Conteúdo HTML</p>' };
        if (type === 'footer') content = { lines: ['Todos os direitos reservados'] };

        blocks.push({ id: nanoid(), type, content });
        return { ...prev, checkout: { ...prev.checkout, blocks } };
      });
    };

    const updateBlock = (idx: number, patch: Partial<CheckoutBlock> | { content: any }) => {
      setDraftDef((prev) => {
        if (!prev || !prev.checkout.blocks) return prev;
        const blocks = prev.checkout.blocks.slice();
        if (!blocks[idx]) return prev;
        
        if ('content' in patch) {
           blocks[idx] = { ...blocks[idx], content: { ...blocks[idx].content, ...patch.content } };
        } else {
           blocks[idx] = { ...blocks[idx], ...(patch as Partial<CheckoutBlock>) };
        }
        return { ...prev, checkout: { ...prev.checkout, blocks } };
      });
    };

    const removeBlock = (idx: number) => {
       setDraftDef((prev) => {
        if (!prev || !prev.checkout.blocks) return prev;
        const blocks = prev.checkout.blocks.slice();
        blocks.splice(idx, 1);
        return { ...prev, checkout: { ...prev.checkout, blocks } };
      });
    };

    const moveBlock = (idx: number, newIdx: number) => {
       setDraftDef((prev) => {
        if (!prev || !prev.checkout.blocks) return prev;
        const blocks = prev.checkout.blocks.slice();
        if (newIdx < 0 || newIdx >= blocks.length) return prev;
        const [removed] = blocks.splice(idx, 1);
        blocks.splice(newIdx, 0, removed);
        return { ...prev, checkout: { ...prev.checkout, blocks } };
      });
    };

    const updateReviews = (patch: Partial<FunnelDefinition['reviews']>) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        return { ...prev, reviews: { ...prev.reviews, ...patch } };
      });
    };

    const updateOffers = (patch: Partial<FunnelDefinition['offers']>) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        return { ...prev, offers: { ...prev.offers, ...patch } };
      });
    };

    const updateChat = (patch: Partial<FunnelDefinition['chat']>) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        return { ...prev, chat: { ...prev.chat, ...patch } };
      });
    };

    const updateVideoCall = (patch: Partial<VideoCallConfig>) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        return { ...prev, videoCall: { ...prev.videoCall, ...patch } };
      });
    };

    const updateIncomingCall = (patch: { duration: number }) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        return { ...prev, incomingCall: { ...prev.incomingCall, ...patch } };
      });
    };

    const updateChatMessage = (part: 'part1' | 'part2', idx: number, patch: Partial<ChatMessage>) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        const list = prev.chat[part].slice();
        const current = list[idx];
        if (!current) return prev;
        list[idx] = { ...current, ...patch };
        return { ...prev, chat: { ...prev.chat, [part]: list } };
      });
    };

    const removeChatMessage = (part: 'part1' | 'part2', idx: number) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        const list = prev.chat[part].slice();
        list.splice(idx, 1);
        return { ...prev, chat: { ...prev.chat, [part]: list } };
      });
    };

    const addChatMessage = (part: 'part1' | 'part2') => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        const list = prev.chat[part].slice();
        list.push({
          id: `${Date.now()}`,
          sender: 'doctor',
          delay: 1000,
          type: 'text',
          content: ''
        });
        return { ...prev, chat: { ...prev.chat, [part]: list } };
      });
    };

    const moveChatMessage = (part: 'part1' | 'part2', from: number, to: number) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        return { ...prev, chat: { ...prev.chat, [part]: moveItem(prev.chat[part], from, to) } };
      });
    };

    const updateReviewItem = (idx: number, patch: Partial<ReviewData>) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        const items = prev.reviews.items.slice();
        const current = items[idx];
        if (!current) return prev;
        items[idx] = { ...current, ...patch };
        return { ...prev, reviews: { ...prev.reviews, items } };
      });
    };

    const addReviewItem = () => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        const items = prev.reviews.items.slice();
        const nextId = (items.reduce((acc, r) => Math.max(acc, Number(r.id || 0)), 0) || 0) + 1;
        items.push({ id: nextId, name: '', age: 30, location: '', text: '', likes: '0', comments: [] });
        return { ...prev, reviews: { ...prev.reviews, items } };
      });
    };

    const removeReviewItem = (idx: number) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        const items = prev.reviews.items.slice();
        items.splice(idx, 1);
        return { ...prev, reviews: { ...prev.reviews, items } };
      });
    };

    const moveReviewItem = (from: number, to: number) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        const items = moveItem(prev.reviews.items, from, to);
        return { ...prev, reviews: { ...prev.reviews, items } };
      });
    };

    const updateComment = (reviewIndex: number, commentIndex: number, patch: Partial<CommentData>) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        const items = prev.reviews.items.slice();
        const review = items[reviewIndex];
        if (!review) return prev;
        const comments = (review.comments || []).slice();
        if (!comments[commentIndex]) return prev;
        comments[commentIndex] = { ...comments[commentIndex], ...patch };
        items[reviewIndex] = { ...review, comments };
        return { ...prev, reviews: { ...prev.reviews, items } };
      });
    };

    const addComment = (reviewIndex: number) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        const items = prev.reviews.items.slice();
        const review = items[reviewIndex];
        if (!review) return prev;
        const comments = (review.comments || []).slice();
        comments.push({ user: '', text: '', time: 'agora', likes: 0, avatarId: 1 });
        items[reviewIndex] = { ...review, comments };
        return { ...prev, reviews: { ...prev.reviews, items } };
      });
    };

    const removeComment = (reviewIndex: number, commentIndex: number) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        const items = prev.reviews.items.slice();
        const review = items[reviewIndex];
        if (!review) return prev;
        const comments = (review.comments || []).slice();
        comments.splice(commentIndex, 1);
        items[reviewIndex] = { ...review, comments };
        return { ...prev, reviews: { ...prev.reviews, items } };
      });
    };

    const addStringItem = (key: 'bullets' | 'footerLines', value: string) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        const arr = prev.checkout[key].slice();
        arr.push(value);
        return { ...prev, checkout: { ...prev.checkout, [key]: arr } };
      });
    };

    const updateStringItem = (key: 'bullets' | 'footerLines', idx: number, value: string) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        const arr = prev.checkout[key].slice();
        if (!arr[idx]) return prev;
        arr[idx] = value;
        return { ...prev, checkout: { ...prev.checkout, [key]: arr } };
      });
    };

    const removeStringItem = (key: 'bullets' | 'footerLines', idx: number) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        const arr = prev.checkout[key].slice();
        arr.splice(idx, 1);
        return { ...prev, checkout: { ...prev.checkout, [key]: arr } };
      });
    };

    const addCheckoutReview = () => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        const list = prev.checkout.checkoutReviews.slice();
        list.push({ name: '', text: '', avatarUrl: 'https://i.pravatar.cc/100?img=1' });
        return { ...prev, checkout: { ...prev.checkout, checkoutReviews: list } };
      });
    };

    const updateCheckoutReview = (idx: number, patch: Partial<CheckoutConfig['checkoutReviews'][number]>) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        const list = prev.checkout.checkoutReviews.slice();
        const current = list[idx];
        if (!current) return prev;
        list[idx] = { ...current, ...patch };
        return { ...prev, checkout: { ...prev.checkout, checkoutReviews: list } };
      });
    };

    const removeCheckoutReview = (idx: number) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        const list = prev.checkout.checkoutReviews.slice();
        list.splice(idx, 1);
        return { ...prev, checkout: { ...prev.checkout, checkoutReviews: list } };
      });
    };

    const addOffer = (kind: 'upsells' | 'downsells') => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        const list = prev.offers[kind].slice();
        list.push({
          id: `${kind}-${Date.now()}`,
          title: '',
          subtitle: '',
          price: 'R$ 0',
          compareAtPrice: 'R$ 0',
          valueCents: 0,
          bullets: [],
          acceptText: 'Aceitar',
          declineText: 'Recusar'
        });
        return { ...prev, offers: { ...prev.offers, [kind]: list } };
      });
    };

    const updateOffer = (kind: 'upsells' | 'downsells', idx: number, patch: Partial<OfferConfig>) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        const list = prev.offers[kind].slice();
        const current = list[idx];
        if (!current) return prev;
        list[idx] = { ...current, ...patch };
        return { ...prev, offers: { ...prev.offers, [kind]: list } };
      });
    };

    const removeOffer = (kind: 'upsells' | 'downsells', idx: number) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        const list = prev.offers[kind].slice();
        list.splice(idx, 1);
        return { ...prev, offers: { ...prev.offers, [kind]: list } };
      });
    };

    const moveOffer = (kind: 'upsells' | 'downsells', from: number, to: number) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        return { ...prev, offers: { ...prev.offers, [kind]: moveItem(prev.offers[kind], from, to) } };
      });
    };

    const addOfferBullet = (kind: 'upsells' | 'downsells', offerIndex: number, value: string) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        const list = prev.offers[kind].slice();
        const offer = list[offerIndex];
        if (!offer) return prev;
        const bullets = offer.bullets.slice();
        bullets.push(value);
        list[offerIndex] = { ...offer, bullets };
        return { ...prev, offers: { ...prev.offers, [kind]: list } };
      });
    };

    const updateOfferBullet = (kind: 'upsells' | 'downsells', offerIndex: number, bulletIndex: number, value: string) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        const list = prev.offers[kind].slice();
        const offer = list[offerIndex];
        if (!offer) return prev;
        const bullets = offer.bullets.slice();
        if (!bullets[bulletIndex]) return prev;
        bullets[bulletIndex] = value;
        list[offerIndex] = { ...offer, bullets };
        return { ...prev, offers: { ...prev.offers, [kind]: list } };
      });
    };

    const removeOfferBullet = (kind: 'upsells' | 'downsells', offerIndex: number, bulletIndex: number) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        const list = prev.offers[kind].slice();
        const offer = list[offerIndex];
        if (!offer) return prev;
        const bullets = offer.bullets.slice();
        bullets.splice(bulletIndex, 1);
        list[offerIndex] = { ...offer, bullets };
        return { ...prev, offers: { ...prev.offers, [kind]: list } };
      });
    };

    const tabs: { id: BuilderTab; label: string; icon: React.ElementType }[] = [
      { id: 'doctor', label: 'Doutora', icon: Settings },
      { id: 'chat', label: 'Chat', icon: MessageSquare },
      { id: 'calls', label: 'Chamadas', icon: Video },
      { id: 'reviews', label: 'Reviews', icon: Star },
      { id: 'checkout', label: 'Checkout', icon: ShoppingCart },
      { id: 'offers', label: 'Upsell/Downsell', icon: Tag },
      { id: 'integrations', label: 'Integrações', icon: Link },
      { id: 'marketing', label: 'Email Marketing', icon: Mail }
    ];

    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center gap-1 p-1 bg-neutral-950/50 border border-white/5 rounded-2xl overflow-x-auto no-scrollbar">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                  tab === t.id ? "text-white" : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
                )}
              >
                {tab === t.id && (
                  <div
                    className="absolute inset-0 bg-neutral-800 rounded-xl shadow-sm animate-in fade-in duration-300"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </span>
              </button>
            ))}
          </div>

          <div className="relative">
            <div
              key={tab}
              className="bg-neutral-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300"
            >
              {tab === 'doctor' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-bold text-white mb-1">Configurações da Doutora</h3>
                    <p className="text-neutral-400 text-sm">Personalize a identidade visual e informações básicas.</p>
                  </div>
                  <div>
                    <FieldLabel label="Nome" />
                    <TextInput value={def.doctor.name} onChange={(v) => updateDoctor({ name: v })} placeholder="Dra. Ana" />
                  </div>
                  <div>
                    <FieldLabel label="Cargo" />
                    <TextInput value={def.doctor.role} onChange={(v) => updateDoctor({ role: v })} placeholder="Fertilidade" />
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel label="Avatar URL" />
                    <div className="flex gap-2">
                      <TextInput value={def.doctor.avatarUrl} onChange={(v) => updateDoctor({ avatarUrl: v })} type="url" className="flex-1" />
                      <label className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/10 shrink-0">
                        <Upload className="w-4 h-4" />
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const res = await adminUploadFile(file);
                              updateDoctor({ avatarUrl: res.url });
                            } catch (err) {
                              alert('Erro ao enviar arquivo: ' + (err instanceof Error ? err.message : String(err)));
                            }
                          }} 
                        />
                      </label>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel label="Wallpaper URL" />
                    <div className="flex gap-2">
                      <TextInput value={def.doctor.wallpaperUrl} onChange={(v) => updateDoctor({ wallpaperUrl: v })} type="url" className="flex-1" />
                      <label className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/10 shrink-0">
                        <Upload className="w-4 h-4" />
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const res = await adminUploadFile(file);
                              updateDoctor({ wallpaperUrl: res.url });
                            } catch (err) {
                              console.error(err);
                              alert(`Erro ao enviar arquivo: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
                            }
                          }} 
                        />
                      </label>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <FieldLabel label="Tema" hint="Aparência do funil" />
                    <div className="flex gap-2">
                       <button
                         onClick={() => updateTheme('light')}
                         className={cn(
                           "flex-1 p-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2",
                           (def.theme || 'light') === 'light'
                             ? "bg-white text-black border-white"
                             : "bg-neutral-900 text-neutral-400 border-white/10 hover:bg-neutral-800"
                         )}
                       >
                         <Sun className="w-4 h-4" />
                         Claro (Light)
                       </button>
                       <button
                         onClick={() => updateTheme('dark')}
                         className={cn(
                           "flex-1 p-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2",
                           def.theme === 'dark'
                             ? "bg-neutral-800 text-white border-white/20"
                             : "bg-neutral-900 text-neutral-400 border-white/10 hover:bg-neutral-800"
                         )}
                       >
                         <Moon className="w-4 h-4" />
                         Escuro (Dark)
                       </button>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'chat' && (
                <div className="space-y-8">
                  {(['part1', 'part2'] as const).map((part) => (
                    <div key={part} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white">{part === 'part1' ? 'Parte 1: Introdução' : 'Parte 2: VSL/Oferta'}</h3>
                          <p className="text-neutral-400 text-sm">Sequência de mensagens do chat.</p>
                        </div>
                        <button onClick={() => addChatMessage(part)} className="flex items-center gap-2 text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-4 py-2 transition-all shadow-lg shadow-purple-900/20">
                          <Plus className="w-4 h-4" />
                          Adicionar mensagem
                        </button>
                      </div>

                      <div className="space-y-4">
                        {def.chat[part].map((m, idx) => (
                          <div
                            key={`${m.id}-${idx}`}
                            className="bg-neutral-950/50 border border-white/5 rounded-2xl p-5 relative group animate-in fade-in slide-in-from-bottom-2 duration-300"
                          >
                            <div className="flex items-center justify-between gap-2 mb-4">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center border text-xs font-bold",
                                    m.sender === 'doctor' ? "bg-purple-500/20 border-purple-500/50 text-purple-300" : "bg-neutral-800 border-neutral-700 text-neutral-400"
                                  )}>
                                    {idx + 1}
                                  </div>
                                  <div className="text-sm font-bold text-white">
                                    {m.sender === 'doctor' ? 'Doutora' : 'Usuária'}
                                    <span className="mx-2 text-neutral-600">·</span>
                                    <span className="text-neutral-400 uppercase text-xs">{m.type}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => moveChatMessage(part, idx, idx - 1)}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
                                  >
                                    <ArrowUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => moveChatMessage(part, idx, idx + 1)}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
                                  >
                                    <ArrowDown className="w-4 h-4" />
                                  </button>
                                  <div className="w-px h-4 bg-white/10 mx-1" />
                                  <button
                                    onClick={() => removeChatMessage(part, idx)}
                                    className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-3">
                                  <FieldLabel label="Remetente" />
                                  <Select
                                    value={m.sender}
                                    onChange={(v) => updateChatMessage(part, idx, { sender: v as ChatMessage['sender'] })}
                                    options={[
                                      { value: 'doctor', label: 'Doutora' },
                                      { value: 'user', label: 'Usuária' }
                                    ]}
                                  />
                                </div>
                                <div className="md:col-span-3">
                                  <FieldLabel label="Tipo" />
                                  <Select
                                    value={m.type}
                                    onChange={(v) => updateChatMessage(part, idx, { type: v as ChatMessage['type'] })}
                                    options={[
                                      { value: 'text', label: 'Texto' },
                                      { value: 'audio', label: 'Áudio' },
                                      { value: 'image', label: 'Imagem' },
                                      { value: 'video', label: 'Vídeo' }
                                    ]}
                                  />
                                </div>
                                <div className="md:col-span-3">
                                  <FieldLabel label="Delay (ms)" />
                                  <NumberInput value={Number(m.delay || 0)} onChange={(v) => updateChatMessage(part, idx, { delay: v })} min={0} step={100} />
                                </div>
                                <div className="md:col-span-3">
                                  <FieldLabel label="Ação Especial" hint="Transição" />
                                  <Select
                                    value={m.action || ''}
                                    onChange={(v) => updateChatMessage(part, idx, { action: (v || undefined) as ChatMessage['action'] })}
                                    options={[
                                      { value: '', label: '—' },
                                      { value: 'open_video', label: 'Abrir Vídeo' },
                                      { value: 'skip_video', label: 'Pular Vídeo' },
                                      { value: 'open_reviews', label: 'Abrir Reviews' }
                                    ]}
                                  />
                                </div>
                                <div className="md:col-span-12">
                                  <FieldLabel 
                                    label={m.type === 'text' ? "Conteúdo" : "Arquivo de Mídia"} 
                                    hint={m.type === 'audio' ? 'Duração (ex: 0:42)' : undefined} 
                                  />
                                  {m.type === 'text' ? (
                                    <TextArea value={m.content} onChange={(v) => updateChatMessage(part, idx, { content: v })} rows={3} />
                                  ) : (
                                    <div className="space-y-3 p-4 bg-neutral-900/50 rounded-xl border border-white/5">
                                      <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3">
                                          <label className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl cursor-pointer transition-colors text-sm font-semibold shadow-lg shadow-purple-900/20">
                                            <Upload className="w-4 h-4" />
                                            <span>Escolher Arquivo</span>
                                            <input 
                                              type="file" 
                                              className="hidden" 
                                              accept={m.type === 'audio' ? 'audio/*' : m.type === 'video' ? 'video/*' : 'image/*'}
                                              onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                try {
                                                  const res = await adminUploadFile(file);
                                                  updateChatMessage(part, idx, { mediaUrl: res.url });
                                                } catch (err) {
                                                  console.error(err);
                                                  alert(`Erro ao enviar arquivo: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
                                                }
                                              }}
                                            />
                                          </label>
                                          {m.mediaUrl ? (
                                            <span className="text-xs text-green-400 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20">
                                              <Check className="w-3 h-3" /> Carregado
                                            </span>
                                          ) : (
                                            <span className="text-xs text-neutral-500">Nenhum arquivo selecionado</span>
                                          )}
                                        </div>
                                        
                                        {m.mediaUrl && (
                                          <div className="text-xs text-neutral-400 break-all font-mono bg-black/20 p-2 rounded-lg border border-white/5">
                                            {m.mediaUrl}
                                          </div>
                                        )}
                                      </div>

                                      <div>
                                         <FieldLabel label={m.type === 'audio' ? "Duração (ex: 0:42)" : "Texto Alternativo / Descrição"} />
                                         <TextInput value={m.content} onChange={(v) => updateChatMessage(part, idx, { content: v })} />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="md:col-span-12">
                                  <Toggle
                                    checked={Boolean(m.requiresInput)}
                                    onChange={(checked) => updateChatMessage(part, idx, { requiresInput: checked || undefined })}
                                    label="Pausar e aguardar resposta da usuária"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        
                        {def.chat[part].length === 0 ? (
                          <div className="text-center py-12 border-2 border-dashed border-neutral-800 rounded-2xl text-neutral-500">
                            Nenhuma mensagem nesta seção.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'calls' && (
                <div className="space-y-8">
                  {/* Incoming Call Screen (Ringtone) */}
                  <div className="space-y-4">
                     <div>
                        <h3 className="text-lg font-bold text-white">1. Tela de Chamada (Recebimento)</h3>
                        <p className="text-neutral-400 text-sm">Configure o visual e som da chamada chegando.</p>
                     </div>
                     <div className="bg-neutral-950/50 border border-white/5 rounded-2xl p-6">
                        <FieldLabel label="Áudio do Toque (Ringtone)" hint="Som que toca enquanto chama" />
                        <div className="flex gap-2">
                           <TextInput 
                             value={def.incomingCall?.ringtoneUrl || ''} 
                             onChange={(v) => updateIncomingCall({ ringtoneUrl: v })} 
                             className="flex-1" 
                             placeholder="https://..."
                           />
                           <label className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/10 shrink-0">
                              <Upload className="w-4 h-4" />
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="audio/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const res = await adminUploadFile(file);
                                    updateIncomingCall({ ringtoneUrl: res.url });
                                  } catch (err) {
                                    alert('Erro ao enviar arquivo');
                                  }
                                }} 
                              />
                           </label>
                        </div>
                     </div>
                  </div>

                  {/* Voice Call Screen (Connected) */}
                  <div className="space-y-4">
                     <div>
                        <h3 className="text-lg font-bold text-white">2. Chamada de Voz (Ao Atender)</h3>
                        <p className="text-neutral-400 text-sm">O que acontece quando a pessoa atende a ligação.</p>
                     </div>
                     <div className="bg-neutral-950/50 border border-white/5 rounded-2xl p-6 space-y-6">
                        <div>
                           <FieldLabel label="Áudio da Voz" hint="Gravação que simula a doutora falando" />
                           <div className="flex gap-2">
                              <TextInput 
                                value={def.incomingCall?.voiceUrl || ''} 
                                onChange={(v) => updateIncomingCall({ voiceUrl: v })} 
                                className="flex-1" 
                                placeholder="https://..."
                              />
                              <label className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/10 shrink-0">
                                 <Upload className="w-4 h-4" />
                                 <input 
                                   type="file" 
                                   className="hidden" 
                                   accept="audio/*"
                                   onChange={async (e) => {
                                     const file = e.target.files?.[0];
                                     if (!file) return;
                                     try {
                                       const res = await adminUploadFile(file);
                                       updateIncomingCall({ voiceUrl: res.url });
                                     } catch (err) {
                                       alert('Erro ao enviar arquivo');
                                     }
                                   }} 
                                 />
                              </label>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                              <FieldLabel label="Duração (segundos)" hint="Tempo total até encerrar a chamada de voz" />
                              <NumberInput 
                                value={def.incomingCall?.duration || 12} 
                                onChange={(v) => updateIncomingCall({ duration: v })} 
                                min={5}
                              />
                           </div>
                           <div>
                              <FieldLabel label="Após encerrar" />
                              <Toggle 
                                checked={def.incomingCall?.autoStartVideo || false}
                                onChange={(v) => updateIncomingCall({ autoStartVideo: v })}
                                label="Ir direto para chamada de vídeo"
                              />
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Video Call Section */}
                  <div className="space-y-4">
                     <div>
                        <h3 className="text-lg font-bold text-white">3. Chamada de Vídeo</h3>
                        <p className="text-neutral-400 text-sm">Configuração da videochamada (FaceTime simulado).</p>
                     </div>
                     <div className="bg-neutral-950/50 border border-white/5 rounded-2xl p-6 space-y-6">
                        <div>
                           <FieldLabel label="URL do Vídeo" />
                           <div className="flex gap-2">
                              <TextInput 
                                value={def.videoCall?.videoUrl || ''} 
                                onChange={(v) => updateVideoCall({ videoUrl: v })} 
                                className="flex-1" 
                                placeholder="https://..."
                              />
                              <label className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/10 shrink-0">
                                 <Upload className="w-4 h-4" />
                                 <input 
                                   type="file" 
                                   className="hidden" 
                                   accept="video/*"
                                   onChange={async (e) => {
                                     const file = e.target.files?.[0];
                                     if (!file) return;
                                     try {
                                       const res = await adminUploadFile(file);
                                       updateVideoCall({ videoUrl: res.url });
                                     } catch (err) {
                                       alert('Erro ao enviar arquivo');
                                     }
                                   }} 
                                 />
                              </label>
                           </div>
                        </div>
                        <div>
                           <FieldLabel label="Duração (segundos)" />
                           <NumberInput 
                             value={def.videoCall?.duration || 60} 
                             onChange={(v) => updateVideoCall({ duration: v })} 
                             min={0}
                           />
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {tab === 'reviews' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">Prova Social</h3>
                      <p className="text-neutral-400 text-sm">Gerencie os depoimentos e comentários.</p>
                    </div>
                    <button onClick={addReviewItem} className="flex items-center gap-2 text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-4 py-2 transition-all shadow-lg shadow-purple-900/20">
                      <Plus className="w-4 h-4" />
                      Adicionar review
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      {def.reviews.items.map((r, idx) => (
                        <div
                          key={`${r.id}-${idx}`}
                          className="bg-neutral-950/50 border border-white/5 rounded-2xl p-5 relative group animate-in fade-in zoom-in-95 duration-300"
                        >
                          <div className="flex items-center justify-between gap-2 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-300 flex items-center justify-center text-xs font-bold">
                                {idx + 1}
                              </div>
                              <div className="text-sm font-bold text-white">
                                {r.name || 'Novo Review'}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs font-medium bg-neutral-800 text-neutral-300 rounded-lg px-3 py-1.5"
                              >
                                {r.comments?.length || 0} Comentários
                              </span>
                              <div className="w-px h-4 bg-white/10 mx-1" />
                              <button onClick={() => moveReviewItem(idx, idx - 1)} className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white"><ArrowUp className="w-4 h-4" /></button>
                              <button onClick={() => moveReviewItem(idx, idx + 1)} className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white"><ArrowDown className="w-4 h-4" /></button>
                              <button onClick={() => removeReviewItem(idx)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-4">
                              <FieldLabel label="Nome" />
                              <TextInput value={r.name} onChange={(v) => updateReviewItem(idx, { name: v })} placeholder="Mariana S." />
                            </div>
                            <div className="md:col-span-2">
                              <FieldLabel label="Id" />
                              <NumberInput value={Number(r.id || 0)} onChange={(v) => updateReviewItem(idx, { id: v })} min={1} step={1} />
                            </div>
                            <div className="md:col-span-2">
                              <FieldLabel label="Idade" />
                              <NumberInput value={Number(r.age || 0)} onChange={(v) => updateReviewItem(idx, { age: v })} min={0} step={1} />
                            </div>
                            <div className="md:col-span-4">
                              <FieldLabel label="Local" />
                              <TextInput value={r.location} onChange={(v) => updateReviewItem(idx, { location: v })} placeholder="São Paulo, SP" />
                            </div>
                            <div className="md:col-span-12">
                              <FieldLabel label="Texto do Review" />
                              <TextArea value={r.text} onChange={(v) => updateReviewItem(idx, { text: v })} rows={3} />
                            </div>
                            <div className="md:col-span-3">
                              <FieldLabel label="Likes" />
                              <TextInput value={r.likes} onChange={(v) => updateReviewItem(idx, { likes: v })} placeholder="12,3K" />
                            </div>
                            <div className="md:col-span-9">
                              <FieldLabel label="Vídeo URL (opcional)" />
                              <div className="flex gap-2">
                                <TextInput value={r.videoUrl || ''} onChange={(v) => updateReviewItem(idx, { videoUrl: v || undefined })} type="url" className="flex-1" />
                                <label className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/10 shrink-0">
                                  <Upload className="w-4 h-4" />
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="video/*"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      try {
                                        const res = await adminUploadFile(file);
                                        updateReviewItem(idx, { videoUrl: res.url });
                                      } catch (err) {
                                        alert('Erro ao enviar arquivo');
                                      }
                                    }} 
                                  />
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Nested Comments Section */}
                          <div className="mt-6 pl-4 border-l-2 border-neutral-800 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-neutral-400">Comentários</h4>
                              <button onClick={() => addComment(idx)} className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300">
                                <Plus className="w-3 h-3" /> Adicionar
                              </button>
                            </div>
                            {(r.comments || []).map((c, cIdx) => (
                              <div key={`${idx}-${cIdx}`} className="bg-neutral-900/50 rounded-xl p-3 border border-white/5 relative group/comment">
                                <button onClick={() => removeComment(idx, cIdx)} className="absolute top-2 right-2 opacity-0 group-hover/comment:opacity-100 p-1 hover:bg-red-500/20 rounded text-red-400 transition-all">
                                  <X className="w-3 h-3" />
                                </button>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  <TextInput className="text-xs py-2" value={c.user} onChange={(v) => updateComment(idx, cIdx, { user: v })} placeholder="Nome" />
                                  <TextInput className="text-xs py-2" value={c.time} onChange={(v) => updateComment(idx, cIdx, { time: v })} placeholder="Tempo" />
                                  <NumberInput className="text-xs py-2" value={Number(c.likes || 0)} onChange={(v) => updateComment(idx, cIdx, { likes: v })} placeholder="Likes" />
                                  <NumberInput className="text-xs py-2" value={Number(c.avatarId || 1)} onChange={(v) => updateComment(idx, cIdx, { avatarId: v })} placeholder="Avatar ID" />
                                  <div className="col-span-2 md:col-span-4 flex gap-2">
                                    <TextInput className="text-xs py-2 flex-1" value={c.avatarUrl || ''} onChange={(v) => updateComment(idx, cIdx, { avatarUrl: v })} placeholder="URL do Avatar (opcional)" />
                                    <label className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/10 shrink-0">
                                      <Upload className="w-3 h-3" />
                                      <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                          const res = await adminUploadFile(file);
                                          updateComment(idx, cIdx, { avatarUrl: res.url });
                                        } catch (err) { alert('Erro: ' + (err instanceof Error ? err.message : String(err))); }
                                      }} />
                                    </label>
                                  </div>
                                  <div className="col-span-2 md:col-span-4">
                                    <TextArea className="text-xs min-h-[40px]" value={c.text} onChange={(v) => updateComment(idx, cIdx, { text: v })} rows={2} />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {def.reviews.items.length === 0 && <div className="text-center py-8 text-neutral-500">Nenhum review adicionado.</div>}
                  </div>
                </div>
              )}

              {tab === 'checkout' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Página de Checkout</h3>
                      <p className="text-neutral-400 text-sm">Configure os blocos e o design do checkout.</p>
                    </div>
                    {!def.checkout.blocks?.length && (
                      <button 
                        type="button"
                        onClick={enablePagebuilder}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-purple-900/20 transition-all flex items-center gap-2"
                      >
                        <Layout className="w-4 h-4" />
                        Ativar Pagebuilder
                      </button>
                    )}
                  </div>

                  {def.checkout.blocks && def.checkout.blocks.length > 0 ? (
                    <div className="space-y-4">
                      {/* Block List */}
                      {def.checkout.blocks.map((block, idx) => {
                        if (!block) return null;
                        return (
                        <div
                          key={block.id || idx}
                          className="bg-neutral-950/50 border border-white/5 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300"
                        >
                          {/* Block Header */}
                            <div className="bg-neutral-900/50 p-3 flex items-center justify-between border-b border-white/5">
                              <div className="flex items-center gap-3">
                                <span className="bg-neutral-800 text-neutral-400 px-2 py-1 rounded text-xs font-mono uppercase">{block.type}</span>
                                <span className="text-sm font-bold text-white">
                                  {block.type === 'header' && 'Cabeçalho Simples'}
                                  {block.type === 'hero' && 'Oferta Principal'}
                                  {block.type === 'bullets' && 'Lista de Benefícios'}
                                  {block.type === 'guarantee' && 'Garantia'}
                                  {block.type === 'reviews' && 'Prova Social'}
                                  {block.type === 'faq' && 'Perguntas Frequentes'}
                                  {block.type === 'html' && 'Código HTML'}
                                  {block.type === 'footer' && 'Rodapé'}
                                  {block.type === 'video' && 'Vídeo'}
                                  {block.type === 'image' && 'Imagem'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => moveBlock(idx, idx - 1)} disabled={idx === 0} className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                                <button onClick={() => moveBlock(idx, idx + 1)} disabled={idx === def.checkout.blocks!.length - 1} className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                                <button onClick={() => removeBlock(idx)} className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>

                            {/* Block Content Editor */}
                            <div className="p-4 space-y-4">
                              {block.type === 'header' && (
                                <div><FieldLabel label="Texto" /><TextInput value={block.content.text} onChange={(v) => updateBlock(idx, { content: { ...block.content, text: v } })} /></div>
                              )}
                              
                              {block.type === 'hero' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="md:col-span-2"><FieldLabel label="Headline" /><TextArea value={block.content.headline} onChange={(v) => updateBlock(idx, { content: { ...block.content, headline: v } })} rows={2} /></div>
                                  <div className="md:col-span-2"><FieldLabel label="Subheadline" /><TextArea value={block.content.subheadline} onChange={(v) => updateBlock(idx, { content: { ...block.content, subheadline: v } })} rows={2} /></div>
                                  <div><FieldLabel label="Nome Produto" /><TextInput value={block.content.productName} onChange={(v) => updateBlock(idx, { content: { ...block.content, productName: v } })} /></div>
                                  <div><FieldLabel label="Badge" /><TextInput value={block.content.badge} onChange={(v) => updateBlock(idx, { content: { ...block.content, badge: v } })} /></div>
                                  <div><FieldLabel label="Preço" /><TextInput value={block.content.price} onChange={(v) => updateBlock(idx, { content: { ...block.content, price: v } })} /></div>
                                  <div><FieldLabel label="Preço Comparação" /><TextInput value={block.content.compareAtPrice} onChange={(v) => updateBlock(idx, { content: { ...block.content, compareAtPrice: v } })} /></div>
                                  <div><FieldLabel label="Botão CTA" /><TextInput value={block.content.ctaText} onChange={(v) => updateBlock(idx, { content: { ...block.content, ctaText: v } })} /></div>
                                  <div><FieldLabel label="Texto Seguro" /><TextInput value={block.content.secureText} onChange={(v) => updateBlock(idx, { content: { ...block.content, secureText: v } })} /></div>
                                  <div className="md:col-span-2">
                                    <FieldLabel label="Imagem do Produto" />
                                    <div className="flex gap-2">
                                      <TextInput value={block.content.productImageUrl || ''} onChange={(v) => updateBlock(idx, { content: { ...block.content, productImageUrl: v } })} className="flex-1" />
                                      <label className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/10 shrink-0">
                                        <Upload className="w-4 h-4" />
                                        <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          try {
                                            const res = await adminUploadFile(file);
                                            updateBlock(idx, { content: { ...block.content, productImageUrl: res.url } });
                                          } catch (err) { alert('Erro ao enviar arquivo'); }
                                        }} />
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {block.type === 'bullets' && (
                                <div>
                                  <FieldLabel label="Título" />
                                  <TextInput value={block.content.title} onChange={(v) => updateBlock(idx, { content: { ...block.content, title: v } })} className="mb-3" />
                                  <FieldLabel label="Itens" />
                                  <div className="space-y-2">
                                    {(block.content.items || []).map((item: string, i: number) => (
                                      <div key={i} className="flex gap-2">
                                        <TextInput value={item} onChange={(v) => {
                                          const newItems = [...block.content.items];
                                          newItems[i] = v;
                                          updateBlock(idx, { content: { ...block.content, items: newItems } });
                                        }} />
                                        <button onClick={() => {
                                          const newItems = block.content.items.filter((_: any, idx: number) => idx !== i);
                                          updateBlock(idx, { content: { ...block.content, items: newItems } });
                                        }} className="p-2 hover:bg-red-500/10 text-red-400 rounded"><X className="w-4 h-4" /></button>
                                      </div>
                                    ))}
                                    <button onClick={() => updateBlock(idx, { content: { ...block.content, items: [...(block.content.items || []), ''] } })} className="text-xs flex items-center gap-1 text-purple-400 font-bold hover:text-purple-300"><Plus className="w-3 h-3" /> Adicionar Item</button>
                                  </div>
                                </div>
                              )}

                              {block.type === 'guarantee' && (
                                <div className="space-y-3">
                                  <div><FieldLabel label="Título" /><TextInput value={block.content.title} onChange={(v) => updateBlock(idx, { content: { ...block.content, title: v } })} /></div>
                                  <div><FieldLabel label="Texto" /><TextArea value={block.content.text} onChange={(v) => updateBlock(idx, { content: { ...block.content, text: v } })} rows={3} /></div>
                                </div>
                              )}

                              {block.type === 'html' && (
                                <div><FieldLabel label="HTML Personalizado" /><TextArea value={block.content.html} onChange={(v) => updateBlock(idx, { content: { ...block.content, html: v } })} rows={6} className="font-mono text-xs" /></div>
                              )}
                              
                              {block.type === 'footer' && (
                                <div>
                                  <FieldLabel label="Linhas do Rodapé" />
                                  <div className="space-y-2">
                                    {(block.content.lines || []).map((line: string, i: number) => (
                                      <div key={i} className="flex gap-2">
                                        <TextInput value={line} onChange={(v) => {
                                          const newLines = [...block.content.lines];
                                          newLines[i] = v;
                                          updateBlock(idx, { content: { ...block.content, lines: newLines } });
                                        }} />
                                        <button onClick={() => {
                                          const newLines = block.content.lines.filter((_: any, idx: number) => idx !== i);
                                          updateBlock(idx, { content: { ...block.content, lines: newLines } });
                                        }} className="p-2 hover:bg-red-500/10 text-red-400 rounded"><X className="w-4 h-4" /></button>
                                      </div>
                                    ))}
                                    <button onClick={() => updateBlock(idx, { content: { ...block.content, lines: [...(block.content.lines || []), ''] } })} className="text-xs flex items-center gap-1 text-purple-400 font-bold hover:text-purple-300"><Plus className="w-3 h-3" /> Adicionar Linha</button>
                                  </div>
                                </div>
                              )}

                              {block.type === 'video' && (
                                <div className="space-y-3">
                                  <div>
                                    <FieldLabel label="URL do Vídeo" />
                                    <div className="flex gap-2">
                                      <TextInput value={block.content.url} onChange={(v) => updateBlock(idx, { content: { ...block.content, url: v } })} className="flex-1" />
                                      <label className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/10 shrink-0">
                                        <Upload className="w-4 h-4" />
                                        <input type="file" className="hidden" accept="video/*" onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          try {
                                            const res = await adminUploadFile(file);
                                            updateBlock(idx, { content: { ...block.content, url: res.url } });
                                          } catch (err) { alert('Erro ao enviar arquivo'); }
                                        }} />
                                      </label>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-sm text-neutral-300">
                                      <input type="checkbox" checked={block.content.autoplay} onChange={(e) => updateBlock(idx, { content: { ...block.content, autoplay: e.target.checked } })} className="rounded bg-neutral-800 border-white/10 text-purple-500 focus:ring-purple-500" />
                                      Autoplay
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-neutral-300">
                                      <input type="checkbox" checked={block.content.controls} onChange={(e) => updateBlock(idx, { content: { ...block.content, controls: e.target.checked } })} className="rounded bg-neutral-800 border-white/10 text-purple-500 focus:ring-purple-500" />
                                      Controles
                                    </label>
                                  </div>
                                </div>
                              )}

                              {block.type === 'image' && (
                                <div className="space-y-3">
                                  <div>
                                    <FieldLabel label="URL da Imagem" />
                                    <div className="flex gap-2">
                                      <TextInput value={block.content.url} onChange={(v) => updateBlock(idx, { content: { ...block.content, url: v } })} className="flex-1" />
                                      <label className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/10 shrink-0">
                                        <Upload className="w-4 h-4" />
                                        <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          try {
                                            const res = await adminUploadFile(file);
                                            updateBlock(idx, { content: { ...block.content, url: res.url } });
                                          } catch (err) { alert('Erro ao enviar arquivo'); }
                                        }} />
                                      </label>
                                    </div>
                                  </div>
                                  <div><FieldLabel label="Texto Alt (Acessibilidade)" /><TextInput value={block.content.alt} onChange={(v) => updateBlock(idx, { content: { ...block.content, alt: v } })} /></div>
                                </div>
                              )}

                              {block.type === 'faq' && (
                                <div>
                                  <FieldLabel label="Perguntas Frequentes" />
                                  <div className="space-y-4">
                                    {(block.content.items || []).map((item: any, i: number) => {
                                      if (!item) return null;
                                      return (
                                      <div key={i} className="bg-neutral-900/50 p-3 rounded-xl border border-white/5 relative group">
                                        <button onClick={() => {
                                          const newItems = block.content.items.filter((_: any, idx: number) => idx !== i);
                                          updateBlock(idx, { content: { ...block.content, items: newItems } });
                                        }} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                        
                                        <div className="space-y-2">
                                          <TextInput placeholder="Pergunta" value={item.question} onChange={(v) => {
                                            const newItems = [...block.content.items];
                                            newItems[i] = { ...item, question: v };
                                            updateBlock(idx, { content: { ...block.content, items: newItems } });
                                          }} />
                                          <TextArea placeholder="Resposta" value={item.answer} onChange={(v) => {
                                            const newItems = [...block.content.items];
                                            newItems[i] = { ...item, answer: v };
                                            updateBlock(idx, { content: { ...block.content, items: newItems } });
                                          }} rows={2} />
                                        </div>
                                      </div>
                                    );
                                    })}
                                    <button onClick={() => updateBlock(idx, { content: { ...block.content, items: [...(block.content.items || []), { question: '', answer: '' }] } })} className="text-xs flex items-center gap-1 text-purple-400 font-bold hover:text-purple-300"><Plus className="w-3 h-3" /> Adicionar Pergunta</button>
                                  </div>
                                </div>
                              )}

                              {block.type === 'reviews' && (
                                <div>
                                  <FieldLabel label="Avaliações de Clientes" />
                                  <div className="space-y-4">
                                    {(block.content.items || []).map((item: any, i: number) => {
                                      if (!item) return null;
                                      return (
                                      <div key={i} className="bg-neutral-900/50 p-3 rounded-xl border border-white/5 relative group">
                                        <button onClick={() => {
                                          const newItems = block.content.items.filter((_: any, idx: number) => idx !== i);
                                          updateBlock(idx, { content: { ...block.content, items: newItems } });
                                        }} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                                          <TextInput placeholder="Nome" value={item.name} onChange={(v) => {
                                            const newItems = [...block.content.items];
                                            newItems[i] = { ...item, name: v };
                                            updateBlock(idx, { content: { ...block.content, items: newItems } });
                                          }} />
                                          <TextInput placeholder="Tempo (ex: 2 min atrás)" value={item.timeAgo} onChange={(v) => {
                                            const newItems = [...block.content.items];
                                            newItems[i] = { ...item, timeAgo: v };
                                            updateBlock(idx, { content: { ...block.content, items: newItems } });
                                          }} />
                                        </div>
                                        <div className="flex gap-2 mb-2">
                                           <TextInput placeholder="Avatar URL" value={item.avatar} onChange={(v) => {
                                            const newItems = [...block.content.items];
                                            newItems[i] = { ...item, avatar: v };
                                            updateBlock(idx, { content: { ...block.content, items: newItems } });
                                          }} className="flex-1" />
                                          <label className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/10 shrink-0">
                                            <Upload className="w-4 h-4" />
                                            <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                              const file = e.target.files?.[0];
                                              if (!file) return;
                                              try {
                                                const res = await adminUploadFile(file);
                                                const newItems = [...block.content.items];
                                                newItems[i] = { ...item, avatar: res.url };
                                                updateBlock(idx, { content: { ...block.content, items: newItems } });
                                              } catch (err) { alert('Erro: ' + (err instanceof Error ? err.message : String(err))); }
                                            }} />
                                          </label>
                                        </div>
                                        <TextArea placeholder="Depoimento" value={item.text} onChange={(v) => {
                                          const newItems = [...block.content.items];
                                          newItems[i] = { ...item, text: v };
                                          updateBlock(idx, { content: { ...block.content, items: newItems } });
                                        }} rows={2} />
                                      </div>
                                    );
                                    })}
                                    <button onClick={() => updateBlock(idx, { content: { ...block.content, items: [...(block.content.items || []), { name: '', text: '', avatar: '', rating: 5, timeAgo: 'agora' }] } })} className="text-xs flex items-center gap-1 text-purple-400 font-bold hover:text-purple-300"><Plus className="w-3 h-3" /> Adicionar Review</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}


                      {/* Add Block Actions */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-4 border-t border-white/5">
                        {[
                          { type: 'header', label: 'Cabeçalho', icon: Layout },
                          { type: 'hero', label: 'Oferta', icon: Star },
                          { type: 'bullets', label: 'Benefícios', icon: CheckCircle },
                          { type: 'guarantee', label: 'Garantia', icon: ShieldCheck },
                          { type: 'reviews', label: 'Reviews', icon: MessageSquare },
                          { type: 'faq', label: 'FAQ', icon: HelpCircle },
                          { type: 'html', label: 'HTML', icon: Code },
                          { type: 'video', label: 'Vídeo', icon: Video },
                          { type: 'image', label: 'Imagem', icon: Image },
                          { type: 'footer', label: 'Rodapé', icon: Layout },
                        ].map((item) => (
                          <button
                            key={item.type}
                            onClick={() => addBlock(item.type as any)}
                            className="flex flex-col items-center justify-center gap-2 bg-neutral-900/50 hover:bg-neutral-800 border border-white/5 hover:border-purple-500/30 p-4 rounded-xl transition-all group"
                          >
                            <item.icon className="w-6 h-6 text-neutral-400 group-hover:text-purple-400 transition-colors" />
                            <span className="text-xs font-bold text-neutral-300 group-hover:text-white">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-bold text-yellow-500">Modo Legado</h4>
                            <p className="text-xs text-yellow-200/70">Você está usando a configuração antiga. Recomendamos migrar para o Pagebuilder para ter mais flexibilidade.</p>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80 hover:opacity-100 transition-opacity">
                        <div>
                          <FieldLabel label="Header Label" />
                          <TextInput value={def.checkout.headerLabel} onChange={(v) => updateCheckout({ headerLabel: v })} />
                        </div>
                        <div>
                          <FieldLabel label="Badge" />
                          <TextInput value={def.checkout.badge} onChange={(v) => updateCheckout({ badge: v })} />
                        </div>
                        <div className="md:col-span-2">
                          <FieldLabel label="Headline" />
                          <TextArea value={def.checkout.headline} onChange={(v) => updateCheckout({ headline: v })} rows={2} />
                        </div>
                        <div className="md:col-span-2">
                          <FieldLabel label="Subheadline" />
                          <TextArea value={def.checkout.subheadline} onChange={(v) => updateCheckout({ subheadline: v })} rows={2} />
                        </div>
                        
                        <div className="md:col-span-2 h-px bg-white/5 my-2" />

                        <div>
                          <FieldLabel label="Nome do Produto" />
                          <TextInput value={def.checkout.productName} onChange={(v) => updateCheckout({ productName: v })} />
                        </div>
                        <div>
                          <FieldLabel label="Imagem do Produto URL" />
                          <div className="flex gap-2">
                            <TextInput value={def.checkout.productImageUrl || ''} onChange={(v) => updateCheckout({ productImageUrl: v })} type="url" className="flex-1" />
                            <label className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/10 shrink-0">
                              <Upload className="w-4 h-4" />
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const res = await adminUploadFile(file);
                                    updateCheckout({ productImageUrl: res.url });
                                  } catch (err) {
                                    alert('Erro ao enviar arquivo');
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                        <div>
                          <FieldLabel label="Preço (Display)" />
                          <TextInput value={def.checkout.price} onChange={(v) => updateCheckout({ price: v })} />
                        </div>
                        <div>
                          <FieldLabel label="Preço (Comparação)" />
                          <TextInput value={def.checkout.compareAtPrice} onChange={(v) => updateCheckout({ compareAtPrice: v })} />
                        </div>
                        <div>
                          <FieldLabel label="Valor em Centavos" hint={`R$ ${formatMoney(def.checkout.valueCents)}`} />
                          <NumberInput value={Number(def.checkout.valueCents || 0)} onChange={(v) => updateCheckout({ valueCents: v })} min={0} step={100} />
                        </div>

                        <div className="md:col-span-2 h-px bg-white/5 my-2" />

                        <div>
                          <FieldLabel label="CTA Primário" />
                          <TextInput value={def.checkout.primaryCtaText} onChange={(v) => updateCheckout({ primaryCtaText: v })} />
                        </div>
                        <div>
                          <FieldLabel label="CTA Secundário" />
                          <TextInput value={def.checkout.secondaryCtaText} onChange={(v) => updateCheckout({ secondaryCtaText: v })} />
                        </div>
                        <div className="md:col-span-2">
                          <FieldLabel label="Texto de Segurança" />
                          <TextInput value={def.checkout.securePaymentText} onChange={(v) => updateCheckout({ securePaymentText: v })} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-neutral-950/30 border border-white/5 rounded-2xl p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="font-bold text-sm text-white">Benefícios (Bullets)</div>
                            <button onClick={() => addStringItem('bullets', '')} className="p-1 hover:bg-white/10 rounded-lg"><Plus className="w-4 h-4" /></button>
                          </div>
                          <div className="space-y-2">
                            {def.checkout.bullets.map((b, idx) => (
                              <div key={idx} className="flex gap-2">
                                <TextInput value={b} onChange={(e) => updateStringItem('bullets', idx, e)} className="py-2" />
                                <button onClick={() => removeStringItem('bullets', idx)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg"><X className="w-4 h-4" /></button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-neutral-950/30 border border-white/5 rounded-2xl p-4">
                          <div className="font-bold text-sm text-white mb-4">Garantia</div>
                          <div className="space-y-3">
                            <div>
                              <FieldLabel label="Título" />
                              <TextInput value={def.checkout.guaranteeTitle} onChange={(v) => updateCheckout({ guaranteeTitle: v })} />
                            </div>
                            <div>
                              <FieldLabel label="Texto" />
                              <TextArea value={def.checkout.guaranteeText} onChange={(v) => updateCheckout({ guaranteeText: v })} rows={4} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-neutral-950/30 border border-white/5 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="font-bold text-sm text-white">Reviews do Checkout</div>
                          <button onClick={addCheckoutReview} className="text-xs flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-lg"><Plus className="w-3 h-3" /> Adicionar</button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {def.checkout.checkoutReviews.map((r, idx) => (
                            <div key={idx} className="bg-neutral-900/50 p-4 rounded-xl border border-white/5 relative group">
                              <button onClick={() => removeCheckoutReview(idx)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div><FieldLabel label="Nome" /><TextInput value={r.name} onChange={(v) => updateCheckoutReview(idx, { name: v })} /></div>
                                <div className="md:col-span-2">
                                  <FieldLabel label="Avatar URL" />
                                  <div className="flex gap-2">
                                    <TextInput value={r.avatarUrl} onChange={(v) => updateCheckoutReview(idx, { avatarUrl: v })} type="url" className="flex-1" />
                                    <label className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/10 shrink-0">
                                      <Upload className="w-4 h-4" />
                                      <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          try {
                                            const res = await adminUploadFile(file);
                                            updateCheckoutReview(idx, { avatarUrl: res.url });
                                          } catch (err) {
                                            alert('Erro: ' + (err instanceof Error ? err.message : String(err)));
                                          }
                                        }}
                                      />
                                    </label>
                                  </div>
                                </div>
                                <div className="md:col-span-3"><FieldLabel label="Depoimento" /><TextArea value={r.text} onChange={(v) => updateCheckoutReview(idx, { text: v })} rows={2} /></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'offers' && (
                <div className="space-y-8">
                   {([['upsells', 'Upsells'], ['downsells', 'Downsells']] as const).map(([kind, title]) => (
                     <div key={kind} className="space-y-4">
                       <div className="flex items-center justify-between">
                         <h3 className="text-lg font-bold text-white">{title}</h3>
                         <button onClick={() => addOffer(kind)} className="flex items-center gap-2 text-sm font-semibold bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl px-4 py-2">
                           <Plus className="w-4 h-4" /> Adicionar Oferta
                         </button>
                       </div>
                       
                         {def.offers[kind].map((o, idx) => (
                           <div
                             key={`${o.id}-${idx}`}
                             className="bg-neutral-950/50 border border-white/5 rounded-2xl p-5 relative animate-in fade-in duration-300"
                           >
                             <div className="flex items-center justify-between mb-4">
                               <div className="font-bold text-white flex items-center gap-2">
                                 <span className="bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded text-xs">#{idx + 1}</span>
                                 {o.title || 'Nova Oferta'}
                               </div>
                               <div className="flex items-center gap-1">
                                 <button onClick={() => moveOffer(kind, idx, idx - 1)} className="p-1.5 hover:bg-white/10 rounded-lg"><ArrowUp className="w-4 h-4" /></button>
                                 <button onClick={() => moveOffer(kind, idx, idx + 1)} className="p-1.5 hover:bg-white/10 rounded-lg"><ArrowDown className="w-4 h-4" /></button>
                                 <button onClick={() => removeOffer(kind, idx)} className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                               </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><FieldLabel label="ID Interno" /><TextInput value={o.id} onChange={(v) => updateOffer(kind, idx, { id: v })} /></div>
                                <div><FieldLabel label="ID Externo (Hotmart/Kiwify)" /><TextInput value={o.externalId || ''} onChange={(v) => updateOffer(kind, idx, { externalId: v })} placeholder="ex: PROD-123" /></div>
                                <div><FieldLabel label="Valor (Centavos)" /><NumberInput value={Number(o.valueCents || 0)} onChange={(v) => updateOffer(kind, idx, { valueCents: v })} min={0} step={100} /></div>
                                <div className="md:col-span-2"><FieldLabel label="Título" /><TextInput value={o.title} onChange={(v) => updateOffer(kind, idx, { title: v })} /></div>
                               <div className="md:col-span-2"><FieldLabel label="Subtítulo" /><TextArea value={o.subtitle} onChange={(v) => updateOffer(kind, idx, { subtitle: v })} rows={2} /></div>
                              <div className="md:col-span-2">
                                <FieldLabel label="Mídia URL (Imagem/Vídeo)" />
                                <div className="flex gap-2">
                                  <TextInput value={o.mediaUrl || ''} onChange={(v) => updateOffer(kind, idx, { mediaUrl: v })} type="url" className="flex-1" />
                                  <label className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/10 shrink-0">
                                    <Upload className="w-4 h-4" />
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      accept="image/*,video/*"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                          const res = await adminUploadFile(file);
                                          updateOffer(kind, idx, { mediaUrl: res.url });
                                        } catch (err) {
                                          alert('Erro ao enviar arquivo');
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>
                              <div><FieldLabel label="Preço Display" /><TextInput value={o.price} onChange={(v) => updateOffer(kind, idx, { price: v })} /></div>
                               <div><FieldLabel label="Preço Comparação" /><TextInput value={o.compareAtPrice || ''} onChange={(v) => updateOffer(kind, idx, { compareAtPrice: v || undefined })} /></div>
                               <div><FieldLabel label="Texto Aceitar" /><TextInput value={o.acceptText} onChange={(v) => updateOffer(kind, idx, { acceptText: v })} /></div>
                               <div><FieldLabel label="Texto Recusar" /><TextInput value={o.declineText} onChange={(v) => updateOffer(kind, idx, { declineText: v })} /></div>
                             </div>
                           </div>
                         ))}

                       {def.offers[kind].length === 0 && <div className="text-neutral-500 text-sm italic">Nenhuma oferta configurada.</div>}
                     </div>
                   ))}
                </div>
              )}

              {tab === 'integrations' && (
                <div className="space-y-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-white">Gateway de Pagamento</h3>
                      <p className="text-neutral-400 text-sm">Configure o processador de pagamentos.</p>
                    </div>
                    <div className="bg-neutral-950/50 border border-white/5 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                         <FieldLabel label="Provedor" />
                         <Select
                           value={def.integrations?.gateway?.provider || 'stripe'}
                           onChange={(v) => updateIntegrations({ gateway: { ...def.integrations?.gateway, provider: v as any } })}
                           options={[
                             { value: 'stripe', label: 'Stripe' },
                             { value: 'mercadopago', label: 'Mercado Pago' },
                             { value: 'custom', label: 'Customizado' }
                           ]}
                         />
                      </div>
                      <div>
                        <FieldLabel label="Public Key" />
                        <TextInput value={def.integrations?.gateway?.publicKey || ''} onChange={(v) => updateIntegrations({ gateway: { ...def.integrations?.gateway, publicKey: v } as any })} placeholder="pk_..." />
                      </div>
                      <div>
                        <FieldLabel label="Secret Key" />
                        <TextInput value={def.integrations?.gateway?.secretKey || ''} onChange={(v) => updateIntegrations({ gateway: { ...def.integrations?.gateway, secretKey: v } as any })} placeholder="sk_..." type="password" />
                      </div>
                      <div className="md:col-span-2">
                        <FieldLabel label="Pixel ID (Opcional)" />
                        <TextInput value={def.integrations?.gateway?.pixelId || ''} onChange={(v) => updateIntegrations({ gateway: { ...def.integrations?.gateway, pixelId: v } as any })} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-white">Plataformas Externas</h3>
                      <p className="text-neutral-400 text-sm">Integração com Hotmart, Kiwify, etc.</p>
                    </div>
                    <div className="bg-neutral-950/50 border border-white/5 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <Toggle 
                          checked={def.integrations?.externalPlatform?.enabled || false}
                          onChange={(v) => updateIntegrations({ externalPlatform: { ...def.integrations?.externalPlatform, enabled: v } as any })}
                          label="Ativar Integração Externa"
                        />
                      </div>
                      
                      {def.integrations?.externalPlatform?.enabled && (
                        <>
                          <div className="md:col-span-2">
                             <FieldLabel label="Plataforma" />
                             <Select
                               value={def.integrations?.externalPlatform?.provider || 'hotmart'}
                               onChange={(v) => updateIntegrations({ externalPlatform: { ...def.integrations?.externalPlatform, provider: v as any } as any })}
                               options={[
                                 { value: 'hotmart', label: 'Hotmart' },
                                 { value: 'kiwify', label: 'Kiwify' },
                                 { value: 'perfectpay', label: 'Perfect Pay' }
                               ]}
                             />
                          </div>
                          <div>
                            <FieldLabel label="Product ID" />
                            <TextInput value={def.integrations?.externalPlatform?.productId || ''} onChange={(v) => updateIntegrations({ externalPlatform: { ...def.integrations?.externalPlatform, productId: v } as any })} />
                          </div>
                          <div>
                            <FieldLabel label="Token / API Key" />
                            <TextInput value={def.integrations?.externalPlatform?.token || ''} onChange={(v) => updateIntegrations({ externalPlatform: { ...def.integrations?.externalPlatform, token: v } as any })} type="password" />
                          </div>
                          <div className="md:col-span-2">
                            <FieldLabel label="Webhook URL (Para receber notificações)" />
                            <TextInput value={def.integrations?.externalPlatform?.webhookUrl || ''} onChange={(v) => updateIntegrations({ externalPlatform: { ...def.integrations?.externalPlatform, webhookUrl: v } as any })} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'marketing' && (
                <div className="space-y-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-white">Email Marketing</h3>
                      <p className="text-neutral-400 text-sm">Conecte sua ferramenta de automação.</p>
                    </div>
                    <div className="bg-neutral-950/50 border border-white/5 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                         <FieldLabel label="Provedor" />
                         <Select
                           value={def.marketing?.emailMarketing?.provider || 'activecampaign'}
                           onChange={(v) => updateMarketing({ emailMarketing: { ...def.marketing?.emailMarketing, provider: v as any } })}
                           options={[
                             { value: 'activecampaign', label: 'ActiveCampaign' },
                             { value: 'mailchimp', label: 'Mailchimp' },
                             { value: 'n8n', label: 'n8n (Webhook)' },
                             { value: 'custom', label: 'Customizado' }
                           ]}
                         />
                      </div>
                      <div>
                        <FieldLabel label="API Key" />
                        <TextInput value={def.marketing?.emailMarketing?.apiKey || ''} onChange={(v) => updateMarketing({ emailMarketing: { ...def.marketing?.emailMarketing, apiKey: v } as any })} type="password" />
                      </div>
                      <div>
                        <FieldLabel label="List ID" />
                        <TextInput value={def.marketing?.emailMarketing?.listId || ''} onChange={(v) => updateMarketing({ emailMarketing: { ...def.marketing?.emailMarketing, listId: v } as any })} />
                      </div>
                      <div className="md:col-span-2">
                        <FieldLabel label="Webhook URL" />
                        <div className="flex gap-2">
                          <TextInput 
                            value={def.marketing?.emailMarketing?.webhookUrl || ''} 
                            onChange={(v) => updateMarketing({ emailMarketing: { ...def.marketing?.emailMarketing, webhookUrl: v } as any })} 
                            className="flex-1"
                          />
                          <button 
                            onClick={async () => {
                              if (!def.marketing?.emailMarketing?.webhookUrl) return alert('Preencha a URL primeiro');
                              try {
                                await fetch(def.marketing.emailMarketing.webhookUrl, { 
                                  method: 'POST', 
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ event: 'test_ping', timestamp: new Date().toISOString() })
                                });
                                alert('Webhook disparado com sucesso! Verifique sua plataforma.');
                              } catch (e) {
                                alert('Erro ao disparar webhook (pode ser bloqueio de CORS do navegador). O servidor enviará normalmente.');
                              }
                            }}
                            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold transition-colors"
                          >
                            Testar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-white">Recuperação de Carrinho</h3>
                      <p className="text-neutral-400 text-sm">Envio automático para quem não completou a compra.</p>
                    </div>
                    <div className="bg-neutral-950/50 border border-white/5 rounded-2xl p-6 grid grid-cols-1 gap-6">
                      <Toggle 
                        checked={def.marketing?.abandonedCart?.enabled || false}
                        onChange={(v) => updateMarketing({ abandonedCart: { ...def.marketing?.abandonedCart, enabled: v } as any })}
                        label="Ativar Recuperação de Carrinho"
                      />
                      
                      {def.marketing?.abandonedCart?.enabled && (
                        <>
                          <div>
                            <FieldLabel label="Delay (minutos)" />
                            <NumberInput value={def.marketing?.abandonedCart?.delayMinutes || 15} onChange={(v) => updateMarketing({ abandonedCart: { ...def.marketing?.abandonedCart, delayMinutes: v } as any })} min={1} />
                          </div>
                          <div>
                            <FieldLabel label="Assunto do Email" />
                            <TextInput value={def.marketing?.abandonedCart?.subject || ''} onChange={(v) => updateMarketing({ abandonedCart: { ...def.marketing?.abandonedCart, subject: v } as any })} />
                          </div>
                          <div>
                            <FieldLabel label="Conteúdo do Email" />
                            <TextArea value={def.marketing?.abandonedCart?.body || ''} onChange={(v) => updateMarketing({ abandonedCart: { ...def.marketing?.abandonedCart, body: v } as any })} rows={4} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-white">Recuperação de Pedidos (Pix/Boleto)</h3>
                      <p className="text-neutral-400 text-sm">Emails para pedidos pendentes de pagamento.</p>
                    </div>
                    <div className="bg-neutral-950/50 border border-white/5 rounded-2xl p-6 grid grid-cols-1 gap-6">
                      <Toggle 
                        checked={def.marketing?.orderRecovery?.enabled || false}
                        onChange={(v) => updateMarketing({ orderRecovery: { ...def.marketing?.orderRecovery, enabled: v } as any })}
                        label="Ativar Recuperação de Pedidos"
                      />
                      
                      {def.marketing?.orderRecovery?.enabled && (
                        <>
                          <div>
                            <FieldLabel label="Assunto do Email" />
                            <TextInput value={def.marketing?.orderRecovery?.subject || ''} onChange={(v) => updateMarketing({ orderRecovery: { ...def.marketing?.orderRecovery, subject: v } as any })} />
                          </div>
                          <div>
                            <FieldLabel label="Conteúdo do Email" />
                            <TextArea value={def.marketing?.orderRecovery?.body || ''} onChange={(v) => updateMarketing({ orderRecovery: { ...def.marketing?.orderRecovery, body: v } as any })} rows={4} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 h-fit">
          <div className="hidden xl:block">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Preview
              </h3>
              <div className="flex bg-neutral-900 rounded-lg p-1 border border-white/10">
                <button 
                  onClick={() => setPreviewDevice('mobile')}
                  className={cn(
                    "p-1.5 rounded-md transition-all",
                    previewDevice === 'mobile' ? "bg-purple-600 text-white shadow-lg" : "text-neutral-400 hover:text-white"
                  )}
                  title="Mobile"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setPreviewDevice('desktop')}
                  className={cn(
                    "p-1.5 rounded-md transition-all",
                    previewDevice === 'desktop' ? "bg-purple-600 text-white shadow-lg" : "text-neutral-400 hover:text-white"
                  )}
                  title="Desktop"
                >
                  <Monitor className="w-4 h-4" />
                </button>
              </div>
            </div>
            <FunnelPreview def={def} tab={tab} device={previewDevice} />
          </div>

          <div className="bg-neutral-900/30 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden">
            <button 
              onClick={() => setShowJsonMobile(!showJsonMobile)}
            className="w-full p-6 flex items-center justify-between font-bold text-white xl:cursor-default hover:bg-white/5 xl:hover:bg-transparent transition-colors"
          >
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-400" />
              Prévia do JSON
            </div>
            <ChevronDown className={cn("w-5 h-5 text-neutral-400 transition-transform xl:hidden", showJsonMobile ? "rotate-180" : "")} />
          </button>

          <div className={cn("px-6 pb-6 relative group", showJsonMobile ? "block" : "hidden xl:block")}>
            <pre className="text-[10px] leading-relaxed text-neutral-400 bg-neutral-950/50 border border-white/5 rounded-xl p-4 overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-neutral-800">
              {safeStringify(def)}
            </pre>
            <div className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => navigator.clipboard.writeText(safeStringify(def))}
                className="bg-white/10 hover:bg-white/20 text-white text-xs px-2 py-1 rounded backdrop-blur-md"
              >
                Copiar
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    );
  };

  return (
    <div 
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500"
    >
      {/* Sidebar List */}
      <div className="hidden lg:flex lg:col-span-3 bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex-col h-[calc(100vh-120px)] sticky top-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight">Seus Funis</h2>
          <button
            onClick={create}
            disabled={creating}
            className="p-2 bg-white text-black rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-50"
            title="Novo Funil"
          >
            {creating ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-neutral-800">
          <div className="space-y-2">
            {funnels.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveId(f.id)}
                className={cn(
                  "w-full text-left rounded-2xl p-4 border transition-all relative group overflow-hidden animate-in fade-in slide-in-from-left-4 duration-300",
                  f.id === activeId 
                    ? "bg-neutral-800/80 border-purple-500/50 shadow-lg shadow-purple-900/10" 
                    : "bg-neutral-950/30 border-white/5 hover:bg-neutral-900/50 hover:border-white/10"
                )}
              >
                {f.id === activeId && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 animate-in fade-in duration-300"
                  />
                )}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={cn("font-semibold truncate text-sm", f.id === activeId ? "text-white" : "text-neutral-300")}>{f.name}</span>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    f.status === 'active' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-neutral-700"
                  )} />
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>v{f.version}</span>
                  <span className="uppercase tracking-wider">{f.status}</span>
                </div>
              </button>
            ))}
          </div>
          {funnels.length === 0 && (
            <div className="text-center py-10 text-neutral-500 text-sm">
              Nenhum funil encontrado.
              <br />
              Crie um para começar.
            </div>
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="lg:col-span-9 bg-neutral-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-6 min-h-[calc(100vh-120px)] flex flex-col relative overflow-hidden">
        {/* Background Mesh Gradient */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Editor de Funil</h1>
            <p className="text-neutral-400 text-sm">Gerencie o conteúdo e configurações do seu funil de vendas.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-neutral-950/50 p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => {
                if (mode === 'builder' && draftDef) {
                  setDraftJson(safeStringify(draftDef));
                }
                setMode((m) => (m === 'builder' ? 'json' : 'builder'));
              }}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
            >
              {mode === 'builder' ? 'Modo JSON' : 'Modo Visual'}
            </button>
            <div className="w-px h-6 bg-white/10" />
            <button
              onClick={saveDefinition}
              disabled={!active || saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white text-black hover:bg-neutral-200 disabled:opacity-50 transition-colors shadow-lg shadow-white/5"
            >
              {saving ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar
            </button>
            <button
              onClick={activate}
              disabled={!active || saving}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                active?.status === 'active' 
                  ? "bg-green-500/10 text-green-400 border border-green-500/20 cursor-default"
                  : "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20"
              )}
            >
              {active?.status === 'active' ? <Check className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {active?.status === 'active' ? 'Ativo' : 'Ativar'}
            </button>
          </div>
        </div>

        {error && (
          <div 
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {error}
          </div>
        )}

        <div className="mb-8 p-6 bg-neutral-950/30 border border-white/5 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <FieldLabel label="Nome Interno do Funil" />
              <TextInput value={nameDraft} onChange={setNameDraft} placeholder="Ex: Funil VSL 01" className="text-lg font-semibold" />
            </div>
            <div className="flex items-end justify-end gap-3 pb-1">
               {active && (
                 <div className="flex items-center gap-4 text-xs font-mono text-neutral-500 bg-neutral-900/50 px-3 py-2 rounded-lg border border-white/5">
                   <span>ID: {active.id.slice(0, 8)}...</span>
                   <span>VER: {active.version}</span>
                   <span>UPDATED: {new Date().toLocaleDateString()}</span>
                 </div>
               )}
               <button
                 onClick={deleteFunnel}
                 disabled={!active || saving}
                 className="text-xs font-semibold text-red-400 hover:text-red-300 underline decoration-red-900/50 hover:decoration-red-400 transition-all mr-4"
               >
                 Excluir Funil
               </button>
               <button
                 onClick={() => {
                   if (!active) return;
                   const def = ensureDefinition(active.definition);
                   setDraftDef(cloneDeep(def));
                   setDraftJson(safeStringify(def));
                   setNameDraft(active.name);
                   setError(null);
                 }}
                 disabled={!active || saving}
                 className="text-xs font-semibold text-neutral-400 hover:text-white underline decoration-neutral-700 hover:decoration-white transition-all"
               >
                 Descartar alterações
               </button>
            </div>
          </div>
        </div>

        {mode === 'builder' ? (
          renderBuilder()
        ) : (
          <div 
            className="flex-1 flex flex-col animate-in fade-in duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-neutral-400">Edite a estrutura bruta do funil. Cuidado com a sintaxe.</div>
              <button
                onClick={() => {
                  try {
                    const parsed = ensureDefinition(JSON.parse(draftJson) as FunnelDefinition);
                    setDraftDef(cloneDeep(parsed));
                    setDraftJson(safeStringify(parsed));
                    setError(null);
                    setMode('builder');
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'JSON inválido');
                  }
                }}
                className="text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-4 py-2 transition-colors shadow-lg shadow-purple-900/20"
              >
                Aplicar e Voltar
              </button>
            </div>
            <textarea
              value={draftJson}
              onChange={(e) => setDraftJson(e.target.value)}
              className="flex-1 w-full bg-neutral-950 border border-white/10 rounded-2xl p-6 font-mono text-sm text-neutral-300 outline-none focus:ring-2 focus:ring-purple-500/30 resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>
        )}
      {/* Mobile Sticky Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-neutral-900/90 backdrop-blur-xl border-t border-white/10 z-50 flex items-center justify-between gap-3 safe-area-pb">
        <button
          onClick={() => {
            if (mode === 'builder' && draftDef) {
              setDraftJson(safeStringify(draftDef));
            }
            setMode((m) => (m === 'builder' ? 'json' : 'builder'));
          }}
          className="px-4 py-3 rounded-xl text-sm font-semibold bg-neutral-800 text-white flex-1 border border-white/5"
        >
          {mode === 'builder' ? 'JSON' : 'Visual'}
        </button>
        <button
          onClick={saveDefinition}
          disabled={!active || saving}
          className="px-4 py-3 rounded-xl text-sm font-bold bg-white text-black flex-[2] flex items-center justify-center gap-2 shadow-lg shadow-white/5"
        >
          {saving ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar
        </button>
        <button
          onClick={activate}
          disabled={!active || saving}
          className={cn(
            "px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center border",
            active?.status === 'active' 
              ? "bg-green-500/10 text-green-400 border-green-500/20 w-14"
              : "bg-green-600 border-green-500 text-white w-14 shadow-lg shadow-green-900/20"
          )}
        >
          {active?.status === 'active' ? <Check className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
      </div>

      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Criar Novo Funil</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/10 rounded-xl text-neutral-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <FieldLabel label="Nome do Funil" />
                <TextInput 
                  value={newFunnelName} 
                  onChange={setNewFunnelName} 
                  placeholder="Ex: Funil Principal"
                />
              </div>

              <div>
                <FieldLabel label="Modelo Inicial" />
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setNewFunnelType('default')}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all relative overflow-hidden group",
                      newFunnelType === 'default' 
                        ? "bg-purple-500/10 border-purple-500 text-white" 
                        : "bg-neutral-950/50 border-white/5 text-neutral-400 hover:border-white/20 hover:bg-neutral-900"
                    )}
                  >
                    <div className="mb-2 w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                      <Layout className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-sm mb-1">Modelo Padrão</div>
                    <div className="text-xs opacity-60 leading-relaxed">Já vem com estrutura e conteúdo de exemplo.</div>
                  </button>

                  <button
                    onClick={() => setNewFunnelType('empty')}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all relative overflow-hidden group",
                      newFunnelType === 'empty' 
                        ? "bg-purple-500/10 border-purple-500 text-white" 
                        : "bg-neutral-950/50 border-white/5 text-neutral-400 hover:border-white/20 hover:bg-neutral-900"
                    )}
                  >
                    <div className="mb-2 w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-sm mb-1">Do Zero</div>
                    <div className="text-xs opacity-60 leading-relaxed">Comece com um funil totalmente vazio.</div>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateConfirm}
                  disabled={creating || !newFunnelName.trim()}
                  className="flex-1 px-4 py-3 rounded-xl font-bold bg-white text-black hover:bg-neutral-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {creating ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                  Criar Funil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminFunnels;