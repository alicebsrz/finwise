import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Search, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  date: string;
  description: string;
  category?: { name: string };
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados do Formulário
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'EXPENSE',
    date: new Date().toISOString().split('T')[0] // Data de hoje yyyy-mm-dd
  });

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data);
    } catch (error) {
      console.error(error); // Adicionado para corrigir o aviso
      toast.error('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Transação removida');
      fetchTransactions(); // Atualiza a lista
    } catch (error) {
      console.error(error); // <--- Correção aqui: logando o erro
      toast.error('Erro ao excluir');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await api.post('/transactions', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Transação criada!');
      setIsModalOpen(false);
      setFormData({ ...formData, description: '', amount: '' }); // Limpa form
      fetchTransactions(); // Recarrega lista
    } catch (error) {
      console.error(error); // <--- Correção aqui: logando o erro
      toast.error('Erro ao salvar');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#14161b] flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 md:ml-64 p-4 sm:p-6 md:p-8">
        <Header title="Transações" />

        {/* Barra de Ações */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center bg-[#1a1c23] border border-white/5 rounded-xl px-4 py-2 w-full md:w-96">
            <Search size={20} className="text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="Buscar lançamento..." 
              className="bg-transparent border-none text-white focus:outline-none w-full"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 w-full md:w-auto rounded-xl font-medium shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus size={20} /> Nova Transação
          </button>
        </div>

        {/* Tabela */}
        <div className="bg-[#1a1c23] rounded-2xl border border-white/5 overflow-hidden shadow-xl hidden md:block">
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
            <thead className="bg-white/5 text-gray-400 text-sm uppercase">
              <tr>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center">Carregando...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nenhuma transação encontrada.</td></tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                      {t.type === 'INCOME' 
                        ? <ArrowUpCircle size={20} className="text-emerald-400" /> 
                        : <ArrowDownCircle size={20} className="text-red-400" />
                      }
                      {t.description}
                    </td>
                    <td className="px-6 py-4">
                      {t.category ? (
                        <span className="bg-white/5 px-2 py-1 rounded text-xs border border-white/10">
                          {t.category.name}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs italic">Sem categoria</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">{new Date(t.date).toLocaleDateString()}</td>
                    <td className={`px-6 py-4 font-bold ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.type === 'INCOME' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>
        </div>

        {/* MOBILE CARDS */}
        <div className="md:hidden space-y-4 p-4">
          {transactions.map((t) => (
            <div key={t.id} className="bg-[#1a1c23] rounded-xl border border-white/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold text-white">
                  {t.type === 'INCOME' 
                    ? <ArrowUpCircle size={18} className="text-emerald-400" /> 
                    : <ArrowDownCircle size={18} className="text-red-400" />
                  }
                  {t.description}
                </span>
                <button 
                  onClick={() => handleDelete(t.id)}
                  className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="text-sm text-gray-400">
                {new Date(t.date).toLocaleDateString()}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs bg-white/5 px-2 py-1 rounded">
                  {t.category?.name || 'Sem categoria'}
                </span>
                <span className={`font-bold ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- MODAL DE NOVA TRANSAÇÃO --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1e2029] w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-white mb-6">Nova Movimentação</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'INCOME'})}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                    formData.type === 'INCOME' 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                    : 'border-white/10 text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <ArrowUpCircle size={18} /> Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'EXPENSE'})}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                    formData.type === 'EXPENSE' 
                    ? 'bg-red-500/20 border-red-500 text-red-400' 
                    : 'border-white/10 text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <ArrowDownCircle size={18} /> Saída
                </button>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Descrição</label>
                <input 
                  required
                  type="text" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-[#14161b] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Ex: Pagamento de Fornecedor"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Valor (R$)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full bg-[#14161b] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Data</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full bg-[#14161b] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-colors pl-10"
                    />
                    <Calendar size={18} className="absolute left-3 top-3.5 text-gray-500" />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 transition-all"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;