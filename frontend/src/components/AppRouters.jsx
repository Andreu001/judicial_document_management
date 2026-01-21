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
import DefendantDetail from "./CriminalCase//DefendantDetail";
import CriminalDetail from "./CriminalCase//CriminalDetail";
import CriminalDecisionDetail from "./CriminalCase//CriminalDecisionDetail";
import CorrespondenceIn from "./Correspondence/CorrespondenceIn";
import CorrespondenceOut from "./Correspondence/CorrespondenceOut";
import CorrespondenceForm from "./Correspondence/CorrespondenceForm";
import CorrespondenceDetail from "./Correspondence/CorrespondenceDetail";
import LawyerDetails from "../pages/sides/LawyerDetails";

const AppRouter = () => {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Cards />} /> {/* Главная страница */}
                <Route path="about" element={<About />} />
                <Route path="cards" element={<Cards />} />
                <Route path="profile" element={<Profile />} />
                <Route path="archive" element={<Archive />} />
                
                {/* Входящая корреспонденция */}
                <Route path="/in" element={<CorrespondenceIn />} />
                <Route path="/in/new" element={<CorrespondenceForm />} />
                <Route path="/in/:id" element={<CorrespondenceDetail />} />
                <Route path="/in/:id/edit" element={<CorrespondenceForm mode="edit" />} />
                                
                {/* Исходящая корреспонденция */}
                <Route path="/out" element={<CorrespondenceOut />} />
                <Route path="/out/new" element={<CorrespondenceForm />} />
                <Route path="/out/:id" element={<CorrespondenceDetail />} />
                <Route path="/out/:id/edit" element={<CorrespondenceForm mode="edit" />} />
                
                <Route path="cards/:id" element={<CardIdPage />} />
                <Route path="business_card" element={<CardForm />} />
                <Route path="business_card/businesscard/" element={<CardList />} />
                <Route path="business_card/businesscard/:id/sidescaseincase/:id" element={<SideDetail />} />
                <Route path="/businesscard/:cardId/sides/:sideId" element={<SideDetail />} />
                <Route path="business_card/businesscard/:cardId/businessmovement/:movementId"  element={<MovementDetail />} />
                <Route path="business_card/businesscard/:cardId/petitionsincase/:petitionId" element={<PetitionDetail />} />
                <Route path="business_card/businesscard/:id/considered/:id" element={<ConsideredDetail />} />
                <Route path="/cases/:businesscardId/defendants/:defendantId/details" element={<DefendantDetail />} />
                <Route path="/businesscard/:cardId/criminal-details" element={<CriminalDetail />} />
                <Route path="/businesscard/:cardId/criminal-decisions/:decisionId" element={<CriminalDecisionDetail />} />
                <Route path="/cases/:businesscardId/lawyers/:lawyerId" element={<LawyerDetails />} />
            </Route>
        </Routes>
    );
};

export default AppRouter;
