import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, TrendingUp, Users, MessageSquare, Loader2 } from 'lucide-react';
import { adminOverviewMetrics, adminListFunnels, OverviewMetrics, AdminFunnel } from '../../lib/api';

const AdminPlan: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [funnelCount, setFunnelCount] = useState(0);

  useEffect(() => {
    Promise.all([
        adminOverviewMetrics(),
        adminListFunnels()
    ]).then(([metricsData, funnelsData]) => {
        setMetrics(metricsData);
        setFunnelCount(funnelsData.funnels.length);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-neutral-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Carregando...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-blue-500" />
            Meu Plano
          </h1>
          <p className="text-neutral-400 mt-1">Gerencie sua assinatura e limites.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Card do Plano */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-purple-600/20 transition-all duration-500"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-2">Plano Atual</div>
                <h2 className="text-4xl font-extrabold text-white mb-2">VITALÍCIO <span className="text-lg font-normal text-neutral-500 ml-2">(Admin)</span></h2>
                <p className="text-neutral-400">Acesso total e ilimitado a todas as funcionalidades.</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-white">Ativo</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureItem text="Funis Ilimitados" />
              <FeatureItem text="Leads Ilimitados" />
              <FeatureItem text="Disparos de WhatsApp Ilimitados" />
              <FeatureItem text="Uploads de Mídia (50MB/arq)" />
              <FeatureItem text="Integrações Premium" />
              <FeatureItem text="Suporte Prioritário" />
            </div>
          </div>

          {/* Histórico de Faturas (Mock) */}
          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">Histórico de Pagamento</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-neutral-500 text-sm">
                    <th className="pb-3 font-medium">Data</th>
                    <th className="pb-3 font-medium">Descrição</th>
                    <th className="pb-3 font-medium">Valor</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-white/5 last:border-0">
                    <td className="py-4 text-white">23/01/2026</td>
                    <td className="py-4 text-neutral-300">Licença Vitalícia - Admin</td>
                    <td className="py-4 text-white">R$ 0,00</td>
                    <td className="py-4"><span className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs border border-green-500/20">Pago</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Estatísticas de Uso */}
        <div className="space-y-6">
          <UsageCard 
            title="Leads Capturados" 
            count={metrics?.totalLeads !== undefined ? metrics.totalLeads.toString() : '0'} 
            total="Ilimitado" 
            percent={5} 
            icon={Users}
            color="text-blue-500"
          />
          <UsageCard 
            title="Funis Ativos" 
            count={funnelCount.toString()} 
            total="Ilimitado" 
            percent={10} 
            icon={TrendingUp}
            color="text-purple-500"
          />
          <UsageCard 
            title="Msg. WhatsApp" 
            count="0" 
            total="Ilimitado" 
            percent={0} 
            icon={MessageSquare}
            color="text-green-500"
          />
        </div>
      </div>
    </div>
  );
};

const FeatureItem: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex items-center gap-3 text-neutral-300">
    <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0" />
    <span>{text}</span>
  </div>
);

const UsageCard: React.FC<{ title: string; count: string; total: string; percent: number; icon: any; color: string }> = ({ title, count, total, percent, icon: Icon, color }) => (
  <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
    <div className="flex items-start justify-between mb-4">
      <div>
        <div className="text-neutral-400 text-sm mb-1">{title}</div>
        <div className="text-2xl font-bold text-white">{count} <span className="text-sm font-normal text-neutral-500">/ {total}</span></div>
      </div>
      <div className={`p-3 bg-white/5 rounded-xl ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
      <div className={`h-full rounded-full bg-current ${color}`} style={{ width: `${percent}%` }}></div>
    </div>
  </div>
);

export default AdminPlan;
