import { useEffect, useState, useRef, useMemo } from 'react';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { 
  Search, Send, Phone, User, CheckCheck, 
  MoreVertical, Zap, Paperclip, AlertCircle, DollarSign, PackageCheck, ArrowLeft, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ===================== INTERFACES ===================== */

interface Message {
  id: string;
  contactName: string;
  phone: string;
  message: string;
  direction: 'IN' | 'OUT';
  createdAt: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
}

interface ContactSummary {
  phone: string;
  name: string;
  lastMessage: string;
  lastTime: Date; 
  avatarColor: string;
  unreadCount: number;
  type: 'Cliente' | 'Fornecedor';
}

interface Template {
  label: string;
  text: string;
  icon: React.ReactNode;
  color: string;
}

/* ===================== CONFIG & HELPERS (FUNÇÕES PURAS) ===================== */

const TEMPLATES: Template[] = [
  { label: 'Cobrança', text: 'Olá {{nome}}, notamos que sua fatura vence amanhã. Podemos enviar o boleto?', icon: <DollarSign size={14} />, color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20' },
  { label: 'Confirmação', text: 'Oi {{nome}}, seu pedido foi confirmado e já está sendo separado! 📦', icon: <PackageCheck size={14} />, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' },
  { label: 'Promoção', text: 'Olá! Temos uma oferta especial para você hoje. Confira!', icon: <Zap size={14} />, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20' },
  { label: 'Alerta', text: 'Aviso: O produto X atingiu o nível crítico de estoque.', icon: <AlertCircle size={14} />, color: 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' },
];

const getHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const generateAvatarColor = (phone: string) => {
  const hash = getHash(phone);
  return `hsl(${hash % 360}, 70%, 50%)`;
};

const getContactMeta = (phone: string) => {
  const hash = getHash(phone);
  const type: 'Cliente' | 'Fornecedor' = hash % 2 === 0 ? 'Cliente' : 'Fornecedor';
  const unreadCount = hash % 4; 
  return { type, unreadCount };
};

const formatDateSeparator = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hoje';
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
  return date.toLocaleDateString('pt-BR');
};

const generateTempId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString();
};

/* ===================== HOOK CUSTOMIZADO ===================== */

function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await api.get('/messages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return { messages, setMessages, loading };
}

/* ===================== COMPONENTE PRINCIPAL ===================== */

const Messages = () => {
  const { messages, setMessages, loading } = useMessages();
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedPhone]);

  // --- LÓGICA DE DADOS (MEMOIZED & PURA) ---
  const contacts = useMemo(() => {
    const map = new Map<string, ContactSummary>();

    messages.forEach(msg => {
      const existing = map.get(msg.phone);
      const msgDate = new Date(msg.createdAt);

      if (!existing || msgDate > existing.lastTime) {
        const meta = getContactMeta(msg.phone);
        
        map.set(msg.phone, {
          phone: msg.phone,
          name: msg.contactName || 'Desconhecido',
          lastMessage: msg.message,
          lastTime: msgDate,
          avatarColor: generateAvatarColor(msg.phone),
          unreadCount: meta.unreadCount, 
          type: meta.type 
        });
      }
    });

    let list = Array.from(map.values()).sort((a, b) => b.lastTime.getTime() - a.lastTime.getTime());

    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      list = list.filter(c => 
        c.name.toLowerCase().includes(lowerQ) || 
        c.phone.includes(lowerQ) ||
        c.lastMessage.toLowerCase().includes(lowerQ)
      );
    }

    return list;
  }, [messages, searchQuery]);

  const displayContacts = (contacts.length === 0 && !loading && !searchQuery) 
    ? [{ phone: 'demo', name: 'Cliente Demo', lastMessage: 'Bem-vindo ao chat!', lastTime: new Date(), avatarColor: '#ec4899', unreadCount: 1, type: 'Cliente' } as ContactSummary]
    : contacts;

  const activeChat = useMemo(() => {
    if (!selectedPhone) return [];
    return messages.filter(m => m.phone === selectedPhone);
  }, [messages, selectedPhone]);

  const activeContact = displayContacts.find(c => c.phone === selectedPhone);

  // --- HANDLERS ---

  const handleSend = async () => {
    if (!inputText.trim() || !selectedPhone) return;

    const tempId = generateTempId();
    
    const newMessage: Message = {
      id: tempId,
      contactName: activeContact?.name || 'Cliente',
      phone: selectedPhone,
      message: inputText,
      direction: 'OUT',
      createdAt: new Date().toISOString(),
      status: 'SENT'
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    try {
      const token = localStorage.getItem('token');
      await api.post('/messages', newMessage, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error(error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error('Falha ao enviar mensagem');
    }
  };

  const applyTemplate = (templateText: string) => {
    const name = activeContact?.name.split(' ')[0] || 'Cliente';
    const text = templateText.replace('{{nome}}', name);
    setInputText(text);
  };

  const renderStatus = (status: string) => {
    if (status === 'READ') return <CheckCheck size={14} className="text-blue-400" />;
    if (status === 'DELIVERED') return <CheckCheck size={14} className="text-gray-400" />;
    return <Check size={14} className="text-gray-400" />;
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#14161b] overflow-hidden">
      {/* Sidebar Fixa (Desktop) / Drawer (Mobile) */}
      <Sidebar />
      
      {/* Área Principal */}
      <div className="flex-1 md:ml-64 p-3 sm:p-4 md:p-4 h-full flex flex-col">
        <div className="shrink-0 mb-4">
           <Header title="Central de Mensagens" />
        </div>

        <div className="flex-1 px-2 sm:px-4 pb-4 min-h-0">
          <div className="h-full bg-[#1a1c23] border border-white/5 rounded-2xl overflow-hidden flex shadow-2xl relative">
            
            {/* --- COLUNA 1: LISTA DE CONTATOS (Esconde no mobile se chat aberto) --- */}
            <div className={`w-full md:w-80 border-r border-white/5 flex-col bg-[#16181e] shrink-0 ${selectedPhone ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-white/5">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3 text-gray-500" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar conversa..." 
                    className="w-full bg-[#0f1117] border border-white/10 rounded-xl py-2.5 pl-10 text-white text-sm focus:border-purple-500 outline-none transition-colors placeholder-gray-600"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {displayContacts.map(contact => (
                  <div 
                    key={contact.phone}
                    onClick={() => setSelectedPhone(contact.phone)}
                    className={`p-4 flex gap-3 cursor-pointer transition-all border-b border-white/5 hover:bg-white/5 relative group ${
                      selectedPhone === contact.phone ? 'bg-white/5 border-l-2 border-l-purple-500' : 'border-l-2 border-l-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md" style={{ backgroundColor: contact.avatarColor }}>
                        {contact.name.charAt(0)}
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#16181e] rounded-full"></div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className={`font-semibold truncate text-sm ${contact.unreadCount > 0 ? 'text-white' : 'text-gray-300'}`}>
                          {contact.name}
                        </h4>
                        <span className="text-[10px] text-gray-500 whitespace-nowrap">
                          {contact.lastTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className={`text-sm truncate max-w-[140px] ${contact.unreadCount > 0 ? 'text-gray-200 font-medium' : 'text-gray-500'}`}>
                          {contact.lastMessage}
                        </p>
                        {contact.unreadCount > 0 && (
                          <span className="bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {contact.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* --- COLUNA 2: CHAT ATIVO (Só aparece se tiver seleção ou desktop) --- */}
            <div className={`relative flex-1 flex-col bg-[#0f1117] min-w-0 ${!selectedPhone ? 'hidden md:flex' : 'flex'}`}>
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(#4b5563 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
              
              {selectedPhone ? (
                <div className="relative flex flex-col h-full z-10">
                  <div className="p-3 bg-[#1a1c23]/95 backdrop-blur-md border-b border-white/5 flex justify-between items-center shadow-sm shrink-0">
                    <div className="flex items-center gap-3">
                      {/* Botão de Voltar (Só Mobile) */}
                      <button 
                        onClick={() => setSelectedPhone(null)}
                        className="md:hidden p-2 text-gray-400 hover:bg-white/10 rounded-full"
                      >
                        <ArrowLeft size={20} />
                      </button>

                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: activeContact?.avatarColor }}>
                        {activeContact?.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                          {activeContact?.name}
                          <span className={`hidden sm:inline text-[10px] px-2 py-0.5 rounded-full border ${activeContact?.type === 'Cliente' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' : 'border-orange-500/30 text-orange-400 bg-orange-500/10'}`}>
                            {activeContact?.type}
                          </span>
                        </h3>
                        <p className="text-xs text-gray-400">+55 {activeContact?.phone}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-2 custom-scrollbar">
                    {activeChat.map((msg, index) => {
                      const showDateSeparator = index === 0 || formatDateSeparator(msg.createdAt) !== formatDateSeparator(activeChat[index - 1].createdAt);
                      
                      return (
                        <div key={msg.id}>
                          {showDateSeparator && (
                            <div className="flex justify-center my-6">
                              <span className="text-[10px] bg-[#1a1c23] border border-white/10 text-gray-400 px-3 py-1 rounded-full shadow-sm uppercase tracking-wide font-medium">
                                {formatDateSeparator(msg.createdAt)}
                              </span>
                            </div>
                          )}

                          <div className={`flex ${msg.direction === 'OUT' ? 'justify-end' : 'justify-start'} mb-1`}>
                            <div className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-2xl relative shadow-md text-sm ${
                              msg.direction === 'OUT' 
                              ? 'bg-purple-600 text-white rounded-tr-sm' 
                              : 'bg-[#252830] text-gray-200 rounded-tl-sm border border-white/5'
                            }`}>
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                              <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${msg.direction === 'OUT' ? 'text-purple-200' : 'text-gray-500'}`}>
                                <span>{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                {msg.direction === 'OUT' && renderStatus(msg.status)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Templates (Scroll Horizontal) */}
                  <div className="px-2 sm:px-4 py-3 bg-[#16181e] border-t border-white/5 flex gap-2 overflow-x-auto custom-scrollbar shrink-0">
                    {TEMPLATES.map((tpl, i) => (
                      <button 
                        key={i}
                        onClick={() => applyTemplate(tpl.text)}
                        className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-2 shadow-sm active:scale-95 ${tpl.color}`}
                      >
                        {tpl.icon} {tpl.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-2 sm:p-4 bg-[#1a1c23] border-t border-white/5 flex gap-2 sm:gap-3 shrink-0">
                    <button className="hidden sm:block p-3 hover:bg-white/5 text-gray-400 hover:text-white rounded-xl transition-colors">
                      <Paperclip size={20} />
                    </button>
                    <input 
                      type="text" 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Digite sua mensagem..." 
                      className="flex-1 bg-[#0f1117] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <button 
                      onClick={handleSend}
                      className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-900/20 transition-transform active:scale-95 flex items-center justify-center"
                      aria-label="Enviar mensagem"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
                     <Phone size={40} className="opacity-40" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Selecione uma conversa</h3>
                  <p className="text-sm max-w-xs text-center text-gray-400">Gerencie o atendimento aos seus clientes e fornecedores de forma centralizada e ágil.</p>
                </div>
              )}
            </div>

            {/* --- COLUNA 3: PERFIL DO CLIENTE (Só Desktop) --- */}
            {selectedPhone && (
              <div className="w-72 border-l border-white/5 bg-[#16181e] p-6 hidden xl:flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col items-center mb-8">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-2xl ring-4 ring-[#1a1c23]" style={{ backgroundColor: activeContact?.avatarColor }}>
                    {activeContact?.name.charAt(0)}
                  </div>
                  <h3 className="text-lg font-bold text-white text-center">{activeContact?.name}</h3>
                  <p className="text-sm text-gray-500">+55 {activeContact?.phone}</p>
                  <div className="mt-4 flex gap-2">
                     <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20">Cliente VIP</span>
                     <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">Ativo</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                     <h4 className="text-xs uppercase text-gray-500 font-bold mb-3 flex items-center gap-2"><User size={12}/> Dados do Cliente</h4>
                     <div className="space-y-3 text-sm">
                       <div className="flex justify-between border-b border-white/5 pb-2">
                         <span className="text-gray-400">Status</span>
                         <span className="text-emerald-400 font-medium">Ativo</span>
                       </div>
                       <div className="flex justify-between border-b border-white/5 pb-2">
                         <span className="text-gray-400">Desde</span>
                         <span className="text-white">Jan 2024</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-400">LTV</span>
                         <span className="text-purple-400 font-bold">R$ 4.250</span>
                       </div>
                     </div>
                  </div>

                  <div>
                    <h4 className="text-xs uppercase text-gray-500 font-bold mb-3">Ações Rápidas</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <button className="py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white transition-colors border border-white/5 flex items-center justify-center gap-2">
                          Ver Pedidos Recentes
                      </button>
                      <button className="py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white transition-colors border border-white/5">
                          Gerar Link de Pagamento
                      </button>
                      <button className="py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition-colors border border-red-500/20 mt-2">
                          Bloquear Contato
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;