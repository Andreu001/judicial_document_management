import React from "react";
import { Routes, Route } from "react-router-dom";
import About from "../pages/About";
import Profile from "../pages/Profile";
import Archive from "../pages/Archive";
import CardList from "./CardList";
import Cards from "../pages/cards/Cards";
import CardIdPage from "../pages/cards/CardIdPage";
import SideDetail from "../pages/sides/SideDetail";
import MovementDetail from "../pages/movement/MovementDetail";
import PetitionDetail from "../pages/petitions/PetitionDetail";
import ConsideredDetail from "../pages/considered/ConsideredDetail";
import Layout from './Layout';
import DefendantDetail from "./CriminalCase/DefendantDetail";
import CriminalCaseForm from "./CriminalCase/CriminalCaseForm";
import CriminalDetail from "./CriminalCase/CriminalDetail";
import CriminalDecisionDetail from "./CriminalCase/CriminalDecisionDetail";
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
import CivilDetail from "./CivilCase/CivilDetail";
import CivilSideDetail from "./CivilCase/CivilSideDetail";
import CivilDecisionDetail from "./CivilCase/CivilDecisionDetail";
import CivilProcedureActionDetail from "./CivilCase/CivilProcedureActionDetail";
import PersonnelPage from '../pages/personnel/PersonnelPage';

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
                <Route path="hr" element={<PersonnelPage />} />
                
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
                <Route path="business_card/businesscard/" element={<CardList />} />

                <Route path="business_card/businesscard/:id/sidescaseincase/:id" element={<SideDetail />} />
                <Route path="/businesscard/:cardId/sides/:sideId" element={<SideDetail />} />
                <Route path="business_card/businesscard/:id/considered/:id" element={<ConsideredDetail />} />


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
                <Route path="civil-proceedings/:id" element={<CivilDetail />} />
                <Route path="civil-proceedings/create" element={<CivilDetail />} />
                {/*Гражданские Адвокаты */}
                <Route path="civil-proceedings/:proceedingId/lawyers/create" element={<LawyerDetails  />} />
                <Route path="civil-proceedings/:proceedingId/lawyers/:lawyerId" element={<LawyerDetails  />} />
                {/* Гражданские Движение */}
                <Route path="civil-proceedings/:proceedingId/movements/create" element={<MovementDetail  />} />
                <Route path="civil-proceedings/:proceedingId/movements/:movementId" element={<MovementDetail  />} />
                {/* Гражданские ходатайства */}
                <Route path="civil-proceedings/:proceedingId/petitions/create" element={<PetitionDetail />} />
                <Route path="civil-proceedings/:proceedingId/petitions/:petitionId" element={<PetitionDetail />} />

                {/* Стороны по гражданскому делу */}
                <Route path="civil-proceedings/:proceedingId/sides/create" element={<CivilSideDetail />} />
                <Route path="civil-proceedings/:proceedingId/sides/:sideId" element={<CivilSideDetail />} />

                {/* Решения по гражданскому делу */}
                <Route path="civil-proceedings/:proceedingId/decisions/create" element={<CivilDecisionDetail />} />
                <Route path="civil-proceedings/:proceedingId/decisions/:decisionId" element={<CivilDecisionDetail />} />
                <Route path="civil-proceedings/:proceedingId/decisions/:decisionId/edit" element={<CivilDecisionDetail />} />

                {/* Процессуальные действия */}
                <Route path="civil-proceedings/:proceedingId/procedure-actions/create" element={<CivilProcedureActionDetail />} />
                <Route path="civil-proceedings/:proceedingId/procedure-actions/:actionId" element={<CivilProcedureActionDetail />} />
                <Route path="civil-proceedings/:proceedingId/procedure-actions/:actionId/edit" element={<CivilProcedureActionDetail />} />
            </Route>
        </Routes>
    );
};

export default AppRouter;