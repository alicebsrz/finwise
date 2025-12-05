import React, { useState } from 'react';
import { AxiosError } from 'axios';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

// Interface para erro da API
interface ApiErrorResponse {
  message: string;
}

const LandingPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  // --- Lógica do Formulário (Mesma do Login anterior) ---
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulação de loading simples
    const loadingToast = toast.loading(isLogin ? 'Entrando...' : 'Criando conta...');
    
    const endpoint = isLogin ? '/login' : '/register';
    
    try {
      const response = await api.post(`/auth${endpoint}`, formData);
      
      toast.dismiss(loadingToast);
      
      if (isLogin) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success('Bem-vindo de volta!');
        // Redireciona para o dashboard após o sucesso
        navigate('/dashboard');
      } else {
        toast.success('Conta criada com sucesso! Faça login.');
        setIsLogin(true);
        setFormData({ name: '', email: '', password: '', companyName: '' }); // Limpa formulário
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      const error = err as AxiosError<ApiErrorResponse>;
      const errorMessage = error.response?.data?.message || 'Erro ao conectar com o servidor';
      toast.error(errorMessage);
    }
  };
  // -------------------------------------------------------

  return (
    // Fundo principal usando sua paleta monocromática roxa/azul
    <div className="min-h-screen bg-gradient-to-br from-night-indigo via-twilight-purple to-midnight-blue overflow-hidden relative font-sans text-lavender-haze">
      
      {/* Elementos de fundo (Blobs animados) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-twilight-purple rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-dusky-blue rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      {/* Navbar Simples */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          {/* Aumentei de h-10 para h-16 (aprox 64px) e md:h-20 para telas maiores */}
          <img 
            src="/logo-white.png" 
            alt="FinWise Logo" 
            className="h-16 md:h-20 w-auto object-contain" 
          />
        </div>
        <div>
            {/* Botão que foca no formulário (mobile) ou alterna (desktop) */}
           <button 
             onClick={() => setIsLogin(!isLogin)}
             className="px-6 py-2 text-sm font-medium text-lavender-haze border border-lavender-haze/30 rounded-full hover:bg-lavender-haze/10 transition-all"
           >
             {isLogin ? 'Criar Conta' : 'Fazer Login'}
           </button>
        </div>
      </nav>

      {/* Conteúdo Principal (Layout de duas colunas em telas grandes) */}
      <main className="relative z-10 flex flex-col lg:flex-row items-center justify-between px-8 py-12 max-w-7xl mx-auto gap-16 min-h-[calc(100vh-100px)]">
        
        {/* Lado Esquerdo: Apresentação */}
        <div className="flex-1 text-center lg:text-left space-y-8">
          <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Controle total da sua empresa, <span className="text-transparent bg-clip-text bg-gradient-to-r from-dusky-blue to-lavender-haze">sem complicação.</span>
          </h1>
          <p className="text-xl text-lavender-haze/80 leading-relaxed max-w-2xl mx-auto lg:mx-0">
            Gerencie finanças e estoque em uma única plataforma intuitiva. 
            A solução perfeita para pequenas e médias empresas crescerem de forma organizada.
          </p>
          
          {/* Lista de Benefícios Rápida */}
          <ul className="flex flex-col gap-4 md:flex-row justify-center lg:justify-start text-lavender-haze/90 pt-4">
             <li className="flex items-center gap-2"><CheckCircle2 className="text-dusky-blue" size={20}/> Gestão Financeira</li>
             <li className="flex items-center gap-2"><CheckCircle2 className="text-dusky-blue" size={20}/> Controle de Estoque</li>
             <li className="flex items-center gap-2"><CheckCircle2 className="text-dusky-blue" size={20}/> Dashboards em Tempo Real</li>
          </ul>

          {/* Botão CTA para Mobile (leva ao form) */}
          <div className="lg:hidden pt-8">
             <a href="#auth-form" className="inline-flex items-center gap-2 px-8 py-4 bg-dusky-blue hover:bg-dusky-blue/90 text-white font-bold rounded-full shadow-lg shadow-dusky-blue/30 transition-all">
                Começar Agora <ArrowRight size={20} />
             </a>
          </div>
        </div>

        {/* Lado Direito: Formulário de Login/Registro (Glassmorphism Card) */}
        <div id="auth-form" className="w-full max-w-md lg:w-[450px] shrink-0">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
             
             {/* Brilho superior no card */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50"></div>
             
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-white">
                    {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
                </h2>
                <p className="text-lavender-haze/70 mt-2 text-sm">
                    {isLogin ? 'Acesse seu painel para continuar.' : 'Comece a organizar sua empresa hoje.'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <>
                   <div className="space-y-1">
                    <label className="text-sm font-medium text-lavender-haze ml-1">Nome da Empresa</label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                      className="w-full bg-night-indigo/50 border border-lavender-haze/20 rounded-xl px-4 py-3 text-white placeholder-lavender-haze/30 focus:outline-none focus:ring-2 focus:ring-dusky-blue transition-all"
                      placeholder="Ex: Minha Loja Ltda"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-lavender-haze ml-1">Seu Nome</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full bg-night-indigo/50 border border-lavender-haze/20 rounded-xl px-4 py-3 text-white placeholder-lavender-haze/30 focus:outline-none focus:ring-2 focus:ring-dusky-blue transition-all"
                      placeholder="Ex: João Silva"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-lavender-haze ml-1">E-mail corporativo</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-night-indigo/50 border border-lavender-haze/20 rounded-xl px-4 py-3 text-white placeholder-lavender-haze/30 focus:outline-none focus:ring-2 focus:ring-dusky-blue transition-all"
                  placeholder="nome@empresa.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-lavender-haze ml-1">Senha</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full bg-night-indigo/50 border border-lavender-haze/20 rounded-xl px-4 py-3 text-white placeholder-lavender-haze/30 focus:outline-none focus:ring-2 focus:ring-dusky-blue transition-all"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-dusky-blue to-[#4c7fdb] hover:from-[#5b8ce8] hover:to-dusky-blue text-white font-bold py-4 rounded-xl shadow-lg shadow-dusky-blue/20 transform transition hover:scale-[1.02] active:scale-[0.98] mt-4"
              >
                {isLogin ? 'Acessar Painel' : 'Cadastrar Empresa'}
              </button>
              
              <div className="text-center mt-4">
                <button 
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-lavender-haze/80 hover:text-white transition-colors"
                >
                  {isLogin ? 'Ainda não tem conta? ' : 'Já possui cadastro? '}
                  <span className="text-dusky-blue font-bold underline decoration-2 underline-offset-4">
                    {isLogin ? 'Cadastre-se grátis.' : 'Faça login.'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer simples */}
      <footer className="relative z-10 py-6 text-center text-lavender-haze/40 text-sm">
        <p>© 2025 FinWise Lite. Todos os direitos reservados.</p>
      </footer>

      <Toaster position="top-center" toastOptions={{
        style: {
            background: '#1B003F',
            color: '#E6E6FA',
            border: '1px solid rgba(230, 230, 250, 0.1)'
        }
      }} />
    </div>
  );
};

export default LandingPage;