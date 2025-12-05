import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Save, Users, AlertTriangle, Building, Shield, User as UserIcon, Lock, Download, History, FileJson } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

interface SettingsData {
  name: string;
  currency: string;
  minStockAlert: number;
  purchaseAlertLimit: number;
  users: User[];
}

interface AuditLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  user: { name: string };
}

const Settings = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');
  const [data, setData] = useState<SettingsData | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Busca dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [settingsRes, logsRes] = await Promise.all([
          api.get('/settings', { headers }),
          api.get('/security/logs', { headers })
        ]);

        setData(settingsRes.data);
        setLogs(logsRes.data);
      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Salva alterações
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await api.put('/settings', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Configurações salvas!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  // Gerar Backup
  const handleBackup = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/security/backup', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Cria o arquivo JSON para download
      const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
        JSON.stringify(res.data, null, 2)
      )}`;
      const link = document.createElement('a');
      link.href = jsonString;
      link.download = `backup_finwise_${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      toast.success('Backup realizado com sucesso!');
      
      // Atualiza logs para mostrar o backup recente
      const logsRes = await api.get('/security/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(logsRes.data);

    } catch (error) {
      console.error(error); // <--- Correção aqui: Logando o erro
      toast.error('Erro ao gerar backup');
    }
  };

  if (loading) return <div className="flex h-screen bg-[#14161b] items-center justify-center text-gray-500">Carregando...</div>;

  return (
    <div className="flex min-h-screen bg-[#14161b]">
      <Sidebar />
      <div className="flex-1 md:ml-64 p-8 overflow-y-auto">
        <Header title="Configurações do Sistema" />

        <div className="max-w-5xl mx-auto space-y-8 pb-10">
          
          {/* MENU DE ABAS */}
          <div className="flex gap-4 border-b border-white/10 pb-1">
            <button 
              onClick={() => setActiveTab('general')}
              className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'general' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Geral & Usuários
              {activeTab === 'general' && <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></div>}
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'security' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Segurança & Dados
              {activeTab === 'security' && <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-purple-500 rounded-t-full"></div>}
            </button>
          </div>

          {/* --- CONTEÚDO DA ABA GERAL --- */}
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <form onSubmit={handleSave} className="space-y-8">
                
                {/* Seção 1: Empresa */}
                <div className="bg-[#1a1c23] border border-white/5 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Building size={20} /></div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Parâmetros da Empresa</h3>
                      <p className="text-sm text-gray-400">Identidade e padrões regionais.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Nome da Empresa</label>
                      <input 
                        type="text" 
                        value={data?.name} 
                        onChange={e => setData({...data!, name: e.target.value})}
                        className="w-full bg-[#0f1117] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Moeda Padrão</label>
                      <select 
                        value={data?.currency}
                        onChange={e => setData({...data!, currency: e.target.value})}
                        className="w-full bg-[#0f1117] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="BRL">Real Brasileiro (BRL)</option>
                        <option value="USD">Dólar Americano (USD)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Seção 2: Alertas */}
                <div className="bg-[#1a1c23] border border-white/5 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400"><AlertTriangle size={20} /></div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Limites de Automação</h3>
                      <p className="text-sm text-gray-400">Gatilhos para notificações inteligentes.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Estoque Mínimo Global</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={data?.minStockAlert} 
                          onChange={e => setData({...data!, minStockAlert: Number(e.target.value)})}
                          className="w-full bg-[#0f1117] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                        />
                        <span className="absolute right-4 top-3.5 text-xs text-gray-500">unidades</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Alerta de Compra Alta</label>
                      <div className="relative">
                        <span className="absolute left-4 top-3.5 text-gray-500">R$</span>
                        <input 
                          type="number" 
                          value={data?.purchaseAlertLimit} 
                          onChange={e => setData({...data!, purchaseAlertLimit: Number(e.target.value)})}
                          className="w-full bg-[#0f1117] border border-white/10 rounded-xl px-4 py-3 pl-10 text-white focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="submit" disabled={saving} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50">
                    <Save size={20} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>

              {/* Lista de Usuários */}
              <div className="bg-[#1a1c23] border border-white/5 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Users size={20} /></div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Usuários</h3>
                      <p className="text-sm text-gray-400">Acesso ao sistema.</p>
                    </div>
                  </div>
                  <button className="text-sm bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg border border-white/10">+ Convidar</button>
                </div>
                <div className="overflow-hidden rounded-xl border border-white/5">
                  <table className="w-full text-left">
                    <thead className="bg-[#0f1117] text-gray-400 text-xs uppercase">
                      <tr><th className="px-6 py-3">Nome</th><th className="px-6 py-3">Email</th><th className="px-6 py-3">Perfil</th><th className="px-6 py-3 text-right">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {data?.users.map(user => (
                        <tr key={user.id} className="hover:bg-white/5">
                          <td className="px-6 py-4 font-medium text-white flex gap-3 items-center">
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs">{user.name.charAt(0)}</div>
                            {user.name}
                          </td>
                          <td className="px-6 py-4 text-gray-400">{user.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold flex gap-1 w-max ${user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                              {user.role === 'ADMIN' ? <Shield size={10} /> : <UserIcon size={10} />} {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right"><span className="text-emerald-400 text-xs bg-emerald-400/10 px-2 py-1 rounded-full">Ativo</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* --- CONTEÚDO DA ABA SEGURANÇA --- */}
          {activeTab === 'security' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Card de Backup */}
              <div className="bg-[#1a1c23] border border-white/5 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 p-6 opacity-5"><Lock size={120} /></div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><Download size={20} /></div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Backup & Exportação</h3>
                    <p className="text-sm text-gray-400">Baixe uma cópia completa dos seus dados.</p>
                  </div>
                </div>
                
                <div className="bg-[#0f1117] rounded-xl p-6 border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <h4 className="text-white font-medium mb-1">Backup Completo (JSON)</h4>
                    <p className="text-sm text-gray-500 max-w-md">
                      Inclui todos os produtos, transações, clientes, logs de mensagens e configurações. 
                      Recomendamos fazer isso semanalmente.
                    </p>
                  </div>
                  <button onClick={handleBackup} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95">
                    <FileJson size={20} /> Baixar Dados
                  </button>
                </div>
              </div>

              {/* Logs de Auditoria */}
              <div className="bg-[#1a1c23] border border-white/5 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                  <div className="p-2 bg-gray-500/10 rounded-lg text-gray-400"><History size={20} /></div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Logs de Auditoria</h3>
                    <p className="text-sm text-gray-400">Rastreabilidade de ações no sistema.</p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <thead className="bg-[#0f1117] text-gray-400 text-xs uppercase sticky top-0">
                      <tr><th className="px-6 py-3">Ação</th><th className="px-6 py-3">Usuário</th><th className="px-6 py-3">Detalhes</th><th className="px-6 py-3 text-right">Data</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {logs.length === 0 ? (
                        <tr><td colSpan={4} className="p-6 text-center text-gray-500">Nenhum log registrado ainda.</td></tr>
                      ) : (
                        logs.map(log => (
                          <tr key={log.id} className="hover:bg-white/5">
                            <td className="px-6 py-3 font-mono text-xs text-purple-400">{log.action}</td>
                            <td className="px-6 py-3 text-white">{log.user?.name || 'Sistema'}</td>
                            <td className="px-6 py-3 text-gray-400">{log.details}</td>
                            <td className="px-6 py-3 text-right text-gray-500 text-xs">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;