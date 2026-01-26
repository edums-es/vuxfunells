import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Settings, MessageSquare, Star, ShoppingCart, Tag, Plus, Trash2, ArrowUp, ArrowDown, Check, CheckCircle, ShieldCheck, HelpCircle, Code, AlertTriangle, X, ChevronRight, ChevronDown, Save, Play, Upload, Layout, Video, Image, Link, Mail, Sun, Moon, Smartphone, Monitor, Music, ArrowLeft, Download, FileJson, MoreVertical, MessageCircle } from 'lucide-react';
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

import { FlowEditor } from '../flow-builder/FlowEditor';

function safeStringify(value: unknown) {
  return JSON.stringify(value, null, 2);
}

type EditorMode = 'builder' | 'json';
type BuilderTab = 'doctor' | 'chat' | 'calls' | 'reviews' | 'checkout' | 'offers' | 'integrations' | 'marketing' | 'audio';

function cloneDeep<T>(value: T): T {
  return structuredClone(value);
}

const noOp = () => {};

const FunnelPreview: React.FC<{ def: FunnelDefinition; tab: BuilderTab; device?: 'mobile' | 'desktop' }> = ({ def, tab, device = 'mobile' }) => {
  const [key, setKey] = useState(0);
  const [previewStep, setPreviewStep] = useState<'incoming' | 'video'>('incoming');
  const [useFlowBuilder, setUseFlowBuilder] = useState(false);

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
                   onAction={noOp}
                   onHistoryUpdate={noOp}
                   doctorName={def.doctor.name}
                   doctorAvatarUrl={def.doctor.avatarUrl}
                   startDelay={0}
                   audioConfig={def.audio}
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
}> = ({ value, onChange, placeholder, type = 'text', className }) => {
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className={cn(inputBaseClass, className)}
      />
    );
};

