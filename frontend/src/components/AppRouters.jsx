import React from "react";
import { Routes, Route } from "react-router-dom";
import About from "../pages/About";
import Profile from "../pages/Profile";
import Archive from "../pages/Archive";
import CardList from "./CardList";
import CardForm from "./CardForm";
import Cards from "../pages/cards/Cards";
import CardIdPage from "../pages/cards/CardIdPage";
import SideDetail from "../pages/sides/SideDetail";
import MovementDetail from "../pages/movement/MovementDetail";
import PetitionDetail from "../pages/petitions/PetitionDetail";
import ConsideredDetail from "../pages/considered/ConsideredDetail";
import Layout from './Layout';

const AppRouter = () => {
    return (
        <Routes>
            {/* Оборачиваем все страницы в Layout */}
            <Route path="/" element={<Layout />}>
                <Route index element={<Cards />} /> {/* Главная страница */}
                <Route path="about" element={<About />} />
                <Route path="cards" element={<Cards />} />
                <Route path="profile" element={<Profile />} />
                <Route path="archive" element={<Archive />} />
                <Route path="cards/:id" element={<CardIdPage />} />
                <Route path="business_card" element={<CardForm />} />
                <Route path="business_card/businesscard/" element={<CardList />} />
                <Route path="business_card/businesscard/:id/sidescaseincase/:id" element={<SideDetail />} />
                <Route path="business_card/businesscard/:id/businessmovement/:id" element={<MovementDetail />} />
                <Route path="business_card/businesscard/:id/petitionsincase/:id" element={<PetitionDetail />} />
                <Route path="business_card/businesscard/:id/considered/:id" element={<ConsideredDetail />} />
            </Route>
        </Routes>
    );
};

export default AppRouter;
