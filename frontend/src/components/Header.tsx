import { useState, useEffect, useRef } from 'react';
import { Bell, Search, User, LogOut, Box, FileText, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'success' | 'info';
  time: string;
}

interface SearchResult {
  products: { id: string; name: string; code: string; }[];
  transactions: { id: string; description: string; amount: number; type: 'INCOME'|'EXPENSE' }[];
}

const Header = ({ title }: HeaderProps) => {
  const navigate = useNavigate();
  
  // Carrega usuário do localStorage imediatamente (evita setState em effect)
  const getUserFromStorage = () => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  };

  // Estados de Dados
  const [user] = useState<{ name: string; email: string } | null>(getUserFromStorage);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  
  // Estados de UI
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Referências para fechar ao clicar fora
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // --- FUNÇÕES AUXILIARES (Definidas ANTES do useEffect para evitar erro) ---

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/header/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (error) {
      console.error("Erro ao buscar notificações", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // --- EFEITOS ---

  // 1. Configurar listener de click-outside ao montar
  useEffect(() => {
    // Fecha dropdowns ao clicar fora
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileOpen(false);
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 2. Carregar notificações (separado para evitar warning de cascading renders)
  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3. Busca Global com Debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        try {
          const token = localStorage.getItem('token');
          const res = await api.get(`/header/search?q=${searchQuery}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setSearchResults(res.data);
          setIsSearchOpen(true);
        } catch (error) {
          console.error(error);
        }
      } else {
        setSearchResults(null);
        setIsSearchOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <header className="flex justify-between items-center mb-8 bg-[#1a1c23]/95 backdrop-blur-md p-4 rounded-2xl border border-white/5 sticky top-4 z-50 shadow-lg">
      
      {/* Título da Página (Esquerda) */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">{title || 'Visão Geral'}</h1>
      </div>
      
      {/* Área Direita (Busca + Ações) */}
      <div className="flex items-center gap-4 md:gap-6">
        
        {/* --- BUSCA GLOBAL --- */}
        <div className="relative hidden md:block" ref={searchRef}>
          <div className="flex items-center bg-[#0f1117] border border-white/10 rounded-full px-4 py-2 w-64 focus-within:w-80 focus-within:border-purple-500 transition-all duration-300">
            <Search size={18} className="text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-sm text-white focus:outline-none w-full placeholder-gray-500"
            />
          </div>

          {/* Dropdown de Resultados da Busca */}
          {isSearchOpen && searchResults && (
            <div className="absolute top-12 left-0 w-full bg-[#1a1c23] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              {searchResults.products.length === 0 && searchResults.transactions.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">Nenhum resultado encontrado.</div>
              ) : (
                <>
                  {searchResults.products.length > 0 && (
                    <div className="p-2">
                      <p className="text-[10px] uppercase text-gray-500 font-bold px-2 mb-1">Produtos</p>
                      {searchResults.products.map(p => (
                        <div key={p.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors" onClick={() => navigate('/inventory')}>
                          <Box size={14} className="text-purple-400"/>
                          <div>
                            <p className="text-sm text-white">{p.name}</p>
                            <p className="text-[10px] text-gray-500">{p.code}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.transactions.length > 0 && (
                    <div className="p-2 border-t border-white/5">
                      <p className="text-[10px] uppercase text-gray-500 font-bold px-2 mb-1">Transações</p>
                      {searchResults.transactions.map(t => (
                        <div key={t.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors" onClick={() => navigate('/transactions')}>
                          <FileText size={14} className={t.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}/>
                          <div className="flex-1">
                            <p className="text-sm text-white truncate">{t.description}</p>
                            <p className="text-[10px] text-gray-500">R$ {t.amount}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* --- NOTIFICAÇÕES --- */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white"
          >
            <Bell size={20} />
            {notifications.some(n => n.type === 'alert') && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
            )}
          </button>

          {/* Dropdown de Notificações */}
          {isNotifOpen && (
            <div className="absolute top-12 right-0 w-80 bg-[#1a1c23] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-3 border-b border-white/5 bg-[#16181e]">
                <h4 className="text-sm font-bold text-white">Notificações</h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                   <div className="p-4 text-center text-gray-500 text-xs">Nenhuma notificação nova.</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="p-3 border-b border-white/5 hover:bg-white/5 transition-colors flex gap-3">
                      <div className={`mt-1 ${n.type === 'alert' ? 'text-red-400' : n.type === 'success' ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {n.type === 'alert' ? <AlertTriangle size={16} /> : n.type === 'success' ? <CheckCircle size={16} /> : <Info size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-200">{n.title}</p>
                        <p className="text-xs text-gray-400 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-gray-600 mt-1">{n.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 text-center border-t border-white/5">
                <button className="text-xs text-purple-400 hover:text-purple-300">Marcar todas como lidas</button>
              </div>
            </div>
          )}
        </div>

        {/* --- PERFIL DO USUÁRIO --- */}
        <div className="relative pl-4 border-l border-white/10" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors">
                {user?.name || 'Usuário'}
              </p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Admin</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 p-[2px]">
               <div className="w-full h-full rounded-full bg-[#1a1c23] flex items-center justify-center">
                  <User size={20} className="text-white" />
               </div>
            </div>
          </button>

          {/* Dropdown de Perfil */}
          {isProfileOpen && (
            <div className="absolute top-14 right-0 w-48 bg-[#1a1c23] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
              <div className="p-4 border-b border-white/5">
                <p className="text-white font-bold text-sm truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <div className="p-2">
                <button onClick={() => navigate('/settings')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  <User size={16} /> Meu Perfil
                </button>
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <LogOut size={16} /> Sair
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;