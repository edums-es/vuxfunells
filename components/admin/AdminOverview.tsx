import React, { useEffect, useMemo, useState } from 'react';
import { adminOverviewMetrics } from '../../lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Users, TrendingUp, DollarSign, ShoppingCart, Percent, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../lib/utils';

function formatMoneyCents(valueCents: number) {
  const n = Number(valueCents || 0);
  if (!Number.isFinite(n)) return 'R$ 0,00';
  return (n / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPct(value: number) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return '0%';
  return `${Math.round(n * 100)}%`;
}

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    className={cn("bg-neutral-900/50 border border-white/5 backdrop-blur-sm rounded-2xl p-6 relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4 duration-700", className)}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="relative z-10">{children}</div>
  </div>
);

const MetricCard = ({ 
  label, 
  value, 
  subValue, 
  icon: Icon, 
  trend,
  trendValue,
  color = "blue"
}: { 
  label: string; 
  value: string | number; 
  subValue?: string; 
  icon: any; 
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: 'blue' | 'purple' | 'green' | 'pink' 
}) => {
  const colors = {
    blue: "from-blue-500 to-cyan-500",
    purple: "from-purple-500 to-pink-500",
    green: "from-emerald-500 to-teal-500",
    pink: "from-pink-500 to-rose-500"
  };

  return (
    <Card>
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-xl bg-gradient-to-br opacity-80", colors[color])}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && trendValue && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
            trend === 'up' ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
          )}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className="text-neutral-400 text-sm font-medium mb-1">{label}</div>
      <div className="text-3xl font-bold tracking-tight text-white mb-1">{value}</div>
      {subValue && <div className="text-xs text-neutral-500">{subValue}</div>}
    </Card>
  );
};

const AdminOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<{ totalLeads: number; totalConversions: number; conversionRate: number } | null>(null);
  const [steps, setSteps] = useState<{ step: string; count: number }[]>([]);
  const [sales, setSales] = useState<{
    day: { count: number; valueCents: number };
    week: { count: number; valueCents: number };
    month: { count: number; valueCents: number };
    seriesLast30Days: { day: string; purchases: number; valueCents: number }[];
  } | null>(null);
  const [checkout, setCheckout] = useState<{
    starts: { day: number; week: number; month: number };
    abandonmentRate: { day: number; week: number; month: number };
  } | null>(null);
  const [offers, setOffers] = useState<{ upsellTakeRate: number; offerViews: number; offerAccepts: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await adminOverviewMetrics();
        if (cancelled) return;
        setTotals(data.totals);
        setSteps(data.steps);
        setSales(data.sales);
        setCheckout(data.checkout);
        setOffers(data.offers);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Falha ao carregar métricas');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
    </div>
  );
  
  if (error) return <div className="text-red-400 bg-red-500/10 p-4 rounded-xl">{error}</div>;

  const chartData = sales?.seriesLast30Days.map(d => ({
    name: new Date(d.day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    value: d.valueCents / 100,
    orders: d.purchases
  })) || [];

  const avgTicket = sales && sales.month.count > 0 ? sales.month.valueCents / sales.month.count : 0;
  const lostCheckouts = checkout ? checkout.starts.month - (sales?.month.count || 0) : 0;
  const estimatedLoss = lostCheckouts > 0 ? lostCheckouts * avgTicket : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
          Visão Geral
        </h2>
        <div className="flex gap-2">
           <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs font-medium text-neutral-400">
             Última atualização: Agora
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
        <MetricCard 
          label="Receita Total (Mês)" 
          value={sales ? formatMoneyCents(sales.month.valueCents) : '—'} 
          subValue={`${sales?.month.count || 0} pedidos confirmados`}
          icon={DollarSign}
          color="green"
        />
        <MetricCard 
          label="Leads Totais" 
          value={totals?.totalLeads ?? 0}
          subValue="Base total de contatos"
          icon={Users}
          color="blue"
        />
        <MetricCard 
          label="Taxa de Conversão" 
          value={formatPct(totals?.conversionRate ?? 0)}
          subValue="Visitantes → Compradores"
          icon={Activity}
          color="purple"
        />
        <MetricCard 
          label="Upsell Take Rate" 
          value={offers ? formatPct(offers.upsellTakeRate) : '—'}
          subValue={`${offers?.offerAccepts || 0} ofertas aceitas`}
          icon={TrendingUp}
          color="pink"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
        {/* Main Chart */}
        <Card className="lg:col-span-2 xl:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Receita Recente</h3>
              <p className="text-sm text-neutral-400">Evolução das vendas nos últimos 30 dias</p>
            </div>
            <select className="bg-neutral-800 border border-white/10 rounded-lg text-xs px-3 py-1.5 text-neutral-300 outline-none hover:bg-neutral-700 transition-colors">
              <option>Últimos 30 dias</option>
              <option>Últimos 7 dias</option>
            </select>
          </div>
          <div className="h-[300px] md:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#525252" 
                  tick={{ fill: '#525252', fontSize: 12 }} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#525252" 
                  tick={{ fill: '#525252', fontSize: 12 }} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$ ${value}`}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Receita']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Funnel Steps */}
        <Card className="flex flex-col h-full">
          <h3 className="text-lg font-bold text-white mb-1">Funil de Vendas</h3>
          <p className="text-sm text-neutral-400 mb-6">Visualizações por etapa</p>
          <div className="space-y-6 flex-1">
            {steps.length === 0 ? (
              <div className="text-neutral-500 text-sm text-center py-10">Sem dados suficientes</div>
            ) : (
              steps.map((step, index) => {
                const max = Math.max(...steps.map(s => s.count));
                const percent = max > 0 ? (step.count / max) * 100 : 0;
                
                return (
                  <div key={step.step} className="group">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-neutral-300 font-medium truncate max-w-[150px]" title={step.step}>{step.step}</span>
                      <span className="text-white font-bold">{step.count}</span>
                    </div>
                    <div className="h-3 w-full bg-neutral-800 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${percent}%`, transitionDelay: `${index * 100}ms` }}
                        className={cn(
                          "h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)] transition-all duration-1000 ease-out",
                          index === 0 ? "bg-blue-500" :
                          index === 1 ? "bg-purple-500" :
                          index === 2 ? "bg-pink-500" : "bg-neutral-500"
                        )}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
          <button className="w-full mt-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-neutral-300 transition-colors border border-white/5">
            Ver Relatório Completo
          </button>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 xl:gap-8">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h4 className="font-bold text-white">Checkout Abandonado</h4>
              <p className="text-xs text-neutral-400">Oportunidade de recuperação</p>
            </div>
          </div>
          <div className="text-center py-4">
            <div className="text-4xl font-extrabold text-white mb-2">
              {checkout ? formatPct(checkout.abandonmentRate.month) : '—'}
            </div>
            <p className="text-sm text-neutral-400">dos checkouts iniciados este mês não foram concluídos</p>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-sm">
             <span className="text-neutral-400">Hoje: <span className="text-white">{checkout ? formatPct(checkout.abandonmentRate.day) : '—'}</span></span>
             <span className="text-neutral-400">Perda Est.: <span className="text-white">{formatMoneyCents(estimatedLoss)}</span></span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h4 className="font-bold text-white">Vendas Hoje</h4>
              <p className="text-xs text-neutral-400">Performance diária</p>
            </div>
          </div>
          <div className="text-center py-4">
            <div className="text-4xl font-extrabold text-white mb-2">
              {sales ? formatMoneyCents(sales.day.valueCents) : '—'}
            </div>
            <p className="text-sm text-neutral-400">{sales?.day.count || 0} pedidos realizados</p>
          </div>
           <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-sm">
             <span className="text-neutral-400">Ticket Médio: <span className="text-white">{sales && sales.day.count > 0 ? formatMoneyCents(sales.day.valueCents / sales.day.count) : 'R$ 0,00'}</span></span>
          </div>
        </Card>

         <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Activity className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h4 className="font-bold text-white">Conversão Funil</h4>
              <p className="text-xs text-neutral-400">Eficiência geral</p>
            </div>
          </div>
          <div className="text-center py-4">
            <div className="text-4xl font-extrabold text-white mb-2">
              {totals?.conversionRate ? formatPct(totals.conversionRate) : '—'}
            </div>
            <p className="text-sm text-neutral-400">Lead → Venda</p>
          </div>
           <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-sm">
             <span className="text-neutral-400">Visitantes: <span className="text-white">{totals?.totalLeads ?? 0}</span></span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
