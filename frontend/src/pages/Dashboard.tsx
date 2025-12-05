import { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { DollarSign, Package, AlertTriangle, TrendingUp, TrendingDown, Calendar, ArrowRight, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

// --- Interfaces ---
interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  date: string;
  description: string;
  category?: { name: string };
}

interface DashboardData {
  finance: { balance: number; income: number; expense: number; };
  inventory: { totalSkus: number; capitalEmployed: number; lowStockItems: number; };
  recentActivity: Transaction[];
}

interface ChartDataPoint {
  name: string;
  income: number;
  expense: number;
}

// --- FUNÇÃO DE CURVATURA SUAVE (BEZIER SIMPLES) ---
const buildSmoothPath = (points: number[][]) => {
  if (!points || points.length < 2) return "";

  return points.reduce((path, point, i, arr) => {
    if (i === 0) return `M ${point[0]},${point[1]}`;

    const prev = arr[i - 1];
    const xMid = (prev[0] + point[0]) / 2;

    return path + ` C ${xMid},${prev[1]} ${xMid},${point[1]} ${point[0]},${point[1]}`;
  }, "");
};

// --- COMPONENTE DE GRÁFICO (POSICIONAMENTO ABSOLUTO) ---
function CustomActivityChart({ incomeData, expenseData, labels }: { incomeData: number[], expenseData: number[], labels: string[] }) {
  const allValues = [...incomeData, ...expenseData];
  const max = Math.max(...allValues, 100); 
  const min = 0; 

  const generateCoordinates = (data: number[]) => {
    if (data.length === 0) return [];

    const paddingX = 4; // margem lateral para evitar overflow do ponto + shadow
    const paddingY = 6; // margem superior/inferior

    if (data.length === 1) {
      const y =
        100 - ((data[0] - min) / (max - min)) * (100 - paddingY * 2) - paddingY;
      return [[paddingX, y], [100 - paddingX, y]];
    }

    return data.map((value, index) => {
      const x =
        paddingX + (index / (data.length - 1)) * (100 - paddingX * 2);

      const y =
        100 - ((value - min) / (max - min)) * (100 - paddingY * 2) - paddingY;

      return [x, y];
    });
  };

  const pointsIncome = generateCoordinates(incomeData);
  const pointsExpense = generateCoordinates(expenseData);

  const pathIncome = pointsIncome.length > 0 ? buildSmoothPath(pointsIncome) : "";
  const pathExpense = pointsExpense.length > 0 ? buildSmoothPath(pointsExpense) : "";

  const yLabels = [max, max * 0.5, 0];

  if (incomeData.length === 0) return (
    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-white/5 rounded-xl">
      <BarChart3 className="mb-2 opacity-50" />
      <p className="text-sm">Sem dados para exibir.</p>
    </div>
  );

  return (
    <div className="flex w-full h-full relative">
      
      {/* Eixo Y (Esquerda) */}
      <div className="flex flex-col justify-between text-[10px] text-gray-500 font-medium pr-2 text-right w-10 shrink-0 h-full pb-6">
        {yLabels.map((val, i) => (
          <span key={i}>R${new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(val)}</span>
        ))}
      </div>

      {/* Container do SVG e Datas */}
      <div className="flex-1 relative h-full flex flex-col">
        
        {/* Área do Gráfico (Ocupa o resto menos o espaço das datas) */}
        <div className="relative flex-1 w-full overflow-hidden">
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grades (linhas contínuas, discretas) */}
            {[10, 50, 90].map(y => (
              <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#374151" strokeWidth="0.3" opacity={0.4} />
            ))}

            {/* Despesas */}
            {pointsExpense.length > 0 && (
              <>
                <path d={`${pathExpense} L 100,100 L 0,100 Z`} fill="url(#redGradient)" stroke="none" />
                <path d={pathExpense} fill="none" stroke="#EF4444" strokeWidth={1.8} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <circle cx={pointsExpense.at(-1)![0]} cy={pointsExpense.at(-1)![1]} r={1.2} fill="#EF4444" />
              </>
            )}

            {/* Receitas */}
            {pointsIncome.length > 0 && (
              <>
                <path d={`${pathIncome} L 100,100 L 0,100 Z`} fill="url(#greenGradient)" stroke="none" />
                <path d={pathIncome} fill="none" stroke="#10B981" strokeWidth={1.8} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <circle cx={pointsIncome.at(-1)![0]} cy={pointsIncome.at(-1)![1]} r={1.2} fill="#10B981" />
              </>
            )}
          </svg>
        </div>

        {/* Eixo X (Datas) - Altura Fixa na Base */}
        <div className="h-6 w-full flex justify-between text-[10px] text-gray-500 font-medium mt-1">
          <span>{labels[0]}</span>
          {labels.length > 2 && <span>{labels[Math.floor(labels.length / 2)]}</span>}
          {labels.length > 1 && <span>{labels[labels.length - 1]}</span>}
        </div>

      </div>
    </div>
  );
}

