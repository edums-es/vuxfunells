import React, { useEffect, useMemo, useState } from 'react';
import { adminLeadDetail, adminListLeads } from '../../lib/api';
import type { AdminEvent, AdminLead } from '../../lib/api';
import { Search, X, ChevronRight, Mail, Phone, Calendar, DollarSign, ShoppingBag, User } from 'lucide-react';
import { cn } from '../../lib/utils';

function formatMoneyCents(valueCents: number) {
  const n = Number(valueCents || 0);
  if (!Number.isFinite(n)) return 'R$ 0,00';
  return (n / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDt(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR');
}

function shortPayload(payload: unknown) {
  if (!payload) return '';
  if (typeof payload === 'string') return payload.slice(0, 160);
  if (typeof payload === 'number' || typeof payload === 'boolean') return String(payload);
  if (Array.isArray(payload)) return `array(${payload.length})`;
  if (typeof payload === 'object') {
    const keys = Object.keys(payload as Record<string, unknown>);
    return keys.slice(0, 5).join(', ');
  }
  return '';
}

const AdminLeads: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<AdminLead | null>(null);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const refresh = async (q?: string) => {
    const res = await adminListLeads(q);
    setLeads(res.leads);
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
        setError(e instanceof Error ? e.message : 'Falha ao carregar leads');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectLead = async (lead: AdminLead) => {
    setSelectedLead(lead);
    setDrawerOpen(true);
    try {
      const res = await adminLeadDetail(lead.id);
      setEvents(res.events);
    } catch (e) {
      setEvents([]);
      setError(e instanceof Error ? e.message : 'Falha ao carregar eventos');
    }
  };

  const summary = useMemo(() => {
    const converted = leads.filter((l) => Boolean(l.convertedAt)).length;
    const totalValueCents = leads.reduce((acc, l) => acc + Number(l.totalValueCents || 0), 0);
    const purchases = leads.reduce((acc, l) => acc + Number(l.purchasesCount || 0), 0);
    return { total: leads.length, converted, totalValueCents, purchases };
  }, [leads]);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
    </div>
  );

  return (
    <div className="relative">
      <div className="bg-neutral-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">Leads</h2>
            <div className="text-neutral-400 text-sm mt-1 flex gap-3">
              <span className="bg-white/5 px-2 py-0.5 rounded text-xs">{summary.total} Total</span>
              <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded text-xs">{summary.converted} Convertidos</span>
              <span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded text-xs">{formatMoneyCents(summary.totalValueCents)} LTV</span>
            </div>
          </div>
          <div className="relative group w-full md:w-auto">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-neutral-500 group-focus-within:text-purple-500 transition-colors" />
            </div>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value.length > 2 || e.target.value.length === 0) refresh(e.target.value);
              }}
              placeholder="Buscar por nome, e-mail..."
              className="w-full md:w-80 bg-neutral-950/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all text-sm placeholder:text-neutral-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-xs text-neutral-500 uppercase tracking-wider">
                <th className="p-4 font-medium">Lead</th>
                <th className="p-4 font-medium">Contato</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Valor</th>
                <th className="p-4 font-medium">Cadastro</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">Nenhum lead encontrado</td>
                </tr>
              ) : (
                leads.map((lead, i) => (
                  <tr
                    key={lead.id}
                    onClick={() => selectLead(lead)}
                    className="group hover:bg-white/5 cursor-pointer transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300"
                    style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center text-xs font-bold border border-white/5">
                          {lead.name ? lead.name.charAt(0).toUpperCase() : <User className="w-4 h-4 text-neutral-500" />}
                        </div>
                        <div className="font-medium text-white">{lead.name || 'Sem nome'}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 text-sm text-neutral-400">
                        {lead.email && <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {lead.email}</div>}
                        {lead.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {lead.phone}</div>}
                      </div>
                    </td>
                    <td className="p-4">
                      {lead.convertedAt ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                          <ShoppingBag className="w-3 h-3" /> Cliente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-neutral-800 text-neutral-400 text-xs font-medium border border-white/5">
                          Lead
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-medium text-white">
                      {lead.totalValueCents ? formatMoneyCents(lead.totalValueCents) : '—'}
                    </td>
                    <td className="p-4 text-sm text-neutral-500">
                      {formatDt(lead.createdAt)}
                    </td>
                    <td className="p-4 text-right">
                      <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors ml-auto" />
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && selectedLead && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-300"
          />
          <div
            className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-neutral-900 border-l border-white/10 z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
          >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-neutral-900/50 backdrop-blur-md sticky top-0">
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedLead.name || 'Lead Detalhes'}</h3>
                  <p className="text-sm text-neutral-400">ID: {selectedLead.id}</p>
                </div>
                <button onClick={() => setDrawerOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="text-neutral-400 text-xs mb-1">Total Gasto</div>
                    <div className="text-xl font-bold text-green-400">{formatMoneyCents(selectedLead.totalValueCents || 0)}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="text-neutral-400 text-xs mb-1">Pedidos</div>
                    <div className="text-xl font-bold text-white">{selectedLead.purchasesCount || 0}</div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Contato</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-950 border border-white/5">
                      <Mail className="w-5 h-5 text-neutral-500" />
                      <span className="text-neutral-200">{selectedLead.email || '—'}</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-950 border border-white/5">
                      <Phone className="w-5 h-5 text-neutral-500" />
                      <span className="text-neutral-200">{selectedLead.phone || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider mb-4">Timeline de Eventos</h4>
                  <div className="relative border-l-2 border-white/5 ml-3 space-y-8 pl-8 pb-8">
                    {events.map((ev, idx) => (
                      <div key={idx} className="relative">
                        <div className={cn(
                          "absolute -left-[39px] w-5 h-5 rounded-full border-4 border-neutral-900",
                          ev.eventType === 'purchase' ? "bg-green-500" :
                          ev.eventType === 'checkout_started' ? "bg-yellow-500" :
                          ev.eventType === 'funnel_start' ? "bg-blue-500" : "bg-neutral-600"
                        )} />
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-neutral-500 font-mono">{formatDt(ev.createdAt)}</span>
                          <span className="font-medium text-white">
                            {ev.eventType === 'purchase' ? 'Realizou uma compra' :
                             ev.eventType === 'checkout_started' ? 'Iniciou checkout' :
                             ev.eventType === 'funnel_start' ? 'Iniciou funil' :
                             ev.eventType}
                          </span>
                          {ev.details && Object.keys(ev.details as object).length > 0 && (
                             <pre className="mt-2 text-xs bg-black/30 p-2 rounded border border-white/5 overflow-x-auto text-neutral-400">
                               {JSON.stringify(ev.details, null, 2)}
                             </pre>
                          )}
                        </div>
                      </div>
                    ))}
                    {events.length === 0 && <div className="text-neutral-500 italic">Nenhum evento registrado.</div>}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
    </div>
  );
};

export default AdminLeads;
