import React, { useState, useEffect } from 'react';
import { Mail, Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { adminGetSettings, adminUpdateSettings } from '../../lib/api';

const AdminEmailMarketing: React.FC = () => {
  const [provider, setProvider] = useState('resend');
  const [apiKey, setApiKey] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminGetSettings()
      .then(({ settings }) => {
        if (settings.emailMarketing) {
          setProvider(settings.emailMarketing.provider || 'resend');
          setApiKey(settings.emailMarketing.apiKey || '');
          setFromEmail(settings.emailMarketing.fromEmail || '');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminUpdateSettings({
        emailMarketing: { provider, apiKey, fromEmail }
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
            <Mail className="w-8 h-8 text-purple-500" />
            Email Marketing
          </h1>
          <p className="text-neutral-400 mt-1">Configure seus provedores de disparo de e-mail.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuração do Provedor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Configuração de Envio</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Provedor de E-mail</label>
                <select 
                  value={provider} 
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="resend">Resend (Recomendado)</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="smtp">SMTP Personalizado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">API Key / Senha SMTP</label>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="re_123456789..."
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">E-mail de Remetente (From)</label>
                <input 
                  type="email" 
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="contato@suaempresa.com"
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {saved ? <CheckCircle className="w-5 h-5" /> : saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {saved ? 'Salvo com Sucesso' : saving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status / Info */}
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-400" />
              Como funciona?
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              Ao configurar seu provedor de e-mail aqui, você habilita o nó de <strong>Email Marketing</strong> no construtor de funis.
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Você poderá enviar e-mails transacionais, ofertas e recuperação de carrinho diretamente pelo fluxo do chat.
            </p>
          </div>

          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">Estatísticas de Envio</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-neutral-400 text-sm">Enviados (Mês)</span>
                <span className="text-white font-mono">0</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-neutral-400 text-sm">Entregues</span>
                <span className="text-green-400 font-mono">0%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 text-sm">Erros</span>
                <span className="text-red-400 font-mono">0%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEmailMarketing;