const TextArea: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}> = ({ value, onChange, placeholder, rows = 3, className }) => {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(inputBaseClass, "resize-none", className)}
      />
    );
};

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
    offers: { ...base.offers, ...(def.offers || {}) },
    audio: { ...base.audio, ...(def.audio || {}) }
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
  const [useFlowBuilder, setUseFlowBuilder] = useState(false);
  
  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFunnelName, setNewFunnelName] = useState('');
  const [newFunnelType, setNewFunnelType] = useState<'default' | 'empty'>('default');
  const [editingNode, setEditingNode] = useState<{ type: string; data: any; id?: string } | null>(null);
  const [isZenMode, setIsZenMode] = useState(false);
  const getFlowDefinitionRef = useRef<(() => FunnelDefinition) | null>(null);

  const active = useMemo(() => funnels.find((f) => f.id === activeId) || null, [funnels, activeId]);
  
  const updateGraphNode = (nodeId: string, dataPatch: any) => {
      setDraftDef(prev => {
          if (!prev || !prev.nodes) return prev;
          const newNodes = prev.nodes.map(n => 
              n.id === nodeId ? { ...n, data: { ...n.data, ...dataPatch } } : n
          );
          return { ...prev, nodes: newNodes };
      });
      setEditingNode((prev) => {
        if (!prev || prev.id !== nodeId) return prev;
        return { ...prev, data: { ...(prev.data || {}), ...dataPatch } };
      });
  };

  const setStartNode = (nodeId: string) => {
      setDraftDef(prev => {
          if (!prev) return prev;
          return { ...prev, startNodeId: nodeId };
      });
  };

  const isGraphNode = (id?: string) => {
      return !!(id && draftDef?.nodes && draftDef.nodes.length > 0);
  };

  const refresh = async () => {
    const res = await adminListFunnels();
    setFunnels(res.funnels);
    // Don't auto-select to show list view first
    // const current = res.funnels.find((f) => f.status === 'active') || res.funnels[0] || null;
    // setActiveId((prev) => prev || (current ? current.id : null));
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
      const flowDef = mode === 'json' ? null : getFlowDefinitionRef.current?.() || null;
      let merged: FunnelDefinition = def;
      if (flowDef && Array.isArray(flowDef.nodes) && flowDef.nodes.length > 0) {
        const draftNodesById = new Map((def.nodes || []).map((n) => [n.id, n]));
        const mergedNodes = flowDef.nodes.map((n) => {
          const fromDraft = draftNodesById.get(n.id);
          return fromDraft ? { ...n, data: fromDraft.data } : n;
        });
        merged = {
          ...def,
          nodes: mergedNodes as any,
          edges: (flowDef.edges || []) as any,
          layout: mergedNodes.reduce((acc, n) => ({ ...acc, [n.id]: n.position }), {})
        };
      }
      const res = await adminUpdateFunnel(active.id, { name: nameDraft.trim() || active.name, definition: merged });
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

  const deleteFunnel = async (id?: string) => {
    const targetId = id || active?.id;
    if (!targetId || !window.confirm('Tem certeza que deseja excluir este funil? Esta ação não pode ser desfeita.')) return;
    setSaving(true);
    setError(null);
    try {
      await adminDeleteFunnel(targetId);
      await refresh();
      if (activeId === targetId) {
          setDraftDef(null);
          setActiveId(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao excluir');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = (funnel: AdminFunnel) => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(funnel.definition, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${funnel.name.replace(/\s+/g, '_')}_v${funnel.version}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              const def = ensureDefinition(json);
              // Create new funnel with this definition
              setCreating(true);
              const res = await adminCreateFunnel(`Importado ${new Date().toLocaleDateString()}`, def);
              setFunnels((prev) => [...prev, res.funnel]);
              // Optional: Open it immediately?
              // setActiveId(res.funnel.id);
          } catch (err) {
              alert('Erro ao importar JSON: ' + (err instanceof Error ? err.message : 'Arquivo inválido'));
          } finally {
              setCreating(false);
          }
      };
      reader.readAsText(file);
      // Reset input
      e.target.value = '';
  };

  const handleActivate = async (funnelId: string) => {
      setSaving(true);
      try {
          await adminUpdateFunnel(funnelId, { status: 'active' });
          await refresh();
      } catch (err) {
          setError(err instanceof Error ? err.message : 'Erro ao ativar');
      } finally {
          setSaving(false);
      }
  };

  const renderFunnelList = () => (
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Seus Funis</h1>
                  <p className="text-neutral-400">Gerencie, edite e ative seus funis de venda.</p>
              </div>
              <div className="flex gap-3">
                  <label className="flex items-center gap-2 px-4 py-3 bg-neutral-900 border border-white/10 hover:border-white/20 hover:bg-neutral-800 rounded-xl cursor-pointer transition-all text-sm font-semibold text-white shadow-lg shadow-black/20">
                      <Upload className="w-4 h-4" />
                      Importar JSON
                      <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                  </label>
                  <button
                      onClick={create}
                      className="flex items-center gap-2 px-6 py-3 bg-white text-black hover:bg-neutral-200 rounded-xl font-bold transition-all shadow-lg shadow-white/10"
                  >
                      <Plus className="w-5 h-5" />
                      Novo Funil
                  </button>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {funnels.map((f) => (
                  <div key={f.id} className="group relative bg-neutral-900 border border-white/5 hover:border-purple-500/50 rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-900/10 flex flex-col h-auto min-h-[280px]">
                      {f.status === 'active' && (
                          <div className="absolute top-4 right-4 bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,197,94,0.15)]">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                              ATIVO
                          </div>
                      )}
                      
                      <div className="mb-auto">
                          <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors">
                              <Layout className="w-6 h-6 text-neutral-400 group-hover:text-purple-400" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2 line-clamp-1" title={f.name}>{f.name}</h3>
                          <div className="flex items-center gap-4 text-xs text-neutral-500 font-mono">
                              <span>v{f.version}</span>
                              <span>•</span>
                              <span>{new Date().toLocaleDateString()}</span>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-6 border-t border-white/5">
                          <button 
                              onClick={() => setActiveId(f.id)}
                              className="col-span-2 flex items-center justify-center gap-2 py-2.5 bg-white text-black rounded-xl font-bold hover:bg-neutral-200 transition-colors"
                          >
                              Editar Funil
                          </button>
                          
                          <button 
                              onClick={() => handleExport(f)}
                              className="flex items-center justify-center gap-2 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold border border-white/5 transition-colors"
                              title="Exportar JSON"
                          >
                              <Download className="w-4 h-4" /> Exportar
                          </button>

                           {f.status !== 'active' ? (
                              <button 
                                  onClick={() => handleActivate(f.id)}
                                  className="flex items-center justify-center gap-2 py-2 bg-neutral-800 hover:bg-green-600 hover:text-white text-neutral-400 rounded-xl text-xs font-semibold border border-white/5 transition-colors"
                                  title="Ativar este funil"
                              >
                                  <Play className="w-4 h-4" /> Ativar
                              </button>
                           ) : (
                              <button 
                                  className="flex items-center justify-center gap-2 py-2 bg-neutral-800/50 text-neutral-600 rounded-xl text-xs font-semibold border border-white/5 cursor-not-allowed"
                                  disabled
                              >
                                  <Check className="w-4 h-4" /> Ativo
                              </button>
                           )}
                           
                           <button 
                              onClick={() => deleteFunnel(f.id)}
                              className="col-span-2 flex items-center justify-center gap-2 py-2 hover:bg-red-500/10 text-neutral-500 hover:text-red-400 rounded-xl text-xs font-semibold transition-colors mt-1"
                          >
                              <Trash2 className="w-3 h-3" /> Excluir permanentemente
                          </button>
                      </div>
                  </div>
              ))}
              
              <button onClick={create} className="group bg-neutral-900/50 border border-white/5 border-dashed hover:border-white/20 rounded-3xl p-6 transition-all duration-300 flex flex-col items-center justify-center gap-4 h-[280px]">
                  <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus className="w-8 h-8 text-neutral-400" />
                  </div>
                  <span className="font-bold text-neutral-400 group-hover:text-white transition-colors">Criar Novo Funil</span>
              </button>
          </div>
      </div>
  );

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

    const updateAudio = (patch: Partial<FunnelDefinition['audio']>) => {
      setDraftDef((prev) => {
        if (!prev) return prev;
        return { ...prev, audio: { ...(prev.audio || {}), ...patch } };
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
        const nextId = (items.reduce((acc, r) => Math.max(acc, Number((r as any).id || 0)), 0) || 0) + 1;
        items.push({ id: nextId, name: '', age: 30, location: '', text: '', likes: '0', comments: [] } as any);
        return { ...prev, reviews: { ...prev.reviews, items } };
      });
    };

  const addQuickReply = (nodeId: string, value: string = '') => {
      if (!editingNode || editingNode.id !== nodeId) return;
      
      const currentReplies = editingNode.data.quickReplies || [];
      const newReplies = [...currentReplies, value];
      
      // Force update both graph and local editing state immediately
      updateGraphNode(nodeId, { quickReplies: newReplies });
      setEditingNode(prev => prev ? { ...prev, data: { ...prev.data, quickReplies: newReplies } } : null);
  };

  const updateQuickReply = (nodeId: string, index: number, value: string) => {
      if (!editingNode || editingNode.id !== nodeId) return;
      
      const currentReplies = [...(editingNode.data.quickReplies || [])];
      currentReplies[index] = value;
      updateGraphNode(nodeId, { quickReplies: currentReplies });
      // We don't need to force update editingNode here because TextInput handles its own state
      // and we want debounce for typing.
  };

  const removeQuickReply = (nodeId: string, index: number) => {
      if (!editingNode || editingNode.id !== nodeId) return;
      
      const currentReplies = [...(editingNode.data.quickReplies || [])];
      currentReplies.splice(index, 1);
      
      // Force update both graph and local editing state immediately
      updateGraphNode(nodeId, { quickReplies: currentReplies });
      setEditingNode(prev => prev ? { ...prev, data: { ...prev.data, quickReplies: currentReplies } } : null);
  };

  const handleFileUpload = async (file: File, type: 'image' | 'audio' | 'video', nodeId: string) => {
      const fakeUrl = URL.createObjectURL(file);
      
      // Immediate feedback
      const patch = type === 'image' ? { url: fakeUrl, mediaUrl: fakeUrl }
                  : type === 'audio' ? { audioUrl: fakeUrl, url: fakeUrl }
                  : { videoUrl: fakeUrl, url: fakeUrl };
                  
      updateGraphNode(nodeId, patch);
      // Update local state to show preview immediately in modal
      setEditingNode(prev => prev ? { ...prev, data: { ...prev.data, ...patch } } : null);
      
      // Simulate network delay (optional, can be removed for instant feel)
      // await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleRemoveMedia = (nodeId: string) => {
      const patch = { url: '', mediaUrl: '', audioUrl: '', videoUrl: '', content: '' };
      updateGraphNode(nodeId, patch);
      setEditingNode(prev => prev ? { ...prev, data: { ...prev.data, ...patch } } : null);
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

    // --- Form Renders ---
    
    const renderDoctorForm = () => {
        const isGraph = editingNode?.id && isGraphNode(editingNode.id);
        const data = isGraph ? editingNode!.data : def.doctor;
        const update = isGraph 
            ? (patch: any) => updateGraphNode(editingNode!.id!, patch)
            : updateDoctor;

        return (
        <div className="space-y-6">
            {isGraph && <div className="text-xs text-purple-400 mb-2 font-mono">MODO GRAFO: NÓ {editingNode?.id}</div>}
            <div>
                <FieldLabel label="Nome" />
                <TextInput value={data.name} onChange={(v) => update({ name: v })} placeholder="Dra. Ana" />
            </div>
            <div>
                <FieldLabel label="Cargo" />
                <TextInput value={data.role} onChange={(v) => update({ role: v })} placeholder="Fertilidade" />
            </div>
            <div>
                <FieldLabel label="Avatar URL" />
                <div className="flex gap-2">
                    <TextInput value={data.avatarUrl} onChange={(v) => update({ avatarUrl: v })} type="url" className="flex-1" />
                    <label className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/10 shrink-0">
                    <Upload className="w-4 h-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                            const res = await adminUploadFile(file);
                            update({ avatarUrl: res.url });
                        } catch (err) { alert('Erro ao enviar arquivo'); }
                    }} />
                    </label>
                </div>
            </div>
            <div>
                <FieldLabel label="Wallpaper URL" />
                <div className="flex gap-2">
                    <TextInput value={data.wallpaperUrl} onChange={(v) => update({ wallpaperUrl: v })} type="url" className="flex-1" />
                    <label className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/10 shrink-0">
                    <Upload className="w-4 h-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                            const res = await adminUploadFile(file);
                            update({ wallpaperUrl: res.url });
                        } catch (err) { alert('Erro ao enviar arquivo'); }
                    }} />
                    </label>
                </div>
            </div>
            <div>
                <FieldLabel label="Tema" />
                <div className="flex gap-2">
                    <button onClick={() => updateTheme('light')} className={cn("flex-1 p-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2", (data.theme || 'light') === 'light' ? "bg-white text-black border-white" : "bg-neutral-900 text-neutral-400 border-white/10")}>
                        <Sun className="w-4 h-4" /> Claro
                    </button>
                    <button onClick={() => updateTheme('dark')} className={cn("flex-1 p-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2", data.theme === 'dark' ? "bg-neutral-800 text-white border-white/20" : "bg-neutral-900 text-neutral-400 border-white/10")}>
                        <Moon className="w-4 h-4" /> Escuro
                    </button>
                </div>
            </div>
        </div>
    )};

    const renderAudioForm = () => {
        const isGraph = editingNode?.id && isGraphNode(editingNode.id);
        const data = isGraph ? editingNode!.data : def.audio || {};
        const update = (patch: any) => {
            if (isGraph) {
                updateGraphNode(editingNode!.id!, patch);
            }
            updateAudio(patch);
        };

        return (
        <div className="space-y-6">
            {isGraph && <div className="text-xs text-purple-400 mb-2 font-mono">MODO GRAFO: NÓ {editingNode?.id}</div>}
            <div>
                <FieldLabel label="Música de Fundo URL" />
                <div className="flex gap-2">
                    <TextInput value={data.backgroundMusicUrl || ''} onChange={(v) => update({ backgroundMusicUrl: v })} className="flex-1" />
                    <label className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/10 shrink-0">
                    <Upload className="w-4 h-4" />
                    <input type="file" className="hidden" accept="audio/*" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                            const res = await adminUploadFile(file);
                            update({ backgroundMusicUrl: res.url });
                        } catch (err) { alert('Erro ao enviar arquivo'); }
                    }} />
                    </label>
                </div>
            </div>
            <div>
                <FieldLabel label="Volume (0.0 - 1.0)" />
                <NumberInput value={data.backgroundMusicVolume ?? 0.1} onChange={(v) => update({ backgroundMusicVolume: v })} min={0} step={0.1} />
            </div>
            <Toggle checked={data.loop ?? true} onChange={(v) => update({ loop: v })} label="Loop da música" />
            <Toggle checked={data.messageSoundEnabled ?? true} onChange={(v) => update({ messageSoundEnabled: v })} label="Sons de Mensagem" />
        </div>
    )};



    const renderChatMessageForm = (data: any) => {
        const isGraph = editingNode?.id && isGraphNode(editingNode.id);

        if (isGraph) {
            const m = editingNode!.data;
            const update = (patch: any) => updateGraphNode(editingNode!.id!, patch);
            const quickReplies = m.quickReplies || [];

            return (
                <div className="space-y-6">
                    <div className="text-xs text-purple-400 mb-2 font-mono">MODO GRAFO: NÓ {editingNode?.id}</div>
                    <div>
                        <FieldLabel label="Remetente" />
                        <Select value={m.sender} onChange={(v) => update({ sender: v })} options={[{ value: 'doctor', label: 'Doutora' }, { value: 'user', label: 'Usuária' }]} />
                    </div>
                    <div>
                        <FieldLabel label="Tipo" />
                        <Select value={m.type} onChange={(v) => update({ type: v })} options={[{ value: 'text', label: 'Texto' }, { value: 'audio', label: 'Áudio' }, { value: 'image', label: 'Imagem' }, { value: 'video', label: 'Vídeo' }]} />
                    </div>
                    <div>
                        <FieldLabel label="Delay (ms)" />
                        <NumberInput value={m.delay} onChange={(v) => update({ delay: v })} step={100} />
                    </div>
                    <div>
                        <FieldLabel label="Conteúdo / URL" />
                        <TextArea
                          value={m.type === 'text' ? (m.content || '') : (m.mediaUrl || m.url || m.content || '')}
                          onChange={(v) => {
                            if (m.type === 'text') {
                              update({ content: v });
                            } else {
                              update({ mediaUrl: v, url: v });
                            }
                          }}
                          rows={4}
                        />
                        {m.type !== 'text' && (m.mediaUrl || m.url) ? (
                          <div className="mt-2 rounded-xl overflow-hidden border border-white/10 bg-black/40">
                            {m.type === 'image' ? (
                              <img src={m.mediaUrl || m.url} alt="preview" className="w-full h-48 object-cover" />
                            ) : m.type === 'audio' ? (
                              <div className="p-3">
                                <audio controls src={m.mediaUrl || m.url} className="w-full" />
                              </div>
                            ) : null}
                            <div className="p-2 border-t border-white/10 flex justify-end">
                              <button
                                onClick={() => update({ mediaUrl: '', url: '', content: '' })}
                                className="px-3 py-2 rounded-lg text-xs font-bold bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/20"
                              >
                                Remover mídia
                              </button>
                            </div>
                          </div>
                        ) : null}
                        {m.type !== 'text' && (
                            <div className="flex flex-col gap-2">
                                {m.type === 'video' || m.type === 'video-call' ? (
                                    <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-xs text-center">
                                        Para vídeos, utilize apenas URLs externas (YouTube, Vimeo, Panda, etc).
                                    </div>
                                ) : (
                                    <label className="mt-2 flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/10 w-full justify-center">
                                        <Upload className="w-4 h-4" />
                                        Upload Mídia (Máx 50MB)
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept={m.type === 'audio' ? 'audio/*' : 'image/*'}
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                // VALIDATION: Check file size (limit to 50MB)
                                                const MAX_SIZE_MB = 50;
                                                if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                                                    alert(`Arquivo muito grande! O limite é de ${MAX_SIZE_MB}MB.`);
                                                    e.target.value = ''; // Reset input
                                                    return;
                                                }

                                                try {
                                                    console.log('[Graph] Uploading file...', file.name);
                                                    const res = await adminUploadFile(file);
                                                    console.log('[Graph] Upload complete:', res.url);
                                                    update({ mediaUrl: res.url, url: res.url });
                                                } catch (err) { 
                                                    console.error('[Graph] Upload failed:', err);
                                                    alert('Erro ao enviar arquivo: ' + (err as Error).message); 
                                                } finally {
                                                    e.target.value = '';
                                                }
                                            }} 
                                        />
                                    </label>
                                )}
                            </div>
                        )}
                    </div>
                    {m.sender === 'doctor' && m.type !== 'video' && (
                        <div className="bg-neutral-950/30 p-4 rounded-xl border border-white/5">
                            <div className="flex justify-between mb-2">
                                <FieldLabel label="Botões (Quick Replies)" />
                                <button onClick={() => update({ quickReplies: [...quickReplies, { label: 'Opção', value: 'Opção' }] })}><Plus className="w-3 h-3" /></button>
                            </div>
                            <div className="space-y-2">
                                {quickReplies.map((qr: any, i: number) => (
                                    <div key={i} className="flex gap-2">
                                        <TextInput value={qr.label} onChange={(v) => {
                                            const newQr = [...quickReplies];
                                            newQr[i] = { ...newQr[i], label: v, value: v };
                                            update({ quickReplies: newQr });
                                        }} />
                                        <button onClick={() => {
                                            const newQr = [...quickReplies];
                                            newQr.splice(i, 1);
                                            update({ quickReplies: newQr });
                                        }}><X className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 space-y-3">
                                <Toggle 
                                  label="Aguardar resposta do usuário antes de continuar" 
                                  checked={!!m.requiresInput} 
                                  onChange={(v) => update({ requiresInput: v })} 
                                />
                                <Toggle 
                                  label="Roteamento condicional pelos botões (usa o valor do botão)" 
                                  checked={!!m.enableQuickReplyRouting} 
                                  onChange={(v) => update({ enableQuickReplyRouting: v })} 
                                />
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        const { part, index } = data;
        const m = def.chat[part][index];
        if (!m) return <div>Mensagem não encontrada</div>;

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-mono bg-neutral-800 px-2 py-1 rounded text-neutral-400">#{index + 1}</span>
                    <div className="flex gap-2">
                        <button onClick={() => moveChatMessage(part, index, index - 1)} className="p-2 hover:bg-white/10 rounded"><ArrowUp className="w-4 h-4" /></button>
                        <button onClick={() => moveChatMessage(part, index, index + 1)} className="p-2 hover:bg-white/10 rounded"><ArrowDown className="w-4 h-4" /></button>
                        <button onClick={() => { removeChatMessage(part, index); setEditingNode(null); }} className="p-2 hover:bg-red-500/20 text-red-400 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                </div>
                <div>
                    <FieldLabel label="Remetente" />
                    <Select value={m.sender} onChange={(v) => updateChatMessage(part, index, { sender: v as any })} options={[{ value: 'doctor', label: 'Doutora' }, { value: 'user', label: 'Usuária' }]} />
                </div>
                <div>
                    <FieldLabel label="Tipo" />
                    <Select value={m.type} onChange={(v) => updateChatMessage(part, index, { type: v as any })} options={[{ value: 'text', label: 'Texto' }, { value: 'audio', label: 'Áudio' }, { value: 'image', label: 'Imagem' }, { value: 'video', label: 'Vídeo' }]} />
                </div>
                <div>
                    <FieldLabel label="Delay (ms)" />
                    <NumberInput value={m.delay} onChange={(v) => updateChatMessage(part, index, { delay: v })} step={100} />
                </div>
                <div>
                    <FieldLabel label="Conteúdo / URL" />
                    <TextArea value={m.content} onChange={(v) => updateChatMessage(part, index, { content: v })} rows={4} />
                    {m.type !== 'text' && (
                         <label className="mt-2 flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/10 w-full justify-center">
                            <Upload className="w-4 h-4" />
                            Upload Mídia
                            <input 
                                type="file" 
                                className="hidden" 
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    try {
                                        console.log('[Admin] Uploading file...', file.name);
                                        const res = await adminUploadFile(file);
                                        console.log('[Admin] Upload complete:', res.url);
                                        updateChatMessage(part, index, { mediaUrl: res.url });
                                    } catch (err) { 
                                        console.error('[Admin] Upload failed:', err);
                                        alert('Erro ao enviar arquivo: ' + (err as Error).message); 
                                    } finally {
                                        // Reset input so same file can be selected again if needed
                                        e.target.value = '';
                                    }
                                }} 
                            />
                        </label>
                    )}
                </div>
                 {m.sender === 'doctor' && (
                    <div className="bg-neutral-950/30 p-4 rounded-xl border border-white/5">
                        <div className="flex justify-between mb-2">
                            <FieldLabel label="Botões (Quick Replies)" />
                            <button onClick={() => updateChatMessage(part, index, { quickReplies: [...(m.quickReplies||[]), { label: 'Opção', value: 'Opção' }] })}><Plus className="w-3 h-3" /></button>
                        </div>
                        <div className="space-y-2">
                            {(m.quickReplies || []).map((qr, i) => (
                                <div key={i} className="flex gap-2">
                                    <TextInput value={qr.label} onChange={(v) => {
                                        const newQr = [...(m.quickReplies || [])];
                                        newQr[i] = { ...newQr[i], label: v, value: v };
                                        updateChatMessage(part, index, { quickReplies: newQr });
                                    }} />
                                    <button onClick={() => {
                                        const newQr = [...(m.quickReplies || [])];
                                        newQr.splice(i, 1);
                                        updateChatMessage(part, index, { quickReplies: newQr });
                                    }}><X className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 space-y-3">
                            <Toggle 
                              label="Aguardar resposta do usuário antes de continuar" 
                              checked={!!m.requiresInput} 
                              onChange={(v) => updateChatMessage(part, index, { requiresInput: v })} 
                            />
                            <Toggle 
                              label="Roteamento condicional pelos botões (usa o valor do botão)" 
                              checked={!!m.enableQuickReplyRouting} 
                              onChange={(v) => updateChatMessage(part, index, { enableQuickReplyRouting: v })} 
                            />
                        </div>
                    </div>
                )}
                <div className="pt-4 border-t border-white/5">
                    <button onClick={() => addChatMessage(part)} className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-bold text-white transition-colors border border-white/10 flex items-center justify-center gap-2">
                        <Plus className="w-3 h-3" /> Nova Mensagem no Final
                    </button>
                </div>
            </div>
        );
    };

    const renderReviewsForm = () => {
        const isGraph = editingNode?.id && isGraphNode(editingNode.id);
        const data = isGraph ? editingNode!.data : def.reviews;
        const items = data.items || [];

        const handleAdd = () => {
            if (isGraph) {
                const newId = (items.reduce((acc: number, r: any) => Math.max(acc, Number(r.id || 0)), 0) || 0) + 1;
                const newItem = { id: newId, name: '', age: 30, location: '', text: '', likes: '0', comments: [] };
                updateGraphNode(editingNode!.id!, { items: [...items, newItem] });
            } else {
                addReviewItem();
            }
        };

        const handleUpdate = (idx: number, patch: any) => {
            if (isGraph) {
                const newItems = [...items];
                newItems[idx] = { ...newItems[idx], ...patch };
                updateGraphNode(editingNode!.id!, { items: newItems });
            } else {
                updateReviewItem(idx, patch);
            }
        };

        const handleRemove = (idx: number) => {
            if (isGraph) {
                const newItems = [...items];
                newItems.splice(idx, 1);
                updateGraphNode(editingNode!.id!, { items: newItems });
            } else {
                removeReviewItem(idx);
            }
        };

        const handleMove = (from: number, to: number) => {
            if (isGraph) {
                const newItems = moveItem(items, from, to);
                updateGraphNode(editingNode!.id!, { items: newItems });
            } else {
                moveReviewItem(from, to);
            }
        };

        return (
        <div className="space-y-6">
            {isGraph && <div className="text-xs text-purple-400 mb-2 font-mono">MODO GRAFO: NÓ {editingNode?.id}</div>}
            <div className="flex items-center justify-between">
                <h4 className="font-bold text-white">Avaliações ({items.length})</h4>
                <button onClick={handleAdd} className="p-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-xs font-bold flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Nova
                </button>
            </div>
            <div className="space-y-4">
                {items.map((item: any, idx: number) => (
                    <div key={idx} className="bg-neutral-950/30 p-4 rounded-xl border border-white/5 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-mono text-neutral-500">#{idx + 1}</span>
                            <div className="flex gap-2">
                                <button onClick={() => handleMove(idx, idx - 1)} className="p-1 hover:bg-white/10 rounded"><ArrowUp className="w-3 h-3" /></button>
                                <button onClick={() => handleMove(idx, idx + 1)} className="p-1 hover:bg-white/10 rounded"><ArrowDown className="w-3 h-3" /></button>
                                <button onClick={() => handleRemove(idx)} className="p-1 hover:bg-red-500/20 text-red-400 rounded"><Trash2 className="w-3 h-3" /></button>
                            </div>
                        </div>
                        <TextInput placeholder="Nome" value={item.name} onChange={(v) => handleUpdate(idx, { name: v })} />
                        <TextArea placeholder="Texto da avaliação" value={item.text} onChange={(v) => handleUpdate(idx, { text: v })} />
                        <div className="flex gap-2">
                            <TextInput placeholder="Likes" value={item.likes} onChange={(v) => handleUpdate(idx, { likes: v })} className="w-1/3" />
                            <TextInput placeholder="Cidade/Estado" value={item.location || ''} onChange={(v) => handleUpdate(idx, { location: v })} className="flex-1" />
                        </div>
                         <div>
                            <FieldLabel label="Avatar URL" />
                             <div className="flex gap-2">
                                <TextInput value={item.avatarUrl || ''} onChange={(v) => handleUpdate(idx, { avatarUrl: v })} className="flex-1" />
                                <label className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/10 shrink-0">
                                <Upload className="w-4 h-4" />
                                <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    try {
                                        const res = await adminUploadFile(file);
                                        handleUpdate(idx, { avatarUrl: res.url });
                                    } catch (err) { alert('Erro ao enviar arquivo'); }
                                }} />
                                </label>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )};

    const renderOffersForm = () => {
        const isGraph = editingNode?.id && isGraphNode(editingNode.id);
        const data = isGraph ? editingNode!.data : def.offers;
        const upsells = data.upsells || [];
        const downsells = data.downsells || [];

        const handleAdd = (kind: 'upsells' | 'downsells') => {
             if (isGraph) {
                const list = (kind === 'upsells' ? upsells : downsells).slice();
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
                updateGraphNode(editingNode!.id!, { [kind]: list });
            } else {
                addOffer(kind);
            }
        };

        const handleUpdate = (kind: 'upsells' | 'downsells', idx: number, patch: any) => {
            if (isGraph) {
                const list = (kind === 'upsells' ? upsells : downsells).slice();
                list[idx] = { ...list[idx], ...patch };
                updateGraphNode(editingNode!.id!, { [kind]: list });
            } else {
                updateOffer(kind, idx, patch);
            }
        };

        const handleRemove = (kind: 'upsells' | 'downsells', idx: number) => {
             if (isGraph) {
                const list = (kind === 'upsells' ? upsells : downsells).slice();
                list.splice(idx, 1);
                updateGraphNode(editingNode!.id!, { [kind]: list });
            } else {
                removeOffer(kind, idx);
            }
        };

        const handleMove = (kind: 'upsells' | 'downsells', from: number, to: number) => {
             if (isGraph) {
                const list = (kind === 'upsells' ? upsells : downsells).slice();
                const moved = moveItem(list, from, to);
                updateGraphNode(editingNode!.id!, { [kind]: moved });
            } else {
                moveOffer(kind, from, to);
            }
        };

        return (
        <div className="space-y-6">
            {isGraph && <div className="text-xs text-purple-400 mb-2 font-mono">MODO GRAFO: NÓ {editingNode?.id}</div>}
            <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4 text-purple-400" />
                    Upsells ({upsells.length})
                </h4>
                <div className="space-y-3">
                    {upsells.map((offer: any, idx: number) => (
                        <div key={offer.id || idx} className="bg-neutral-950/50 p-3 rounded-lg border border-white/5">
                            <div className="flex justify-between mb-2">
                                <span className="font-bold text-sm text-white">{offer.title || 'Oferta sem título'}</span>
                                <div className="flex gap-1">
                                    <button onClick={() => handleMove('upsells', idx, idx - 1)} className="p-1 hover:bg-white/10 rounded"><ArrowUp className="w-3 h-3" /></button>
                                    <button onClick={() => handleMove('upsells', idx, idx + 1)} className="p-1 hover:bg-white/10 rounded"><ArrowDown className="w-3 h-3" /></button>
                                    <button onClick={() => handleRemove('upsells', idx)} className="p-1 hover:bg-red-500/20 text-red-400 rounded"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            </div>
                            <TextInput placeholder="Título" value={offer.title} onChange={(v) => handleUpdate('upsells', idx, { title: v })} className="mb-2" />
                            <TextInput placeholder="Preço" value={offer.price} onChange={(v) => handleUpdate('upsells', idx, { price: v })} />
                        </div>
                    ))}
                    <button onClick={() => handleAdd('upsells')} className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-bold text-white transition-colors border border-white/10">
                        + Adicionar Upsell
                    </button>
                </div>
            </div>

             <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                    <ArrowDown className="w-4 h-4 text-blue-400" />
                    Downsells ({downsells.length})
                </h4>
                <div className="space-y-3">
                    {downsells.map((offer: any, idx: number) => (
                        <div key={offer.id || idx} className="bg-neutral-950/50 p-3 rounded-lg border border-white/5">
                            <div className="flex justify-between mb-2">
                                <span className="font-bold text-sm text-white">{offer.title || 'Oferta sem título'}</span>
                                <div className="flex gap-1">
                                    <button onClick={() => handleMove('downsells', idx, idx - 1)} className="p-1 hover:bg-white/10 rounded"><ArrowUp className="w-3 h-3" /></button>
                                    <button onClick={() => handleMove('downsells', idx, idx + 1)} className="p-1 hover:bg-white/10 rounded"><ArrowDown className="w-3 h-3" /></button>
                                    <button onClick={() => handleRemove('downsells', idx)} className="p-1 hover:bg-red-500/20 text-red-400 rounded"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            </div>
                            <TextInput placeholder="Título" value={offer.title} onChange={(v) => handleUpdate('downsells', idx, { title: v })} className="mb-2" />
                            <TextInput placeholder="Preço" value={offer.price} onChange={(v) => handleUpdate('downsells', idx, { price: v })} />
                        </div>
                    ))}
                    <button onClick={() => handleAdd('downsells')} className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-bold text-white transition-colors border border-white/10">
                        + Adicionar Downsell
                    </button>
                </div>
            </div>
        </div>
    )};

    const renderCheckoutForm = () => {
        const isGraph = editingNode?.id && isGraphNode(editingNode.id);
        const data = isGraph ? editingNode!.data : def.checkout;
        const update = isGraph 
            ? (patch: any) => updateGraphNode(editingNode!.id!, patch)
            : updateCheckout;

        return (
        <div className="space-y-6">
            {isGraph && <div className="text-xs text-purple-400 mb-2 font-mono">MODO GRAFO: NÓ {editingNode?.id}</div>}
            <div className="bg-neutral-950/30 p-4 rounded-xl border border-white/5">
                <h4 className="font-bold text-white mb-2">Produto</h4>
                <div className="space-y-4">
                    <TextInput placeholder="Nome do Produto" value={data.productName} onChange={(v) => update({ productName: v })} />
                    <TextInput placeholder="Preço (Display)" value={data.price} onChange={(v) => update({ price: v })} />
                    <NumberInput placeholder="Valor (Centavos)" value={data.valueCents} onChange={(v) => update({ valueCents: v })} />
                </div>
            </div>
            {/* Simplified Checkout Editor for MVP - user can click 'Enable Pagebuilder' in the old UI, but here we just show basic fields or a button to open advanced mode if needed */}
            <div className="p-4 bg-yellow-500/10 rounded-xl text-yellow-200 text-xs">
                Para editar os blocos do checkout (Pagebuilder), utilize a visualização detalhada ou implemente os nós de blocos no futuro.
            </div>
        </div>
    )};

    const renderDelayForm = () => {
        if (!editingNode?.id) return null;
        const data = editingNode.data;
        const update = (patch: any) => updateGraphNode(editingNode.id!, patch);

        return (
            <div className="space-y-6">
                <div className="text-xs text-purple-400 mb-2 font-mono">MODO GRAFO: NÓ {editingNode.id}</div>
                <div>
                    <FieldLabel label="Duração (ms)" />
                    <NumberInput value={data.duration || 1000} onChange={(v) => update({ duration: v })} step={500} min={0} />
                    <p className="text-xs text-neutral-500 mt-1">1000ms = 1 segundo</p>
                </div>
            </div>
        );
    };

    const renderConditionForm = () => {
        if (!editingNode?.id) return null;
        const data = editingNode.data;
        const update = (patch: any) => updateGraphNode(editingNode.id!, patch);

        return (
            <div className="space-y-6">
                <div className="text-xs text-purple-400 mb-2 font-mono">MODO GRAFO: NÓ {editingNode.id}</div>
                <div className="p-4 bg-blue-500/10 rounded-xl text-blue-200 text-sm">
                    Este nó avaliará uma condição. Use as saídas (edges) para definir o caminho "Verdadeiro" e "Falso".
                </div>
                <div>
                    <FieldLabel label="Variável" />
                    <TextInput placeholder="ex: user_age" value={data.variable || ''} onChange={(v) => update({ variable: v })} />
                </div>
                <div>
                    <FieldLabel label="Operador" />
                    <Select 
                        value={data.operator || 'equals'} 
                        onChange={(v) => update({ operator: v })} 
                        options={[
                            { value: 'equals', label: 'Igual (==)' },
                            { value: 'not_equals', label: 'Diferente (!=)' },
                            { value: 'greater_than', label: 'Maior que (>)' },
                            { value: 'less_than', label: 'Menor que (<)' },
                            { value: 'contains', label: 'Contém' },
                            { value: 'exists', label: 'Existe (não vazio)' }
                        ]} 
                    />
                </div>
                {data.operator !== 'exists' && (
                    <div>
                        <FieldLabel label="Valor de Comparação" />
                        <TextInput placeholder="Valor" value={data.value || ''} onChange={(v) => update({ value: v })} />
                    </div>
                )}
            </div>
        );
    };

    const renderUserInputForm = () => {
        if (!editingNode?.id) return null;
        const data = editingNode.data;
        const update = (patch: any) => updateGraphNode(editingNode.id!, patch);

        return (
            <div className="space-y-6">
                <div className="text-xs text-purple-400 mb-2 font-mono">MODO GRAFO: NÓ {editingNode.id}</div>
                <div>
                    <FieldLabel label="Nome da Variável (para salvar)" />
                    <TextInput placeholder="ex: user_name" value={data.variable || ''} onChange={(v) => update({ variable: v })} />
                </div>
                <div>
                    <FieldLabel label="Tipo de Entrada" />
                    <Select 
                        value={data.inputType || 'text'} 
                        onChange={(v) => update({ inputType: v })} 
                        options={[
                            { value: 'text', label: 'Texto Livre' },
                            { value: 'email', label: 'E-mail' },
                            { value: 'phone', label: 'Telefone' },
                            { value: 'number', label: 'Número' },
                            { value: 'date', label: 'Data' }
                        ]} 
                    />
                </div>
                <div>
                    <FieldLabel label="Placeholder" />
                    <TextInput placeholder="Digite aqui..." value={data.placeholder || ''} onChange={(v) => update({ placeholder: v })} />
                </div>
                <Toggle label="Obrigatório" checked={data.required !== false} onChange={(v) => update({ required: v })} />
            </div>
        );
    };

    const renderApiActionForm = () => {
        if (!editingNode?.id) return null;
        const data = editingNode.data;
        const update = (patch: any) => updateGraphNode(editingNode.id!, patch);

        return (
            <div className="space-y-6">
                <div className="text-xs text-purple-400 mb-2 font-mono">MODO GRAFO: NÓ {editingNode.id}</div>
                <div>
                    <FieldLabel label="URL do Endpoint" />
                    <TextInput placeholder="https://api.exemplo.com/v1/webhook" value={data.url || ''} onChange={(v) => update({ url: v })} />
                </div>
                <div>
                    <FieldLabel label="Método" />
                    <Select 
                        value={data.method || 'POST'} 
                        onChange={(v) => update({ method: v })} 
                        options={[
                            { value: 'GET', label: 'GET' },
                            { value: 'POST', label: 'POST' },
                            { value: 'PUT', label: 'PUT' },
                            { value: 'DELETE', label: 'DELETE' }
                        ]} 
                    />
                </div>
                <div>
                    <FieldLabel label="Headers (JSON)" />
                    <TextArea 
                        placeholder='{"Authorization": "Bearer token"}' 
                        value={typeof data.headers === 'string' ? data.headers : JSON.stringify(data.headers || {}, null, 2)} 
                        onChange={(v) => {
                            try {
                                const parsed = JSON.parse(v);
                                update({ headers: parsed });
                            } catch (e) {
                                // Allow typing invalid JSON temporarily or handle string storage
                                update({ headers: v }); // Store as string if user prefers, or handle validation
                            }
                        }} 
                        rows={3} 
                    />
                </div>
                <div>
                    <FieldLabel label="Corpo / Body (JSON)" />
                    <TextArea 
                        placeholder='{"foo": "bar"}' 
                        value={typeof data.body === 'string' ? data.body : JSON.stringify(data.body || {}, null, 2)} 
                        onChange={(v) => {
                             try {
                                const parsed = JSON.parse(v);
                                update({ body: parsed });
                            } catch (e) {
                                update({ body: v });
                            }
                        }} 
                        rows={4} 
                    />
                </div>
                <div>
                    <FieldLabel label="Salvar Resposta em Variável" />
                    <TextInput placeholder="ex: api_response" value={data.resultVariable || ''} onChange={(v) => update({ resultVariable: v })} />
                </div>
            </div>
        );
    };

    const renderRedirectForm = () => {
        if (!editingNode?.id) return null;
        const data = editingNode.data;
        const update = (patch: any) => updateGraphNode(editingNode.id!, patch);

        return (
            <div className="space-y-6">
                <div className="text-xs text-purple-400 mb-2 font-mono">MODO GRAFO: NÓ {editingNode.id}</div>
                <div>
                    <FieldLabel label="URL de Redirecionamento" />
                    <TextInput placeholder="https://..." value={data.url || ''} onChange={(v) => update({ url: v })} />
                </div>
                <Toggle label="Abrir em nova aba" checked={data.newTab || false} onChange={(v) => update({ newTab: v })} />
            </div>
        );
    };

    const renderIncomingCallForm = () => {
        if (!editingNode?.id) return null;
        const data = editingNode.data;
        const update = (patch: any) => updateGraphNode(editingNode.id!, patch);

        return (
            <div className="space-y-6">
                <div className="text-xs text-purple-400 mb-2 font-mono">MODO GRAFO: NÓ {editingNode.id}</div>
                <div>
                    <FieldLabel label="Duração do Toque (ms)" />
                    <NumberInput value={data.duration || 15000} onChange={(v) => update({ duration: v })} step={1000} />
                </div>
                <div>
                    <FieldLabel label="Ringtone URL" />
                    <div className="flex gap-2">
                        <TextInput value={data.ringtoneUrl || ''} onChange={(v) => update({ ringtoneUrl: v })} className="flex-1" />
                        <label className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/10 shrink-0">
                            <Upload className="w-4 h-4" />
                            <input type="file" className="hidden" accept="audio/*" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                    const res = await adminUploadFile(file);
                                    update({ ringtoneUrl: res.url });
                                } catch (err) { alert('Erro ao enviar arquivo'); }
                            }} />
                        </label>
                    </div>
                </div>
                 <div>
                    <FieldLabel label="Voz da Doutora (opcional)" />
                    <div className="flex gap-2">
                        <TextInput value={data.voiceUrl || ''} onChange={(v) => update({ voiceUrl: v })} className="flex-1" />
                        <label className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/10 shrink-0">
                            <Upload className="w-4 h-4" />
                            <input type="file" className="hidden" accept="audio/*" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                    const res = await adminUploadFile(file);
                                    update({ voiceUrl: res.url });
                                } catch (err) { alert('Erro ao enviar arquivo'); }
                            }} />
                        </label>
                    </div>
                </div>
                <Toggle label="Iniciar Vídeo Automaticamente ao Atender" checked={data.autoStartVideo !== false} onChange={(v) => update({ autoStartVideo: v })} />
            </div>
        );
    };

    const renderVideoCallForm = () => {
        if (!editingNode?.id) return null;
        const data = editingNode.data;
        const update = (patch: any) => updateGraphNode(editingNode.id!, patch);

        return (
             <div className="space-y-6">
                <div className="text-xs text-purple-400 mb-2 font-mono">MODO GRAFO: NÓ {editingNode.id}</div>
                <div>
                    <FieldLabel label="Duração (ms)" />
                    <NumberInput value={data.duration || 60000} onChange={(v) => update({ duration: v })} step={1000} />
                </div>
                 <div>
                    <FieldLabel label="Vídeo URL" />
                    <div className="flex gap-2">
                        <TextInput value={data.videoUrl || ''} onChange={(v) => update({ videoUrl: v })} className="flex-1" />
                        {/* 
                        <label className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/10 shrink-0">
                            <Upload className="w-4 h-4" />
                            <input type="file" className="hidden" accept="video/*" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                    const res = await adminUploadFile(file);
                                    update({ videoUrl: res.url });
                                } catch (err) { alert('Erro ao enviar arquivo'); }
                            }} />
                        </label> 
                        */}
                    </div>
                    <div className="mt-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-xs text-center">
                        Para vídeos, utilize apenas URLs externas (YouTube, Vimeo, Panda, etc).
                    </div>
                </div>
                 <div>
                    <FieldLabel label="Áudio URL (opcional)" />
                    <div className="flex gap-2">
                        <TextInput value={data.audioUrl || ''} onChange={(v) => update({ audioUrl: v })} className="flex-1" />
                        <label className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl cursor-pointer transition-colors text-xs font-semibold border border-white/10 shrink-0">
                            <Upload className="w-4 h-4" />
                            <input type="file" className="hidden" accept="audio/*" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                // VALIDATION: Check file size (limit to 50MB)
                                const MAX_SIZE_MB = 50;
                                if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                                    alert(`Arquivo muito grande! O limite é de ${MAX_SIZE_MB}MB.`);
                                    e.target.value = ''; // Reset input
                                    return;
                                }
                                try {
                                    const res = await adminUploadFile(file);
                                    update({ audioUrl: res.url });
                                } catch (err) { alert('Erro ao enviar arquivo'); }
                            }} />
                        </label>
                    </div>
                </div>
            </div>
        );
    };

    const renderUpsellForm = () => {
        if (!editingNode?.id) return null;
        const data = editingNode.data;
        const update = (patch: any) => updateGraphNode(editingNode.id!, patch);

        return (
            <div className="space-y-6">
                <div className="text-xs text-purple-400 mb-2 font-mono">MODO GRAFO: NÓ {editingNode.id}</div>
                <div className="bg-neutral-950/30 p-4 rounded-xl border border-white/5 space-y-4">
                    <TextInput placeholder="Título" value={data.title} onChange={(v) => update({ title: v })} />
                    <TextInput placeholder="Subtítulo" value={data.subtitle} onChange={(v) => update({ subtitle: v })} />
                    <div className="flex gap-2">
                        <TextInput placeholder="Preço (Display)" value={data.price} onChange={(v) => update({ price: v })} className="flex-1" />
                        <NumberInput placeholder="Centavos" value={data.valueCents} onChange={(v) => update({ valueCents: v })} className="w-1/3" />
                    </div>
                     <TextInput placeholder="Texto Botão Aceitar" value={data.acceptText || 'Sim, eu quero'} onChange={(v) => update({ acceptText: v })} />
                     <TextInput placeholder="Texto Botão Recusar" value={data.declineText || 'Não, obrigado'} onChange={(v) => update({ declineText: v })} />
                </div>
            </div>
        );
    };

    const renderWhatsappForm = () => {
        if (!editingNode?.id) return null;
        const data = editingNode.data;
        const update = (patch: any) => updateGraphNode(editingNode.id!, patch);

        return (
            <div className="space-y-6">
                <div className="text-xs text-purple-400 mb-2 font-mono">MODO GRAFO: NÓ {editingNode.id}</div>
                <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/20 space-y-4">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                        <MessageCircle className="w-5 h-5" />
                        <span className="font-bold text-sm">Configuração WhatsApp</span>
                    </div>
                    
                    <div>
                        <FieldLabel label="Mensagem Inicial (Template ou Texto)" />
                        <textarea
                            value={data.message || ''}
                            onChange={(e) => update({ message: e.target.value })}
                            className="w-full h-32 bg-neutral-900 border border-white/10 rounded-xl p-3 text-sm text-neutral-200 outline-none focus:ring-2 focus:ring-green-500/30 resize-none"
                            placeholder="Olá, vi seu interesse no produto..."
                        />
                    </div>

                    <div>
                        <FieldLabel label="Número de Destino (Opcional - Redirecionamento)" />
                        <TextInput 
                            value={data.phone || ''} 
                            onChange={(v) => update({ phone: v })} 
                            placeholder="5511999999999" 
                        />
                        <p className="text-xs text-neutral-500 mt-1">
                            Se preenchido, o usuário será redirecionado para este número. Se vazio, será enviado um disparo automático via API (se configurada).
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    const handleAddNode = (type: string, payload: any, position?: { x: number, y: number }) => {
        if (!draftDef) return;

        const newNodeId = nanoid();
        const defaultPosition = position || { x: 0, y: 0 };

        setDraftDef((prev) => {
            if (!prev) return prev;

            // Prepare default data based on type
            let data = { ...payload, label: payload.label || type };
            
            if (['chat-message', 'message', 'text'].includes(type)) {
                data = { sender: 'doctor', type: 'text', content: '', delay: 1000, ...data };
            } else if (type === 'image' || type === 'video' || type === 'audio') {
                data = { sender: 'doctor', type: type, content: '', delay: 1000, ...data };
            } else if (type === 'config-audio') {
                data = { backgroundMusicUrl: '', backgroundMusicVolume: 0.1, messageSoundEnabled: true, loop: true, ...data };
            } else if (type === 'delay') {
                data = { duration: 1000, ...data };
            } else if (type === 'condition') {
                 data = { operator: 'equals', ...data };
            } else if (type === 'user_input') {
                 data = { inputType: 'text', required: true, ...data };
            } else if (type === 'api_action') {
                 data = { method: 'POST', ...data };
            } else if (type === 'reviews') {
                 data = { items: [], ...data };
            } else if (type === 'checkout') {
                 data = { productName: 'Produto', price: 'R$ 0,00', ...data };
            } else if (type === 'offers') {
                 data = { upsells: [], downsells: [], ...data };
            }

            // 1. Add to generic nodes (Graph Mode)
            const newNode = {
                id: newNodeId,
                type: type,
                data: data,
                position: defaultPosition
            };

            const currentNodes = prev.nodes || [];
            const newNodes = [...currentNodes, newNode];

            // 2. Legacy Compatibility (Chat Messages)
            // We append to part2 to ensure it exists in the legacy linear flow for now.
            // Future: The execution engine should read from 'nodes' and 'edges'.
            let newChat = { ...prev.chat };
            const isChatType = ['chat-message', 'message', 'text', 'audio', 'image', 'video'].includes(type);
            
            if (isChatType) { 
                const part = 'part2';
                const list = [...newChat[part]];
                
                // Determine message type
                let msgType = payload.messageType || 'text';
                if (['audio', 'image', 'video'].includes(type)) {
                    msgType = type;
                }

                list.push({
                    id: newNodeId, // Use stable ID
                    sender: payload.sender || 'doctor',
                    delay: payload.delay || 1000,
                    type: msgType, 
                    content: payload.content || ''
                });
                newChat[part] = list;
            }

            return {
                ...prev,
                nodes: newNodes,
                chat: newChat,
                layout: {
                    ...(prev.layout || {}),
                    [newNodeId]: defaultPosition
                }
            };
        });

        // Set as editing (Wait for state update)
        setTimeout(() => {
             // Fetch the freshly created node data to ensure we edit the real object
             setEditingNode({ 
                 type, 
                 data: { ...payload, label: payload.label || type }, // Ensure initial data is consistent
                 id: newNodeId 
             });
        }, 50);
    };

    return (
      <div className={cn(
          "flex gap-6 overflow-hidden transition-all",
          isZenMode ? "flex-1 h-full" : "h-[calc(100vh-140px)]"
      )}>
        {/* Main Canvas */}
        <div className={cn(
            "flex-1 bg-neutral-900 overflow-hidden border border-white/5 relative shadow-2xl transition-all",
            isZenMode ? "rounded-none border-0" : "rounded-3xl"
        )}>
           <FlowEditor 
             funnelDefinition={def} 
             onSave={(newDef) => setDraftDef(newDef)}
             onNodeClick={(type, data, id) => setEditingNode({ type, data, id })}
             onAddNode={handleAddNode}
             onRegisterGetDefinition={(getDef) => {
               getFlowDefinitionRef.current = getDef;
             }}
           />
        </div>

        {/* Edit Panel (Sidebar) */}
        <div className={cn(
            "bg-neutral-900 border border-white/5 flex flex-col transition-all duration-300 shadow-2xl",
            isZenMode ? "rounded-l-3xl h-full border-y-0 border-r-0 my-0" : "rounded-3xl",
            editingNode ? "w-[400px] opacity-100 translate-x-0" : "w-0 opacity-0 translate-x-10 overflow-hidden"
        )}>
            {editingNode && (
                <>
                    <div className="p-5 border-b border-white/5 flex items-center justify-between bg-neutral-950/50">
                        <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4 text-purple-400" />
                            <h3 className="font-bold text-white uppercase tracking-wider text-sm">
                                {editingNode.type === 'doctor' && 'Doutora'}
                                {editingNode.type === 'config-audio' && 'Áudio'}
                                {editingNode.type === 'incoming-call' && 'Chamada'}
                                {editingNode.type === 'video-call' && 'Vídeo VSL'}
                                {['chat-message', 'message', 'text', 'image', 'video'].includes(editingNode.type) && 'Mensagem'}
                                {editingNode.type === 'checkout' && 'Checkout'}
                                {editingNode.type === 'reviews' && 'Reviews'}
                                {editingNode.type === 'offers' && 'Upsell / Downsell'}
                                {editingNode.type === 'delay' && 'Delay / Espera'}
                                {editingNode.type === 'condition' && 'Condição'}
                                {editingNode.type === 'user_input' && 'Entrada de Dados'}
                                {editingNode.type === 'api_action' && 'Ação de API'}
                                {editingNode.type === 'redirect' && 'Redirecionamento'}
                                {editingNode.type === 'end' && 'Fim'}
                            </h3>
                             {isGraphNode(editingNode.id) && (
                                <button
                                    onClick={() => setStartNode(editingNode.id!)}
                                    disabled={editingNode.id === def.startNodeId}
                                    className={cn(
                                        "ml-2 px-2 py-1 rounded text-[10px] font-bold transition-colors uppercase tracking-wider border",
                                        editingNode.id === def.startNodeId
                                            ? "bg-green-500/10 text-green-400 border-green-500/20 cursor-default"
                                            : "bg-neutral-800 text-neutral-400 border-white/10 hover:text-white hover:bg-neutral-700 hover:border-white/20"
                                    )}
                                    title={editingNode.id === def.startNodeId ? "Este é o nó inicial" : "Definir como nó inicial"}
                                >
                                    {editingNode.id === def.startNodeId ? "Início" : "Definir Início"}
                                </button>
                            )}
                        </div>
                        <button onClick={() => setEditingNode(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                            <X className="w-5 h-5 text-neutral-400" />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                        {editingNode.type === 'doctor' && renderDoctorForm()}
                        {editingNode.type === 'config-audio' && renderAudioForm()}
                        {editingNode.type === 'incoming-call' && renderIncomingCallForm()}
                        {editingNode.type === 'video-call' && renderVideoCallForm()}
                        {['chat-message', 'message', 'text', 'image', 'video', 'audio'].includes(editingNode.type) && renderChatMessageForm(editingNode.data)}
                        {editingNode.type === 'checkout' && renderCheckoutForm()}
                        {editingNode.type === 'reviews' && renderReviewsForm()}
                        {editingNode.type === 'offers' && renderOffersForm()}
                        {editingNode.type === 'upsell' && renderUpsellForm()}
                        {editingNode.type === 'delay' && renderDelayForm()}
                        {editingNode.type === 'condition' && renderConditionForm()}
                        {editingNode.type === 'user_input' && renderUserInputForm()}
                        {editingNode.type === 'api_action' && renderApiActionForm()}
                        {editingNode.type === 'redirect' && renderRedirectForm()}
                        {editingNode.type === 'whatsapp' && renderWhatsappForm()}
                        {editingNode.type === 'end' && <div className="text-neutral-400 text-sm">Este nó finaliza o fluxo. Nenhuma configuração necessária.</div>}
                    </div>
                </>
            )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={cn(
        "animate-in fade-in duration-500",
        isZenMode ? "fixed inset-0 z-50 bg-neutral-950 flex flex-col" : "p-6 w-full mx-auto"
      )}
    >
      {!activeId ? (
          renderFunnelList()
      ) : (
          <div className={cn("flex flex-col", isZenMode ? "h-full" : "gap-6")}>
               {!isZenMode && (
                   <button onClick={() => setActiveId(null)} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors self-start px-4 py-2 hover:bg-white/5 rounded-xl">
                       <ArrowLeft className="w-5 h-5" />
                       Voltar para Lista de Funis
                   </button>
               )}

              <div className={cn(
                  "bg-neutral-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col relative overflow-hidden transition-all duration-300",
                  isZenMode ? "flex-1 rounded-none border-0 p-0" : "min-h-[calc(100vh-120px)]"
              )}>
                {/* Background Mesh Gradient */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

                <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 z-10", isZenMode && "p-4 bg-neutral-900 border-b border-white/5 mb-0")}>
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-1">
                        {active?.name}
                        {isZenMode && <span className="ml-2 text-xs font-normal text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full">Zen Mode</span>}
                    </h1>
                    {!isZenMode && <p className="text-neutral-400 text-sm">Gerencie o conteúdo e configurações do seu funil de vendas.</p>}
                  </div>
                  
                  <div className="flex items-center gap-3 bg-neutral-950/50 p-1.5 rounded-2xl border border-white/5">
                    <button
                        onClick={() => setIsZenMode(!isZenMode)}
                        className={cn(
                            "px-3 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2",
                            isZenMode ? "bg-purple-500/20 text-purple-300" : "bg-neutral-800 hover:bg-neutral-700 text-white"
                        )}
                        title="Alternar Modo Tela Cheia"
                    >
                        <Layout className="w-4 h-4" />
                        {isZenMode ? 'Sair do Zen' : 'Tela Cheia'}
                    </button>

                    <div className="w-px h-6 bg-white/10" />

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
                      {/* 
                      {active && (
                        <div className="flex items-center gap-4 text-xs font-mono text-neutral-500 bg-neutral-900/50 px-3 py-2 rounded-lg border border-white/5">
                          <span>ID: {active.id.slice(0, 8)}...</span>
                          <span>VER: {active.version}</span>
                          <span>UPDATED: {new Date().toLocaleDateString()}</span>
                        </div>
                      )}
                      */}
                      <button
                        onClick={() => deleteFunnel()}
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
          </div>
      )}

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
