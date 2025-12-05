import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Plus, Tag, Trash2, Hash, Pencil, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  keywords: string | null;
  priority: number;
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [form, setForm] = useState({ id: '', name: '', keywords: '', priority: 1 });

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Ordena no front também por prioridade visualmente
      const sorted = response.data.sort((a: Category, b: Category) => b.priority - a.priority);
      setCategories(sorted);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setForm({ id: '', name: '', keywords: '', priority: 1 });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setIsEditing(true);
    setForm({ 
      id: cat.id, 
      name: cat.name, 
      keywords: cat.keywords || '', 
      priority: cat.priority 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (isEditing) {
        await api.put(`/categories/${form.id}`, form, { headers });
        toast.success('Regra atualizada!');
      } else {
        await api.post('/categories', form, { headers });
        toast.success('Categoria criada!');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar');
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Deseja excluir esta categoria?")) return;
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Categoria removida');
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#14161b]">
      <Sidebar />
      <div className="flex-1 md:ml-64 p-8">
        <Header title="Categorias & Regras" />

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h2 className="text-white text-lg font-semibold">Motor de Categorização</h2>
            <p className="text-gray-400 text-sm">Defina prioridades e palavras-chave para automação.</p>
          </div>
          <button 
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-pink-500/20 transition-all"
          >
            <Plus size={20} /> Nova Regra
          </button>
        </div>

        {loading ? (
          <div className="text-gray-400 text-center py-10">Carregando...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(cat => (
              <div key={cat.id} className="bg-[#1a1c23] border border-white/5 rounded-2xl p-6 hover:border-pink-500/30 transition-colors group relative">
                
                {/* Badge de Prioridade */}
                <div className="absolute top-4 right-4 bg-white/5 px-2 py-1 rounded text-xs text-gray-400 border border-white/10" title="Prioridade de verificação">
                   Prioridade: <span className="text-white font-bold">{cat.priority}</span>
                </div>

                <div className="flex justify-between items-start mb-4 mt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400">
                      <Tag size={20} />
                    </div>
                    <h3 className="font-bold text-white text-lg">{cat.name}</h3>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2 flex items-center gap-1">
                    <Hash size={12} /> Palavras-chave
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {cat.keywords && cat.keywords.trim() !== '' ? cat.keywords.split(',').map((k, i) => (
                      <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-300">
                        {k.trim()}
                      </span>
                    )) : (
                      <span className="text-gray-600 text-xs italic flex items-center gap-1">
                        <AlertCircle size={12}/> Sem automação
                      </span>
                    )}
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-2 border-t border-white/5 pt-4 mt-auto">
                   <button 
                    onClick={() => openEditModal(cat)}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Pencil size={14} /> Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(cat.id)}
                    className="px-3 py-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1e2029] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">{isEditing ? 'Editar Regra' : 'Nova Categoria'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                    <label className="text-gray-400 text-sm block mb-1">Nome da Categoria</label>
                    <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-[#14161b] border border-white/10 rounded-lg p-3 text-white focus:border-pink-500 outline-none" placeholder="Ex: Alimentação" />
                </div>
                <div className="col-span-1">
                    <label className="text-gray-400 text-sm block mb-1">Prioridade</label>
                    <input required type="number" min="1" max="99" value={form.priority} onChange={e => setForm({...form, priority: Number(e.target.value)})} className="w-full bg-[#14161b] border border-white/10 rounded-lg p-3 text-white focus:border-pink-500 outline-none text-center" />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-1">Palavras-chave (separadas por vírgula)</label>
                <textarea rows={4} value={form.keywords} onChange={e => setForm({...form, keywords: e.target.value})} className="w-full bg-[#14161b] border border-white/10 rounded-lg p-3 text-white focus:border-pink-500 outline-none resize-none leading-relaxed" placeholder="Ex: ifood, restaurante, mcdonalds, mercado" />
                <p className="text-xs text-gray-500 mt-2">
                  Dica: Coloque palavras únicas. A prioridade define quem ganha em caso de conflito.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-white/5 rounded-xl text-gray-300">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-pink-600 rounded-xl text-white font-bold">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;