// --- PÁGINA DASHBOARD ---

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  useEffect(() => {
    const fetchGeneralData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [statsRes, activityRes] = await Promise.all([
          api.get('/dashboard/stats', { headers }),
          api.get('/transactions', { headers }) 
        ]);
        
        setData({
          ...statsRes.data,
          recentActivity: activityRes.data.slice(0, 5) 
        });
      } catch (error) {
        console.error('Erro dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGeneralData();
  }, []);

  useEffect(() => {
    const fetchChart = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const response = await api.get(`/dashboard/chart?period=${chartPeriod}`, { headers });
        setChartData(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Erro chart:', error);
        setChartData([]);
      }
    };
    fetchChart();
  }, [chartPeriod]); 

  // Prepara arrays para o gráfico
  const incomeArray = useMemo(() => chartData.map(d => d.income), [chartData]);
  const expenseArray = useMemo(() => chartData.map(d => d.expense), [chartData]);
  const labelsArray = useMemo(() => chartData.map(d => d.name), [chartData]);

  if (loading && !data) return (
    <div className="min-h-screen bg-[#14161b] flex items-center justify-center text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#14161b]">
      <Sidebar />

      <div className="flex-1 md:ml-64 p-8 overflow-y-auto">
        <Header title="Visão Geral" />

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card Saldo */}
          <div className="bg-[#1a1c23] p-6 rounded-2xl border border-white/5 shadow-lg group hover:border-dusky-blue/30 transition-all relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-5"><DollarSign size={80} /></div>
            <p className="text-gray-400 text-sm mb-1">Saldo Atual</p>
            <h3 className="text-2xl font-bold text-white">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data?.finance?.balance || 0)}
            </h3>
            <div className="flex items-center gap-2 mt-4 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded w-max">
               <TrendingUp size={12} /> Fluxo
            </div>
          </div>

          {/* Card Capital */}
          <div className="bg-[#1a1c23] p-6 rounded-2xl border border-white/5 shadow-lg group hover:border-purple-500/30 transition-all relative overflow-hidden">
             <div className="absolute right-0 top-0 p-4 opacity-5"><Package size={80} /></div>
            <p className="text-gray-400 text-sm mb-1">Capital Empregado</p>
            <h3 className="text-2xl font-bold text-white">
               {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data?.inventory?.capitalEmployed || 0)}
            </h3>
            <div className="flex items-center gap-2 mt-4 text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded w-max">
               {data?.inventory?.totalSkus || 0} SKUs
            </div>
          </div>

          {/* Card Crítico */}
          <div className="bg-[#1a1c23] p-6 rounded-2xl border border-white/5 shadow-lg group hover:border-red-500/30 transition-all relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-5"><AlertTriangle size={80} /></div>
            <p className="text-gray-400 text-sm mb-1">Estoque Crítico</p>
            <h3 className="text-2xl font-bold text-white">
               {data?.inventory?.lowStockItems || 0} itens
            </h3>
             <div className={`flex items-center gap-2 mt-4 text-xs px-2 py-1 rounded w-max ${data?.inventory?.lowStockItems ? 'text-red-400 bg-red-400/10' : 'text-emerald-400 bg-emerald-400/10'}`}>
                {data?.inventory?.lowStockItems ? 'Ação Necessária' : 'Saudável'}
            </div>
          </div>

           {/* Card Saídas */}
           <div className="bg-[#1a1c23] p-6 rounded-2xl border border-white/5 shadow-lg group hover:border-orange-500/30 transition-all relative overflow-hidden">
             <div className="absolute right-0 top-0 p-4 opacity-5"><TrendingDown size={80} /></div>
            <p className="text-gray-400 text-sm mb-1">Saídas (Total)</p>
            <h3 className="text-2xl font-bold text-white">
               {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data?.finance?.expense || 0)}
            </h3>
            <div className="flex items-center gap-2 mt-4 text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded w-max">
                Despesas
            </div>
          </div>
        </div>

        {/* --- ÁREA PRINCIPAL --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card do Gráfico */}
          <div className="lg:col-span-2 bg-[#1a1c23] p-6 rounded-2xl border border-white/5 shadow-lg flex flex-col h-[450px]">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar size={18} className="text-purple-500" /> Fluxo de Caixa
                </h3>
                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1 text-gray-400"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Receitas</span>
                  <span className="flex items-center gap-1 text-gray-400"><div className="w-2 h-2 rounded-full bg-red-500"></div> Despesas</span>
                </div>
              </div>
              
              <div className="flex bg-white/5 rounded-lg p-1 border border-white/5">
                {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setChartPeriod(p)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      chartPeriod === p 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {p === 'daily' ? 'Diário' : p === 'weekly' ? 'Semanal' : 'Mensal'}
                  </button>
                ))}
              </div>
            </div>

            {/* Container do Gráfico */}
            <div className="w-full flex-1 min-h-0">
               <CustomActivityChart 
                  incomeData={incomeArray}
                  expenseData={expenseArray}
                  labels={labelsArray}
               />
            </div>
          </div>

          {/* Lista Lateral */}
          <div className="bg-[#1a1c23] p-6 rounded-2xl border border-white/5 shadow-lg flex flex-col h-[450px]">
            <h3 className="text-lg font-bold text-white mb-6">Últimas Transações</h3>
            
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {!data?.recentActivity || data.recentActivity.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                  <BarChart3 size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Nenhuma movimentação.</p>
                  <Link to="/transactions" className="text-purple-400 text-xs hover:underline mt-2 inline-block">Criar agora</Link>
                </div>
              ) : (
                data.recentActivity.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-white/5">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {t.type === 'INCOME' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{t.description}</p>
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</span>
                           {t.category && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400 truncate max-w-[80px]">{t.category.name}</span>}
                        </div>
                      </div>
                    </div>
                    <span className={`font-bold text-sm whitespace-nowrap ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.type === 'INCOME' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
            
            <Link to="/transactions" className="w-full mt-6 py-3 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
              Ver tudo <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;