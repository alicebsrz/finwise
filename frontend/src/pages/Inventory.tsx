import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Plus, Package, ArrowUpCircle, ArrowDownCircle, AlertTriangle, Search, Pencil, Trash2, ClipboardCheck, CalendarClock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Sku {
  id: string;
  code: string;
  name: string;
  quantity: number;
  minQuantity: number;
  costPrice: number;
  sellingPrice: number;
  createdAt: string; // Importante estar aqui
}

const Inventory = () => {
  const [skus, setSkus] = useState<Sku[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modais
  const [showProductModal, setShowProductModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [selectedSku, setSelectedSku] = useState<Sku | null>(null);
  const [auditCounts, setAuditCounts] = useState<{[key: string]: number}>({});

  // Forms
  const [productForm, setProductForm] = useState({ 
    id: '', 
    code: '', 
    name: '', 
    minQuantity: '5', 
    costPrice: '', 
    sellingPrice: '',
    createdAt: '' // Novo campo para o formulário
  });
  
  const [moveForm, setMoveForm] = useState({ type: 'IN', quantity: '1', notes: '' });

  // --- FUNÇÃO INTELIGENTE DE DATAS (CORRIGE O NaN) ---
  const formatDuration = (dateString: string) => {
    if (!dateString) return "Recém adicionado";
    
    const created = new Date(dateString);
    const now = new Date();
    
    // Se a data for inválida, retorna texto padrão
    if (isNaN(created.getTime())) return "Data desconhecida";

    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays === 0) return "Adicionado hoje";
    if (diffDays === 1) return "Há 1 dia no estoque";
    
    if (diffDays < 30) return `Há ${diffDays} dias no estoque`;
    
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `Há ${months} ${months === 1 ? 'mês' : 'meses'} no estoque`;
    }

    const years = Math.floor(diffDays / 365);
    const monthsRemainder = Math.floor((diffDays % 365) / 30);
    
    if (monthsRemainder > 0) {
        return `Há ${years}a e ${monthsRemainder}m no estoque`;
    }
    return `Há ${years} ${years === 1 ? 'ano' : 'anos'} no estoque`;
  };

  const fetchSkus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSkus(response.data);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar estoque');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkus();
  }, []);

  // --- HANDLERS ---

  const openCreateModal = () => {
    setIsEditing(false);
    // Define a data de hoje como padrão no formato YYYY-MM-DD para o input type="date"
    const today = new Date().toISOString().split('T')[0];
    setProductForm({ id: '', code: '', name: '', minQuantity: '5', costPrice: '', sellingPrice: '', createdAt: today });
    setShowProductModal(true);
  };

  const openEditModal = (sku: Sku) => {
    setIsEditing(true);
    // Formata a data existente para o input
    const dateVal = sku.createdAt ? new Date(sku.createdAt).toISOString().split('T')[0] : '';
    
    setProductForm({
      id: sku.id,
      code: sku.code,
      name: sku.name,
      minQuantity: String(sku.minQuantity),
      costPrice: String(sku.costPrice),
      sellingPrice: String(sku.sellingPrice),
      createdAt: dateVal
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      if (isEditing) {
        await api.put(`/inventory/${productForm.id}`, productForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Produto atualizado!');
      } else {
        await api.post('/inventory', productForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Produto cadastrado!');
      }
      setShowProductModal(false);
      fetchSkus();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza? Isso apagará também o histórico.')) return;
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/inventory/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Produto excluído');
      fetchSkus();
    } catch (error) {
        console.error(error);
        toast.error('Erro ao excluir');
    }
  };

  const handleMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSku) return;
    try {
      const token = localStorage.getItem('token');
      await api.post('/inventory/movement', {
        ...moveForm,
        skuId: selectedSku.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Movimentação realizada!`);
      setShowMoveModal(false);
      setMoveForm({ type: 'IN', quantity: '1', notes: '' });
      fetchSkus();
    } catch (error) {
      console.error(error);
      toast.error('Erro na movimentação');
    }
  };

  const handleAuditSubmit = async () => {
    if (!confirm('Isso ajustará automaticamente o estoque dos itens divergentes. Confirmar?')) return;
    
    const itemsToAudit = skus.map(sku => ({
      skuId: sku.id,
      realQuantity: auditCounts[sku.id] !== undefined ? auditCounts[sku.id] : sku.quantity
    }));

    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/inventory/audit', { items: itemsToAudit }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Auditoria concluída! Acuracidade: ${res.data.accuracy.toFixed(1)}%`);
      setShowAuditModal(false);
      setAuditCounts({});
      fetchSkus();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar auditoria');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#14161b]">
      <Sidebar />
      <div className="flex-1 md:ml-64 p-8">
        <Header title="Inventário & Estoque" />

        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center bg-[#1a1c23] border border-white/5 rounded-xl px-4 py-2 w-full md:w-96">
            <Search size={20} className="text-gray-400 mr-2" />
            <input type="text" placeholder="Buscar produto..." className="bg-transparent border-none text-white focus:outline-none w-full" />
          </div>
          <div className="flex gap-3">
             <button 
              onClick={() => {
                const initialCounts = skus.reduce((acc, sku) => ({...acc, [sku.id]: sku.quantity}), {});
                setAuditCounts(initialCounts);
                setShowAuditModal(true);
              }}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2.5 rounded-xl transition-all"
            >
              <ClipboardCheck size={20} className="text-blue-400" /> Auditoria
            </button>
            <button 
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-purple-500/20 transition-all"
            >
              <Plus size={20} /> Novo Produto
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mr-3"></div>
            Carregando estoque...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skus.length === 0 ? (
               <div className="col-span-full text-center py-12 text-gray-500">Nenhum produto cadastrado.</div>
            ) : (
              skus.map(sku => {
                const isLowStock = sku.quantity <= sku.minQuantity;
                return (
                  <div key={sku.id} className={`bg-[#1a1c23] border ${isLowStock ? 'border-red-500/30' : 'border-white/5'} rounded-2xl p-6 shadow-lg relative group transition-all hover:-translate-y-1`}>
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
                          <Package size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">{sku.name}</h3>
                          <div className="flex items-center gap-2">
                             <p className="text-gray-500 text-xs uppercase tracking-wider">{sku.code}</p>
                             {/* Badge de Dias Corrigido */}
                             <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-gray-400 border border-white/5 whitespace-nowrap">
                               {formatDuration(sku.createdAt)}
                             </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                         <button onClick={() => openEditModal(sku)} className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="Editar"><Pencil size={16} /></button>
                         <button onClick={() => handleDelete(sku.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Excluir"><Trash2 size={16} /></button>
                      </div>
                    </div>

                    {isLowStock && (
                      <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-2 flex items-center gap-2 text-red-400 text-sm">
                          <AlertTriangle size={16} /> <span>Estoque Crítico (Mín: {sku.minQuantity})</span>
                      </div>
                    )}

                    <div className="flex justify-between items-end border-t border-white/5 pt-4">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Quantidade</p>
                        <p className={`text-2xl font-bold ${isLowStock ? 'text-red-400' : 'text-emerald-400'}`}>
                          {sku.quantity} <span className="text-sm text-gray-500 font-normal">un</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-xs mb-1">Preço Venda</p>
                        <p className="text-white font-medium">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sku.sellingPrice)}
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => { setSelectedSku(sku); setShowMoveModal(true); }}
                      className="w-full mt-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowUpCircle size={16} /> Ajustar Estoque
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* --- MODAL 1: PRODUTO (NOVO/EDITAR) --- */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1e2029] w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">
              {isEditing ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Código (SKU)</label>
                  <input required type="text" value={productForm.code} onChange={e => setProductForm({...productForm, code: e.target.value})} className="w-full bg-[#14161b] border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" placeholder="Ex: CAN-001" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Nome do Produto</label>
                  <input required type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full bg-[#14161b] border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" placeholder="Ex: Caneta" />
                </div>
              </div>
              
              {/* CAMPO DE DATA ADICIONADO */}
              <div>
                  <label className="text-gray-400 text-sm flex items-center gap-2 mb-1">
                    <CalendarClock size={14}/> Data de Cadastro
                  </label>
                  <input 
                    type="date" 
                    required 
                    value={productForm.createdAt} 
                    onChange={e => setProductForm({...productForm, createdAt: e.target.value})} 
                    className="w-full bg-[#14161b] border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" 
                  />
              </div>

              <div className="grid grid-cols-3 gap-4">
                 <div>
                  <label className="text-gray-400 text-sm">Estoque Mín.</label>
                  <input required type="number" value={productForm.minQuantity} onChange={e => setProductForm({...productForm, minQuantity: e.target.value})} className="w-full bg-[#14161b] border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Custo (R$)</label>
                  <input required type="number" step="0.01" value={productForm.costPrice} onChange={e => setProductForm({...productForm, costPrice: e.target.value})} className="w-full bg-[#14161b] border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" placeholder="0,00" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Venda (R$)</label>
                  <input required type="number" step="0.01" value={productForm.sellingPrice} onChange={e => setProductForm({...productForm, sellingPrice: e.target.value})} className="w-full bg-[#14161b] border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" placeholder="0,00" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 py-3 bg-white/5 rounded-xl text-gray-300">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-purple-600 rounded-xl text-white font-bold">
                  {isEditing ? 'Salvar Alterações' : 'Criar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: MOVIMENTAÇÃO --- */}
      {showMoveModal && selectedSku && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1e2029] w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-2">Ajustar Estoque</h2>
            <p className="text-gray-400 text-sm mb-6">Produto: <span className="text-white font-medium">{selectedSku.name}</span></p>
            
            <form onSubmit={handleMove} className="space-y-4">
              <div className="flex bg-[#14161b] p-1 rounded-lg border border-white/10 gap-1">
                <button type="button" onClick={() => setMoveForm({...moveForm, type: 'IN'})} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${moveForm.type === 'IN' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}><ArrowUpCircle size={16} /> Entrada</button>
                <button type="button" onClick={() => setMoveForm({...moveForm, type: 'OUT'})} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${moveForm.type === 'OUT' ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-gray-300'}`}><ArrowDownCircle size={16} /> Saída</button>
              </div>
              <div><label className="text-gray-400 text-sm">Quantidade</label><input required type="number" min="1" value={moveForm.quantity} onChange={e => setMoveForm({...moveForm, quantity: e.target.value})} className="w-full bg-[#14161b] border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none text-center text-xl font-bold" /></div>
              <div><label className="text-gray-400 text-sm">Observação</label><input type="text" value={moveForm.notes} onChange={e => setMoveForm({...moveForm, notes: e.target.value})} className="w-full bg-[#14161b] border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" /></div>
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowMoveModal(false)} className="flex-1 py-3 bg-white/5 rounded-xl text-gray-300">Cancelar</button><button type="submit" className="flex-1 py-3 bg-blue-600 rounded-xl text-white font-bold">Confirmar</button></div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: AUDITORIA (MANTIDO) --- */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1e2029] w-full max-w-4xl rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div><h2 className="text-xl font-bold text-white">Inventário Físico</h2><p className="text-gray-400 text-sm">Informe a quantidade real encontrada nas prateleiras.</p></div>
              <div className="text-right"><span className="text-xs text-gray-500 block">Total de Itens</span><span className="text-white font-bold">{skus.length}</span></div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full text-left border-collapse">
                <thead className="text-xs text-gray-500 uppercase bg-white/5 sticky top-0"><tr><th className="p-3 rounded-l-lg">Produto</th><th className="p-3 text-center">Qtd. Sistema</th><th className="p-3 text-center w-32">Qtd. Real</th><th className="p-3 text-right rounded-r-lg">Divergência</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {skus.map(sku => {
                    const currentCount = auditCounts[sku.id] ?? sku.quantity;
                    const diff = currentCount - sku.quantity;
                    return (
                      <tr key={sku.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3"><p className="text-white font-medium">{sku.name}</p><p className="text-xs text-gray-500">{sku.code}</p></td>
                        <td className="p-3 text-center text-gray-300">{sku.quantity}</td>
                        <td className="p-3 text-center"><input type="number" className="w-20 bg-[#14161b] border border-white/20 rounded p-1 text-center text-white focus:border-blue-500 outline-none" value={currentCount} onChange={(e) => setAuditCounts({...auditCounts, [sku.id]: Number(e.target.value)})} /></td>
                        <td className="p-3 text-right">{diff === 0 ? <span className="text-emerald-500 text-sm font-bold flex items-center justify-end gap-1">OK</span> : <span className={`text-sm font-bold ${diff > 0 ? 'text-blue-400' : 'text-red-400'}`}>{diff > 0 ? `+${diff}` : diff}</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-6 border-t border-white/10 bg-[#1a1c23] rounded-b-2xl flex justify-end gap-3">
              <button onClick={() => setShowAuditModal(false)} className="px-6 py-3 text-gray-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleAuditSubmit} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"><ClipboardCheck size={20} /> Finalizar e Ajustar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;