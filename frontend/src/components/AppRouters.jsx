import React from "react";
import {Routes, Route} from "react-router-dom";
import About from "../pages/About";
import Cards from "../pages/Cards";
import CardIdPage from "../pages/CardIdPage";
import CardList from "./CardList";
import CardForm from "./CardForm";

const AppRouter = () => {
    return (
        <Routes>
            <Route path="/about" element={<About/>} />
            <Route path="/cards" element={<Cards/>} />
            <Route path="/cards/:id" element={<CardIdPage/>} />
            <Route path="/business_card" element={<CardForm/>} />
            <Route path="/business_card/businesscard/" element={<CardList/>} />
        </Routes>
    )

}

export default AppRouter;