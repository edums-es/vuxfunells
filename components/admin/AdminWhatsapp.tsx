import React, { useState, useEffect } from 'react';
import { MessageCircle, Save, QrCode, RefreshCw, CheckCircle, ShieldCheck, Server, Loader2 } from 'lucide-react';
import { adminGetSettings, adminUpdateSettings } from '../../lib/api';

type Tab = 'waba' | 'evolution';

const AdminWhatsapp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('waba');
  const [wabaConfig, setWabaConfig] = useState({ token: '', phoneId: '', wabaId: '' });
  const [evoConfig, setEvoConfig] = useState({ url: '', apiKey: '', instanceName: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminGetSettings()
      .then(({ settings }) => {
        if (settings.whatsapp) {
          setActiveTab(settings.whatsapp.activeTab || 'waba');
          setWabaConfig(settings.whatsapp.waba || { token: '', phoneId: '', wabaId: '' });
          setEvoConfig(settings.whatsapp.evolution || { url: '', apiKey: '', instanceName: '' });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminUpdateSettings({
        whatsapp: {
            activeTab,
            waba: wabaConfig,
            evolution: evoConfig
        }
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-neutral-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Carregando...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-green-500" />
            Conexão WhatsApp
          </h1>
          <p className="text-neutral-400 mt-1">Configure a integração para disparos e funis de WhatsApp.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuração Principal */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-neutral-900 border border-white/5 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('waba')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'waba' ? 'bg-green-600 text-white shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              WABA (Oficial)
            </button>
            <button
              onClick={() => setActiveTab('evolution')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'evolution' ? 'bg-blue-600 text-white shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              EvolutionAPI (QR Code)
            </button>
          </div>

          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
            {activeTab === 'waba' ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="flex items-center gap-2 mb-4 text-green-400 bg-green-500/10 p-3 rounded-xl border border-green-500/20">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-sm font-medium">Recomendado para alta escala e segurança (sem bloqueios).</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Token de Acesso (Permanente)</label>
                  <input 
                    type="password" 
                    value={wabaConfig.token}
                    onChange={(e) => setWabaConfig({...wabaConfig, token: e.target.value})}
                    placeholder="EAAG..."
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Phone Number ID</label>
                    <input 
                      type="text" 
                      value={wabaConfig.phoneId}
                      onChange={(e) => setWabaConfig({...wabaConfig, phoneId: e.target.value})}
                      placeholder="1234567890..."
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">WABA Account ID</label>
                    <input 
                      type="text" 
                      value={wabaConfig.wabaId}
                      onChange={(e) => setWabaConfig({...wabaConfig, wabaId: e.target.value})}
                      placeholder="1234567890..."
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="flex items-center gap-2 mb-4 text-blue-400 bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                  <Server className="w-5 h-5" />
                  <span className="text-sm font-medium">Conexão via QR Code (estilo WhatsApp Web).</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">URL da API</label>
                  <input 
                    type="text" 
                    value={evoConfig.url}
                    onChange={(e) => setEvoConfig({...evoConfig, url: e.target.value})}
                    placeholder="https://api.seuserver.com"
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">API Key Global</label>
                  <input 
                    type="password" 
                    value={evoConfig.apiKey}
                    onChange={(e) => setEvoConfig({...evoConfig, apiKey: e.target.value})}
                    placeholder="Sua chave secreta..."
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Nome da Instância</label>
                  <input 
                    type="text" 
                    value={evoConfig.instanceName}
                    onChange={(e) => setEvoConfig({...evoConfig, instanceName: e.target.value})}
                    placeholder="MinhaInstancia01"
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            )}

            <div className="pt-6 mt-6 border-t border-white/5">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors text-white ${activeTab === 'waba' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`}
                >
                  {saved ? <CheckCircle className="w-5 h-5" /> : saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {saved ? 'Salvo com Sucesso' : saving ? 'Salvando...' : 'Salvar Conexão'}
                </button>
            </div>
          </div>
        </div>

        {/* Status Lateral */}
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 text-center">
            <h3 className="font-semibold text-white mb-4">Status da Conexão</h3>
            
            {activeTab === 'evolution' ? (
               <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl mb-4">
                  <QrCode className="w-32 h-32 text-neutral-900" />
                  <p className="text-xs text-neutral-500 mt-2">Escaneie para conectar</p>
               </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-6 bg-neutral-950 rounded-xl mb-4 border border-white/5">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 mb-3">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-medium text-white">API Conectada</p>
               </div>
            )}

            <button className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              <RefreshCw className="w-4 h-4" />
              Testar Conexão
            </button>
          </div>

          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
             <h3 className="font-semibold text-white mb-2">Automação X1</h3>
             <p className="text-sm text-neutral-400">
               Ao conectar o WhatsApp, você poderá usar os nós de <strong>WhatsApp</strong> no FlowBuilder para enviar mensagens automáticas ou redirecionar leads para conversas 1:1.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminWhatsapp;
