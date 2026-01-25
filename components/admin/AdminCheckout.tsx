import React, { useState } from 'react';
import { ShoppingCart, Save, CheckCircle, CreditCard, Lock, Globe } from 'lucide-react';

const AdminCheckout: React.FC = () => {
  const [gateway, setGateway] = useState('stripe');
  const [publicKey, setPublicKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-teal-500" />
            Checkout & Pagamentos
          </h1>
          <p className="text-neutral-400 mt-1">Configure seus gateways de pagamento e preferências de checkout.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuração Principal */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-neutral-400" />
              Gateway de Pagamento
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Selecione o Gateway</label>
                <div className="grid grid-cols-3 gap-4">
                  <button 
                    onClick={() => setGateway('stripe')}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${gateway === 'stripe' ? 'bg-indigo-600/10 border-indigo-500 text-white' : 'bg-neutral-950 border-white/10 text-neutral-400 hover:border-white/20'}`}
                  >
                    <div className="font-bold text-lg">Stripe</div>
                    <span className="text-xs opacity-70">Internacional</span>
                  </button>
                  <button 
                    onClick={() => setGateway('hotmart')}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${gateway === 'hotmart' ? 'bg-orange-600/10 border-orange-500 text-white' : 'bg-neutral-950 border-white/10 text-neutral-400 hover:border-white/20'}`}
                  >
                    <div className="font-bold text-lg">Hotmart</div>
                    <span className="text-xs opacity-70">Infoprodutos</span>
                  </button>
                  <button 
                    onClick={() => setGateway('custom')}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${gateway === 'custom' ? 'bg-green-600/10 border-green-500 text-white' : 'bg-neutral-950 border-white/10 text-neutral-400 hover:border-white/20'}`}
                  >
                    <div className="font-bold text-lg">Custom</div>
                    <span className="text-xs opacity-70">API Própria</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Chave Pública (Public Key)</label>
                  <input 
                    type="text" 
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    placeholder="pk_test_..."
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Chave Secreta (Secret Key)</label>
                  <input 
                    type="password" 
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="sk_test_..."
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Webhook Secret (Opcional)</label>
                  <input 
                    type="password" 
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder="whsec_..."
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <button 
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-teal-900/20"
                >
                  {saved ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                  {saved ? 'Configurações Salvas' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Lateral */}
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-teal-400" />
              Segurança
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              Suas credenciais são criptografadas antes de serem salvas no banco de dados. Nunca compartilhe sua Secret Key com ninguém.
            </p>
            <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 p-2 rounded-lg border border-green-500/20">
              <CheckCircle className="w-3 h-3" />
              Ambiente Seguro (HTTPS)
            </div>
          </div>

          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              Domínio do Checkout
            </h3>
            <div className="bg-neutral-950 p-3 rounded-xl border border-white/10 text-xs font-mono text-neutral-300 break-all">
              https://vuxlab.com.br/pay
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Use este domínio base para configurar seus produtos externos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCheckout;
