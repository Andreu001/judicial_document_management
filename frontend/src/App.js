import {BrowserRouter} from "react-router-dom";
import './styles/App.css'
import { AuthProvider } from './context/AuthContext';
import Navbar from "./components/UI/Navbar/Navbar";
import AppRouter from "./components/AppRouters";


function App() {
	return (
    <AuthProvider>
			<BrowserRouter>
				<Navbar/>
				<AppRouter/>
			</BrowserRouter>
    </AuthProvider>  
	)
}

export default App;



/* import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sides from './components/Sides';
import SideDetail from './components/SideDetail';
import Home from './components/Home';
import AddBusinessCard from './components/AddBusinessCard';
import Login from './components/Login';
import DjangoAdmin from './components/DjangoAdmin';




const App = () => {
  return (
    <Router>
      <Routes>
	  	<Route path="/" element={<Home />} />
        <Route path="/sides" element={<Sides />} />
        <Route path="/sides/:id" element={<SideDetail />} />
        <Route path="/business_card/" element={<AddBusinessCard />} />
        <Route path="/auth/login/" element={<Login />} />
        <Route path="/admin/" element={<DjangoAdmin />} />
      </Routes>
    </Router>
  );
};

export default App;
*/