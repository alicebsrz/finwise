import { useState } from 'react';
import { LayoutDashboard, Wallet, Package, Tags, MessageSquare, Settings, LogOut, BarChart3, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Wallet, label: 'Transações', path: '/transactions' },
    { icon: Package, label: 'Inventário', path: '/inventory' },
    { icon: BarChart3, label: 'Controle', path: '/reports' }, 
    { icon: Tags, label: 'Categorias', path: '/categories' },
    { icon: MessageSquare, label: 'Mensagens', path: '/messages' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false); // Fecha o menu ao clicar em um item (no mobile)
  };

  return (
    <>
      {/* --- BOTÃO HAMBÚRGUER (SÓ MOBILE) --- */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`md:hidden fixed top-4 left-4 z-[1000] p-2 bg-[#1a1c23] text-white rounded-lg border border-white/10 shadow-lg ${isOpen ? 'hidden' : ''}`}
      >
        <Menu size={24} />
      </button>

      {/* --- OVERLAY ESCURO (SÓ MOBILE) --- */}
      {/* Cobre o fundo quando o menu está aberto para focar a atenção */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[900] md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* --- SIDEBAR PRINCIPAL --- */}
      <div className={`
        fixed left-0 top-0 h-screen w-64 bg-[#1a1c23] border-r border-white/5 flex flex-col z-[999]
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 
      `}>
        
        {/* Header da Sidebar (Logo + Botão Fechar Mobile) */}
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-half.png" 
              alt="FinWise Logo" 
              className="h-8 w-auto object-contain" 
            />
            <h1 className="text-2xl font-bold text-white tracking-tight">FinWise</h1>
          </div>
          
          {/* Botão X para fechar no mobile */}
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Menu de Navegação */}
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-gradient-to-r from-orange-500/10 to-pink-500/10 text-white shadow-[0_0_20px_rgba(236,72,153,0.1)] border border-white/5' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon 
                  size={20} 
                  className={isActive ? 'text-pink-500' : 'text-gray-400 group-hover:text-white'} 
                />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Rodapé (Configurações e Logout) */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <button 
            onClick={() => handleNavigation('/settings')}
            className="w-full flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <Settings size={20} />
            <span>Configurações</span>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;