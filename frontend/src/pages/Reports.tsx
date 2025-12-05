import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  PieChart, Pie, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import {
  AlertOctagon, TrendingUp, DollarSign,
  FileSpreadsheet, AlertTriangle, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ===================== INTERFACES ===================== */

interface AbcItem {
  id: string;
  name: string;
  quantity: number;
  value: number;
  classification: 'A' | 'B' | 'C';
}

interface DeadStockItem {
  id: string;
  name: string;
  quantity: number;
  totalLostValue: number;
}

interface KpiData {
  capitalEmployed: number;
  criticalItems: number;
  accuracy: number;
}

// Adicionado [key: string]: any para compatibilidade com Recharts
// [key: string]: any adicionado para compatibilidade com Recharts
interface CashFlowItem {
  name: string;
  income: number;
  expense: number;
  // propriedades dinâmicas do Recharts podem ser string ou number
  [key: string]: number | string | undefined;
}

interface ExpenseCategoryItem {
  name: string;
  value: number;
  [key: string]: number | string | undefined;
}

interface FinancialData {
  cashFlow: CashFlowItem[];
  expensesByCategory: ExpenseCategoryItem[];
}

/* ===================== CONFIG ===================== */

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6'];

/* ===================== COMPONENT MAIN ===================== */

export default function Reports() {
  const [abcData, setAbcData] = useState<AbcItem[]>([]);
  const [deadStock, setDeadStock] = useState<DeadStockItem[]>([]);
  const [daysFilter, setDaysFilter] = useState<number>(90);
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [financial, setFinancial] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [daysFilter]);

  async function fetchReports() {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [abcRes, deadRes, finRes, kpiRes] = await Promise.all([
        api.get('/reports/abc', { headers }),
        api.get(`/reports/dead-stock?days=${daysFilter}`, { headers }),
        api.get('/reports/financial', { headers }),
        api.get('/reports/kpis', { headers }),
      ]);

      setAbcData(abcRes.data.items || []);
      setDeadStock(deadRes.data || []);
      setFinancial(finRes.data);
      setKpis(kpiRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar os relatórios.');
    } finally {
      setLoading(false);
    }
  }

  /* ===================== EXPORTAÇÃO ===================== */

  function handleExport() {
    if (!kpis || !abcData.length) return toast.error('Sem dados para exportar.');

    setExporting(true);

    // =========================
    // ABA 1 — RESUMO EXECUTIVO
    // =========================
    const resumoData = [
      ['RELATÓRIO FINWISE'],
      [],
      ['Capital Empregado', kpis.capitalEmployed],
      ['Itens Críticos', kpis.criticalItems],
      ['Acuracidade (%)', kpis.accuracy],
    ];

    const resumoWS = XLSX.utils.aoa_to_sheet(resumoData);

    // =========================
    // ABA 2 — CURVA ABC
    // =========================
    const abcDataFormatted = [
      ['Produto', 'Estoque', 'Valor (R$)', 'Classe'],
      ...abcData.map(item => [
        item.name,
        item.quantity,
        item.value,
        item.classification,
      ]),
    ];

    const abcWS = XLSX.utils.aoa_to_sheet(abcDataFormatted);

    // =========================
    // ABA 3 — ESTOQUE PARADO
    // =========================
    const deadStockFormatted = [
      ['Produto', 'Quantidade', 'Valor Perdido (R$)'],
      ...deadStock.map(item => [
        item.name,
        item.quantity,
        item.totalLostValue,
      ]),
    ];

    const deadWS = XLSX.utils.aoa_to_sheet(deadStockFormatted);

    // =========================
    // CRIAR ARQUIVO
    // =========================
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, resumoWS, 'Resumo');
    XLSX.utils.book_append_sheet(workbook, abcWS, 'Curva ABC');
    XLSX.utils.book_append_sheet(workbook, deadWS, 'Estoque Parado');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const file = new Blob([buffer], { type: 'application/octet-stream' });

    saveAs(file, 'relatorio-finwise.xlsx');

    toast.success('Relatório Excel gerado com sucesso!');
    setExporting(false);
  }

  /* ===================== MEMOS ===================== */

  const criticalStatus = useMemo(() => {
    if (!kpis) return 'neutral';
    if (kpis.criticalItems === 0) return 'ok';
    if (kpis.criticalItems <= 5) return 'warning';
    return 'danger';
  }, [kpis]);

  /* ===================== RENDER ===================== */

  return (
    <div className="flex min-h-screen bg-[#14161b]">
      <Sidebar />

      <div className="flex-1 md:ml-64 p-8 overflow-y-auto">
        <Header title="Controle & Inteligência" />

        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mr-3" />
            Processando dados...
          </div>
        ) : (
          <div className="space-y-8 pb-10">

            {/* ===================== TOPO ===================== */}

            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
              <div>
                <h2 className="text-white text-lg font-semibold">Resumo Executivo</h2>
                <p className="text-gray-400 text-sm">Indicadores chave de performance</p>
              </div>

              <button
                disabled={exporting}
                onClick={handleExport}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                <FileSpreadsheet size={18} className="text-emerald-400" />
                Exportar CSV
              </button>
            </div>

            {/* ===================== KPIS ===================== */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <KpiCard
                title="Capital Empregado"
                value={kpis?.capitalEmployed}
                icon={<DollarSign size={90} />}
                tag="Dinheiro em estoque"
              />

              <KpiProgress
                title="Acuracidade de Estoque"
                value={kpis?.accuracy}
              />

              <KpiStatus
                title="Itens Críticos"
                value={kpis?.criticalItems}
                status={criticalStatus}
              />

            </div>

            {/* ===================== FINANCEIRO ===================== */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              <ChartCard title="Fluxo de Caixa Mensal">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={financial?.cashFlow || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#6b7280" tickLine={false} />
                    <YAxis stroke="#6b7280" tickLine={false} tickFormatter={(v) => `R$${v / 1000}k`} />
                    {/* Tooltip com fundo escuro e borda sutil */}
                    <RechartsTooltip
                      cursor={false}
                      contentStyle={{ backgroundColor: '#1a1c23', border: '1px solid #374151', color: '#fff', borderRadius: 8 }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    {/* Ordem: Despesas (vermelho) primeiro, Receitas (verde) depois */}
                    <Bar dataKey="expense" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="income" name="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Custos por Categoria">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={financial?.expensesByCategory || []}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                    >
                      {(financial?.expensesByCategory || []).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#1a1c23', border: '1px solid #374151', color: '#fff', borderRadius: 8 }} itemStyle={{ color: '#fff' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

            </div>

            {/* ===================== ESTOQUE ===================== */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              <AbcTable items={abcData} />

              <DeadStockBox items={deadStock} daysFilter={daysFilter} setDaysFilter={setDaysFilter} />

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================== COMPONENTES REUTILIZÁVEIS (HELPER COMPONENTS) ===================== */

// Tipagem das Props
interface KpiCardProps { title: string; value?: number; icon: React.ReactNode; tag: string; }
interface KpiProgressProps { title: string; value?: number; }
interface KpiStatusProps { title: string; value?: number; status: 'ok' | 'warning' | 'danger' | 'neutral'; }
interface ChartCardProps { title: string; children: React.ReactNode; }
interface AbcTableProps { items: AbcItem[]; }
// Adicione essa prop na interface DeadStockBoxProps lá em cima
interface DeadStockBoxProps { 
  items: DeadStockItem[]; 
  daysFilter: number;
  setDaysFilter: (d: number) => void;
}

function KpiCard({ title, value, icon, tag }: KpiCardProps) {
  return (
    <div className="bg-[#1a1c23] border border-white/5 p-6 rounded-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5">{icon}</div>
      <p className="text-gray-400 text-sm">{title}</p>
      <h3 className="text-3xl font-bold text-white">
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)}
      </h3>
      <span className="text-xs text-purple-400">{tag}</span>
    </div>
  );
}

function KpiProgress({ title, value }: KpiProgressProps) {
  return (
    <div className="bg-[#1a1c23] border border-white/5 p-6 rounded-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5"><CheckCircle size={100} /></div>
      <p className="text-gray-400 text-sm">{title}</p>
      <h3 className="text-3xl font-bold text-white">{value || 0}%</h3>
      <div className="w-full bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${value || 0}%` }} />
      </div>
      <p className="text-xs text-gray-500 mt-1">Confiabilidade do sistema</p>
    </div>
  );
}

function KpiStatus({ title, value, status }: KpiStatusProps) {
  return (
    <div className="bg-[#1a1c23] border border-white/5 p-6 rounded-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5"><AlertTriangle size={100} /></div>
      <p className="text-gray-400 text-sm">{title}</p>
      <h3 className="text-3xl font-bold text-white">{value || 0}</h3>
      <span className={`text-xs px-2 py-1 rounded mt-2 inline-block ${
        status === 'danger' ? 'text-red-400 bg-red-400/10' :
        status === 'warning' ? 'text-orange-400 bg-orange-400/10' :
        'text-emerald-400 bg-emerald-400/10'
      }`}>
        {status === 'danger' ? 'Risco de Ruptura' : status === 'warning' ? 'Atenção' : 'Estoque Saudável'}
      </span>
    </div>
  );
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="bg-[#1a1c23] border border-white/5 p-6 rounded-2xl">
      <h3 className="text-lg font-bold text-white mb-6">{title}</h3>
      {children}
    </div>
  );
}

function AbcTable({ items }: AbcTableProps) {
  return (
    <div className="lg:col-span-2 bg-[#1a1c23] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
      <div className="p-6 border-b border-white/5 flex justify-between items-center">
        <h3 className="font-bold text-white flex items-center gap-2">
          <TrendingUp size={18} className="text-purple-500" /> Curva ABC (Pareto)
        </h3>
      </div>
      <div className="overflow-x-auto max-h-[300px]">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-gray-400 text-xs uppercase sticky top-0 bg-[#1a1c23]">
            <tr>
              <th className="px-6 py-3">Produto</th>
              <th className="px-6 py-3">Valor Total</th>
              <th className="px-6 py-3 text-center">Classe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-300">
            {items.slice(0, 10).map((item) => (
              <tr key={item.id} className="hover:bg-white/5">
                <td className="px-6 py-3 font-medium text-white">{item.name}</td>
                <td className="px-6 py-3">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)}
                </td>
                <td className="px-6 py-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    item.classification === 'A' ? 'bg-emerald-500/20 text-emerald-400' :
                    item.classification === 'B' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {item.classification}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="p-4 text-center text-gray-500">Nenhum dado para curva ABC.</div>
        )}
      </div>
    </div>
  );
}

function DeadStockBox({ items, daysFilter, setDaysFilter }: DeadStockBoxProps) {
  return (
    <div className="bg-[#1a1c23] border border-white/5 rounded-2xl p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertOctagon size={18} className="text-red-500" /> Estoque Parado
          </h3>
          <p className="text-xs text-gray-400">Itens sem giro.</p>
        </div>
        
        {/* Filtros de Dias */}
        <div className="flex bg-white/5 rounded-lg p-1">
          {[30, 60, 90].map(days => (
            <button
              key={days}
              onClick={() => setDaysFilter(days)}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                daysFilter === days 
                ? 'bg-red-500 text-white font-bold' 
                : 'text-gray-400 hover:text-white'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-emerald-400 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
          Tudo girando! ✅
        </div>
      ) : (
        <div className="space-y-3">
          {items.slice(0, 5).map((item, index) => (
            <div key={item.id} className="flex justify-between items-center p-3 bg-red-500/5 border border-red-500/10 rounded-lg group hover:border-red-500/30 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-red-500/50">#{index + 1}</span>
                <div>
                  <p className="text-white font-medium text-sm">{item.name}</p>
                  <p className="text-red-300 text-xs">{item.quantity} un paradas</p>
                </div>
              </div>
              <span className="text-white font-bold text-sm">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalLostValue)}
              </span>
            </div>
          ))}
          {items.length > 5 && (
            <p className="text-center text-xs text-gray-500 mt-2">Ver lista completa na exportação</p>
          )}
        </div>
      )}
    </div>
  );
}