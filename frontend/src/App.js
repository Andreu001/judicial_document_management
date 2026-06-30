// App.js
import { BrowserRouter } from "react-router-dom";
import './styles/App.css';
import { AuthProvider } from './context/AuthContext';
import { SideAuthProvider } from './context/SideAuthContext';
import AppRouter from "./components/AppRouters";
import Navbar from "./components/UI/Navbar/Navbar";

function App() {
  return (
    <AuthProvider>
      <SideAuthProvider>
        <BrowserRouter>
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Navbar /> {/* Навбар слева */}
            <div className="main-content"> {/* Основной контент с отступом */}
              <AppRouter />
            </div>
          </div>
        </BrowserRouter>
      </SideAuthProvider>
    </AuthProvider>
  );
}

export default App;