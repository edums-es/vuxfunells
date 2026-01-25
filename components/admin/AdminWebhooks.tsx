import React, { useState, useEffect } from 'react';
import { Webhook, Plus, Trash2, Globe, Zap, Loader2 } from 'lucide-react';
import { adminListWebhooks, adminAddWebhook, adminDeleteWebhook, AdminWebhook } from '../../lib/api';

const AdminWebhooks: React.FC = () => {
  const [webhooks, setWebhooks] = useState<AdminWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState('');
  const [newEvent, setNewEvent] = useState('lead_created');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = () => {
    setLoading(true);
    adminListWebhooks()
      .then(res => setWebhooks(res.webhooks))
      .finally(() => setLoading(false));
  };

  const addWebhook = async () => {
    if (!newUrl) return;
    setProcessing(true);
    try {
        const res = await adminAddWebhook({ url: newUrl, event: newEvent, active: true });
        setWebhooks([...webhooks, res.webhook]);
        setNewUrl('');
    } catch (err) {
        alert('Erro ao adicionar webhook');
    } finally {
        setProcessing(false);
    }
  };

  const removeWebhook = async (id: number) => {
    if (!confirm('Tem certeza?')) return;
    try {
        await adminDeleteWebhook(id);
        setWebhooks(webhooks.filter(w => w.id !== id));
    } catch (err) {
        alert('Erro ao remover webhook');
    }
  };

  if (loading && webhooks.length === 0) return <div className="p-8 text-center text-neutral-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Carregando...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Webhook className="w-8 h-8 text-lime-500" />
            Webhooks & API
          </h1>
          <p className="text-neutral-400 mt-1">Conecte seu funil a sistemas externos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Adicionar Novo */}
          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Adicionar Webhook Global</h2>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input 
                  type="text" 
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://sua-api.com/webhook"
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500/50"
                />
              </div>
              <div className="w-full md:w-48">
                <select 
                  value={newEvent}
                  onChange={(e) => setNewEvent(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500/50"
                >
                  <option value="lead_created">Lead Criado</option>
                  <option value="checkout_started">Checkout Iniciado</option>
                  <option value="checkout_success">Venda Aprovada</option>
                  <option value="funnel_complete">Funil Completo</option>
                </select>
              </div>
              <button 
                onClick={addWebhook}
                disabled={processing}
                className="bg-lime-600 hover:bg-lime-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Adicionar
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="space-y-4">
            {webhooks.map((hook) => (
              <div key={hook.id} className="bg-neutral-900 border border-white/5 rounded-2xl p-5 flex items-center justify-between group hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hook.active ? 'bg-lime-500/20 text-lime-500' : 'bg-neutral-800 text-neutral-500'}`}>
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-mono text-sm text-neutral-300 break-all">{hook.url}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-neutral-800 px-2 py-0.5 rounded text-neutral-400 border border-white/5">{hook.event}</span>
                      <span className={`text-xs px-2 py-0.5 rounded border ${hook.active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {hook.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => removeWebhook(hook.id)}
                  className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            
            {webhooks.length === 0 && (
              <div className="text-center py-10 text-neutral-500">
                Nenhum webhook configurado.
              </div>
            )}
          </div>
        </div>

        {/* Info Lateral */}
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Eventos Disponíveis
            </h3>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li className="flex justify-between">
                <span>lead_created</span>
                <span className="text-neutral-600">Novo contato</span>
              </li>
              <li className="flex justify-between">
                <span>checkout_started</span>
                <span className="text-neutral-600">Abriu checkout</span>
              </li>
              <li className="flex justify-between">
                <span>checkout_success</span>
                <span className="text-neutral-600">Comprou</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-white/10 rounded-2xl p-6">
             <h3 className="font-semibold text-white mb-2">Dica Pro</h3>
             <p className="text-sm text-neutral-300 mb-4">
               Você também pode usar o nó <strong>API</strong> dentro do FlowBuilder para fazer requisições específicas em pontos estratégicos do funil.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminWebhooks;
