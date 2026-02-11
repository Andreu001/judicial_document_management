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
import CriminalCaseForm from "./CriminalCase//CriminalCaseForm";
import CriminalDetail from "./CriminalCase//CriminalDetail";
import CriminalDecisionDetail from "./CriminalCase//CriminalDecisionDetail";
import CriminalLawyerDetails from "./CriminalCase/CriminalLawyerDetails";
import CriminalSideDetails from "./CriminalCase/CriminalSideDetails";
import CriminalMovementDetail from "./CriminalCase/CriminalMovementDetail";
import PetitionCriminal from "./CriminalCase/PetitionCriminal";
import CorrespondenceIn from "./Correspondence/CorrespondenceIn";
import CorrespondenceOut from "./Correspondence/CorrespondenceOut";
import CorrespondenceForm from "./Correspondence/CorrespondenceForm";
import CorrespondenceDetail from "./Correspondence/CorrespondenceDetail";
import LawyerDetails from "../pages/sides/LawyerDetails";
import PersonSearch from "./ParticipantsProcess/PersonSearch";
import CivilDecisionDetail from "./CivilCase//CivilDecisionDetail";
import CivilDetail from "./CivilCase/CivilDetail";

const AppRouter = () => {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Cards />} /> {/* Главная страница */}
                <Route path="about" element={<About />} />
                <Route path="cards" element={<Cards />} />
                <Route path="profile" element={<Profile />} />
                <Route path="archive" element={<Archive />} />
                <Route path="person-search" element={<PersonSearch />} />
                
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

                <Route path="business_card/businesscard/:businesscardId/lawyers/:lawyerId" element={<LawyerDetails />} />

                {/* Уголовные производства */}
                <Route path="criminal-proceedings/create" element={<CriminalCaseForm />} />
                <Route path="criminal-proceedings/:id" element={<CriminalDetail />} />
                <Route path="criminal-proceedings/:id/edit" element={<CriminalCaseForm />} />

                <Route path="criminal-proceedings/:proceedingId/petitions/create" element={<PetitionCriminal />} />
                <Route path="criminal-proceedings/:proceedingId/petitions/:petitionId" element={<PetitionCriminal />} />
                <Route path="criminal-proceedings/:proceedingId/petitions/:petitionId/edit" element={<PetitionCriminal />} />

                {/* Движение уголовного дела */}
                <Route path="criminal-proceedings/:cardId/criminal-case-movement/:moveId" element={<CriminalMovementDetail />} />
                <Route path="criminal-proceedings/:cardId/criminal-case-movement/:moveId/edit" element={<CriminalMovementDetail />} />
                
                {/* Уголовные решения */}
                <Route path="criminal-proceedings/:proceedingId/criminal-decisions/create" element={<CriminalDecisionDetail />} />
                <Route path="criminal-proceedings/:proceedingId/criminal-decisions/:id" element={<CriminalDecisionDetail />} />
                
                {/* Подсудимые */}
                <Route path="/criminal-proceedings/:proceedingId/defendants/create" element={<DefendantDetail />} />
                <Route path="/criminal-proceedings/:proceedingId/defendants/:id" element={<DefendantDetail />} />
                
                {/* Адвокаты */}
                <Route path="criminal-proceedings/:proceedingId/lawyers-criminal/create" element={<CriminalLawyerDetails />} />
                <Route path="criminal-proceedings/:proceedingId/lawyers-criminal/:lawyerId" element={<CriminalLawyerDetails />} />
                
                {/* Стороны */}
                <Route path="criminal-proceedings/:proceedingId/sides-case-in-case/create" element={<CriminalSideDetails />} />
                <Route path="criminal-proceedings/:proceedingId/sides-case-in-case/:sideId" element={<CriminalSideDetails />} />

                {/* Гражданское судопроизводство */}
                <Route path="/businesscard/:cardId/civil-details" element={<CivilDetail />} />
                <Route path="/businesscard/:cardId/civil-decisions/:decisionId" element={<CivilDecisionDetail />} />
            </Route>
        </Routes>
    );
};

export default AppRouter;