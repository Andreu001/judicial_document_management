import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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
import CivilExecutionDetail from "./CivilCase/CivilExecutionDetail";
import PersonnelPage from '../pages/personnel/PersonnelPage';
import AdministrativeDetail from './AdminCase/AdministrativeDetail';
import AdministrativeSideDetail from './AdminCase/AdministrativeSideDetail';
import AdministrativeDecisionDetail from './AdminCase/AdministrativeDecisionDetail';
import AdministrativeProcedureActionDetail from './AdminCase/AdministrativeProcedureActionDetail';
import KasDetail from './KasCase/KasDetail';
import KasSideDetail from './KasCase/KasSideDetail';
import KasDecisionDetail from './KasCase/KasDecisionDetail';
import KasExecutionDetail from './KasCase/KasExecutionDetail';
import CriminalExecutionDetail from "./CriminalCase/CriminalExecutionDetail";
import LegalDocuments from './LegalDocument/LegalDocuments';
import DocumentsPage from './Documents/DocumentsPage';
import DocumentFormPage from './Documents/DocumentFormPage';
import DocumentDetailPage from './Documents/DocumentDetailPage';



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
                {/* Новый маршрут для правовых документов */}
                <Route path="/legal-documents" element={<LegalDocuments />} />
                
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

                {/* ========== ДОКУМЕНТЫ ПО ДЕЛАМ ========== */}

                {/* Уголовные дела */}
                <Route path="criminal-proceedings/:proceedingId/documents" 
                    element={<DocumentsPage caseType="criminal" />} />
                <Route path="criminal-proceedings/:proceedingId/documents/create" 
                    element={<DocumentFormPage caseType="criminal" />} />
                <Route path="criminal-proceedings/:proceedingId/documents/:documentId" 
                    element={<DocumentDetailPage caseType="criminal" />} />
                <Route path="criminal-proceedings/:proceedingId/documents/:documentId/edit" 
                    element={<DocumentFormPage caseType="criminal" isEdit={true} />} />

                {/* Гражданские дела */}
                <Route path="civil-proceedings/:proceedingId/documents" 
                    element={<DocumentsPage caseType="civil" />} />
                <Route path="civil-proceedings/:proceedingId/documents/create" 
                    element={<DocumentFormPage caseType="civil" />} />
                <Route path="civil-proceedings/:proceedingId/documents/:documentId" 
                    element={<DocumentDetailPage caseType="civil" />} />
                <Route path="civil-proceedings/:proceedingId/documents/:documentId/edit" 
                    element={<DocumentFormPage caseType="civil" isEdit={true} />} />

                {/* Административные правонарушения (КОАП) */}
                <Route path="admin-proceedings/:proceedingId/documents" 
                    element={<DocumentsPage caseType="admin" />} />
                <Route path="admin-proceedings/:proceedingId/documents/create" 
                    element={<DocumentFormPage caseType="admin" />} />
                <Route path="admin-proceedings/:proceedingId/documents/:documentId" 
                    element={<DocumentDetailPage caseType="admin" />} />
                <Route path="admin-proceedings/:proceedingId/documents/:documentId/edit" 
                    element={<DocumentFormPage caseType="admin" isEdit={true} />} />

                {/* Административные дела (КАС) */}
                <Route path="kas-proceedings/:proceedingId/documents" 
                    element={<DocumentsPage caseType="kas" />} />
                <Route path="kas-proceedings/:proceedingId/documents/create" 
                    element={<DocumentFormPage caseType="kas" />} />
                <Route path="kas-proceedings/:proceedingId/documents/:documentId" 
                    element={<DocumentDetailPage caseType="kas" />} />
                <Route path="kas-proceedings/:proceedingId/documents/:documentId/edit" 
                    element={<DocumentFormPage caseType="kas" isEdit={true} />} />


                {/* Уголовные производства */}
                <Route path="criminal-proceedings/:id" element={<CriminalDetail />} />

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
                {/* Исполнение */}
                <Route path="criminal-proceedings/:proceedingId/executions/create" element={<CriminalExecutionDetail />} />
                <Route path="criminal-proceedings/:proceedingId/executions/:executionId" element={<CriminalExecutionDetail />} />

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

                {/* Процессуальные действия */}
                <Route path="civil-proceedings/:proceedingId/executions/create" element={<CivilExecutionDetail />} />
                <Route path="civil-proceedings/:proceedingId/executions/:executionId" element={<CivilExecutionDetail />} />

                {/* ========== Административные правонарушения (AdminProceedings) ========== */}
                {/* Основная карточка дела (создание, просмотр, редактирование) */}
                <Route path="admin-proceedings/create" element={<AdministrativeDetail />} />
                <Route path="admin-proceedings/:id" element={<AdministrativeDetail />} />

                {/* Стороны по административному делу (переиспользуем существующий AdminSideDetail) */}
                <Route path="admin-proceedings/:proceedingId/sides/create" element={<AdministrativeSideDetail />} />
                <Route path="admin-proceedings/:proceedingId/sides/:sideId" element={<AdministrativeSideDetail />} />

                {/* Защитники/представители (переиспользуем LawyerDetails) */}
                <Route path="admin-proceedings/:proceedingId/lawyers/create" element={<LawyerDetails />} />
                <Route path="admin-proceedings/:proceedingId/lawyers/:lawyerId" element={<LawyerDetails />} />

                {/* Движение административного дела (переиспользуем MovementDetail) */}
                <Route path="admin-proceedings/:proceedingId/movements/create" element={<MovementDetail />} />
                <Route path="admin-proceedings/:proceedingId/movements/:movementId" element={<MovementDetail />} />

                {/* Ходатайства по административному делу (переиспользуем PetitionDetail) */}
                <Route path="admin-proceedings/:proceedingId/petitions/create" element={<PetitionDetail />} />
                <Route path="admin-proceedings/:proceedingId/petitions/:petitionId" element={<PetitionDetail />} />

                {/* Решения по административному делу (свой компонент AdminDecisionDetail) */}
                <Route path="admin-proceedings/:proceedingId/decisions/create" element={<AdministrativeDecisionDetail />} />
                <Route path="admin-proceedings/:proceedingId/decisions/:decisionId" element={<AdministrativeDecisionDetail />} />

                {/* Исполнение по административному делу (свой компонент AdminProcedureActionDetail) */}
                <Route path="admin-proceedings/:proceedingId/executions/create" element={<AdministrativeProcedureActionDetail />} />
                <Route path="admin-proceedings/:proceedingId/executions/:executionId" element={<AdministrativeProcedureActionDetail />} />
                {/* ========== Административные дела (КАС РФ) ========== */}
                {/* Основная карточка дела (создание, просмотр, редактирование) */}
                <Route path="kas-proceedings/create" element={<KasDetail />} />
                <Route path="kas-proceedings/:id" element={<KasDetail />} />

                {/* Стороны по административному делу */}
                <Route path="kas-proceedings/:proceedingId/sides/create" element={<KasSideDetail />} />
                <Route path="kas-proceedings/:proceedingId/sides/:sideId" element={<KasSideDetail />} />

                {/* Представители */}
                <Route path="kas-proceedings/:proceedingId/lawyers/create" element={<LawyerDetails />} />
                <Route path="kas-proceedings/:proceedingId/lawyers/:lawyerId" element={<LawyerDetails />} />

                {/* Движение административного дела */}
                <Route path="kas-proceedings/:proceedingId/movements/create" element={<MovementDetail />} />
                <Route path="kas-proceedings/:proceedingId/movements/:movementId" element={<MovementDetail />} />

                {/* Ходатайства по административному делу */}
                <Route path="kas-proceedings/:proceedingId/petitions/create" element={<PetitionDetail />} />
                <Route path="kas-proceedings/:proceedingId/petitions/:petitionId" element={<PetitionDetail />} />

                {/* Решения по административному делу */}
                <Route path="kas-proceedings/:proceedingId/decisions/create" element={<KasDecisionDetail />} />
                <Route path="kas-proceedings/:proceedingId/decisions/:decisionId" element={<KasDecisionDetail />} />

                {/* Исполнение по административному делу */}
                <Route path="kas-proceedings/:proceedingId/executions/create" element={<KasExecutionDetail />} />
                <Route path="kas-proceedings/:proceedingId/executions/:executionId" element={<KasExecutionDetail />} />
            </Route>
        </Routes>
    );
};

export default AppRouter;