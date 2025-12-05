import React, { useState } from 'react';
import { AxiosError } from 'axios';
import api from '../services/api';
// import { useNavigate } from 'react-router-dom'; // Comentei pois não vamos usar agora
import toast, { Toaster } from 'react-hot-toast';

// Define o formato da resposta de erro da API
interface ApiErrorResponse {
  message: string;
}

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  // const navigate = useNavigate(); // Comentei para sumir o erro de "não usado"

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
    const endpoint = isLogin ? '/login' : '/register';
    
    try {
      const response = await api.post(`/auth${endpoint}`, formData);
      
      if (isLogin) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success('Login realizado com sucesso!');
        // Aqui futuramente vamos descomentar: navigate('/dashboard');
      } else {
        toast.success('Conta criada! Faça login agora.');
        setIsLogin(true);
      }
    } catch (err) {
      // Tratamento de erro tipado corretamente
      const error = err as AxiosError<ApiErrorResponse>;
      const errorMessage = error.response?.data?.message || 'Erro ao conectar com o servidor';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2d0b44] via-[#3b1257] to-[#1a0529] p-4 font-sans text-white relative overflow-hidden">
      
      <div className="absolute top-10 left-10 w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="flex flex-col md:flex-row w-full max-w-4xl bg-white/5 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/10 overflow-hidden relative z-10">
        
        <div className="hidden md:flex flex-col justify-center p-12 w-1/2 bg-gradient-to-br from-white/5 to-transparent relative">
          <div className="absolute top-8 left-8">
            <div className="h-8 w-8 bg-white rounded-sm opacity-80"></div>
            <div className="h-8 w-3 bg-white/50 rounded-sm ml-10 -mt-8"></div>
          </div>
          
          <h1 className="text-5xl font-bold mb-6 tracking-tight">Bem-Vindo!</h1>
          <p className="text-gray-300 mb-8 leading-relaxed">
            Controle suas finanças e estoque em um único lugar. 
            Simples, rápido e eficiente. O FinWise Lite ajuda sua empresa a crescer.
          </p>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="w-max px-6 py-2 border border-white/30 rounded-full text-sm hover:bg-white/10 transition-colors"
          >
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
          </button>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-12 bg-white/10 backdrop-blur-md relative">
          
          <h2 className="text-3xl font-bold text-center mb-8 relative z-10">
            {isLogin ? 'Log-in' : 'Cadastre-se'}
            <div className="h-1 w-12 bg-white mt-2 mx-auto rounded-full opacity-50"></div>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            
            {!isLogin && (
              <>
                 <div className="space-y-2">
                  <label className="text-sm font-medium ml-1">Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                    placeholder="Minha Empresa Ltda"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium ml-1">User Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                    placeholder="Seu Nome"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium ml-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium ml-1">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold py-3 rounded-full shadow-lg transform transition hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLogin ? 'Login' : 'Create Account'}
            </button>
            
            <div className="md:hidden text-center mt-4">
              <button 
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-gray-300 hover:text-white underline"
              >
                {isLogin ? 'Criar conta' : 'Fazer login'}
              </button>
            </div>
          </form>

          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-purple-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
        </div>
      </div>

      <Toaster position="top-right" />
    </div>
  );
};

export default Login;