import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard'; // <--- Importando o Dashboard Real!
import Transactions from './pages/Transactions'; // <--- Import Transactions page
import Inventory from './pages/Inventory'; // <--- Import Inventory page
import Categories from './pages/Categories';
import Reports from './pages/Reports';
import Messages from './pages/Messages';
import Settings from './pages/Settings';

// Componente para proteger a rota (só entra se tiver token)
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/" />;
};

function App() {
  // Checagem simples para não mostrar login se já estiver logado
  const isLogged = Boolean(localStorage.getItem('token'));

  return (
    <BrowserRouter>
      <Routes>
        {/* Se tentar ir para a raiz e já estiver logado, joga pro Dashboard. Se não, mostra LandingPage */}
        <Route path="/" element={isLogged ? <Navigate to="/dashboard" /> : <LandingPage />} />
        
        {/* Rota Protegida: Agora carrega o Dashboard REAL */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />

        <Route path="/transactions" element={
          <PrivateRoute>
            <Transactions />
          </PrivateRoute>
        } />
        <Route path="/reports" element={
          <PrivateRoute>
            <Reports />
          </PrivateRoute>
        } />
        <Route path="/messages" element={
          <PrivateRoute>
            <Messages />
          </PrivateRoute>
        } />
        <Route path="/categories" element={
          <PrivateRoute>
            <Categories />
          </PrivateRoute>
        } />
        <Route path="/inventory" element={
          <PrivateRoute>
            <Inventory />
          </PrivateRoute>
        } />
        <Route path="/settings" element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        } />
        
        {/* Qualquer rota desconhecida volta para o início */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;