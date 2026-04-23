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
import CriminalMovementDetail from "./CriminalCase/CriminalMovementDetail";
import CorrespondenceIn from "./Correspondence/CorrespondenceIn";
import CorrespondenceOut from "./Correspondence/CorrespondenceOut";
import CorrespondenceForm from "./Correspondence/CorrespondenceForm";
import CorrespondenceDetail from "./Correspondence/CorrespondenceDetail";
import LawyerDetails from "../pages/sides/LawyerDetails";
import PersonSearch from "./ParticipantsProcess/PersonSearch";
import CivilDetail from "./CivilCase/CivilDetail";
import CivilDecisionDetail from "./CivilCase/CivilDecisionDetail";
import CivilExecutionDetail from "./CivilCase/CivilExecutionDetail";
import PersonnelPage from '../pages/personnel/PersonnelPage';
import AdministrativeDetail from './AdminCase/AdministrativeDetail';
import AdministrativeDecisionDetail from './AdminCase/AdministrativeDecisionDetail';
import AdministrativeProcedureActionDetail from './AdminCase/AdministrativeProcedureActionDetail';
import SubjectDetail from './AdminCase/SubjectDetail';
import SecurityMeasureDetail from './AdminCase/SecurityMeasureDetail';
import KasDetail from './KasCase/KasDetail';
import KasDecisionDetail from './KasCase/KasDecisionDetail';
import KasExecutionDetail from './KasCase/KasExecutionDetail';
import CriminalExecutionDetail from "./CriminalCase/CriminalExecutionDetail";
import LegalDocuments from './LegalDocument/LegalDocuments';
import DocumentsPage from './Documents/DocumentsPage';
import DocumentFormPage from './Documents/DocumentFormPage';
import DocumentDetailPage from './Documents/DocumentDetailPage';
import CriminalPersonCard from './CriminalCase/CriminalPersonCard';
import OtherMaterialDetail from './OtherMaterials/OtherMaterialDetail';
import OtherMaterialDecisionDetail from './OtherMaterials/OtherMaterialDecisionDetail';
import CriminalCivilClaimDetail from './CriminalCase/CriminalCivilClaimDetail';
import Statistics from './Statistics/Statistics';
import CitizenDashboard from '../pages/Citizen/CitizenDashboard';


const AppRouter = () => {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Cards />} />
                <Route path="about" element={<About />} />
                <Route path="cards" element={<Cards />} />
                <Route path="profile" element={<Profile />} />
                <Route path="archive" element={<Archive />} />
                <Route path="person-search" element={<PersonSearch />} />
                <Route path="hr" element={<PersonnelPage />} />
                <Route path="/legal-documents" element={<LegalDocuments />} />
                <Route path="statistics" element={<Statistics />} />

                <Route index element={<Navigate to="/citizen/dashboard" />} />
                <Route path="dashboard" element={<CitizenDashboard />} />
                <Route path="archive" element={<CitizenDashboard showArchived />} />

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


                {/* ========== УГОЛОВНЫЕ ПРОИЗВОДСТВА ========== */}
                <Route path="criminal-proceedings/:id" element={<CriminalDetail />} />

                <Route path="criminal-proceedings/:proceedingId/petitions/create" element={<PetitionDetail />} />
                <Route path="criminal-proceedings/:proceedingId/petitions/:petitionId" element={<PetitionDetail />} />

                <Route path="criminal-proceedings/:cardId/criminal-case-movement/:moveId" element={<CriminalMovementDetail />} />
                <Route path="criminal-proceedings/:cardId/criminal-case-movement/:moveId/edit" element={<CriminalMovementDetail />} />
                
                <Route path="criminal-proceedings/:proceedingId/criminal-decisions/create" element={<CriminalDecisionDetail />} />
                <Route path="criminal-proceedings/:proceedingId/criminal-decisions/:id" element={<CriminalDecisionDetail />} />
                
                <Route path="/criminal-proceedings/:proceedingId/defendants/create" element={<DefendantDetail />} />
                <Route path="/criminal-proceedings/:proceedingId/defendants/:id" element={<DefendantDetail />} />
                <Route path="/criminal-proceedings/:proceedingId/defendants/:defendantId/person-card" element={<CriminalPersonCard />} />
                
                <Route path="criminal-proceedings/:proceedingId/lawyers-criminal/create" element={<LawyerDetails />} />
                <Route path="criminal-proceedings/:proceedingId/lawyers-criminal/:lawyerId" element={<LawyerDetails />} />
                
                <Route path="criminal-proceedings/:proceedingId/sides-case-in-case/create" element={<SideDetail />} />
                <Route path="criminal-proceedings/:proceedingId/sides-case-in-case/:sideId" element={<SideDetail />} />
                
                <Route path="criminal-proceedings/:proceedingId/executions/create" element={<CriminalExecutionDetail />} />
                <Route path="criminal-proceedings/:proceedingId/executions/:executionId" element={<CriminalExecutionDetail />} />

                <Route path="/criminal-proceedings/:proceedingId/criminal-decisions/:id?" element={<CriminalDecisionDetail />} />
                <Route path="/criminal-proceedings/:proceedingId/civil-claims/:id?" element={<CriminalCivilClaimDetail />} />
                <Route path="/criminal-proceedings/:proceedingId/civil-claims/create" element={<CriminalCivilClaimDetail />} />

                {/* Гражданские иски */}
                <Route path="/criminal-proceedings/:proceedingId/civil-claims/:claimId" element={<CriminalCivilClaimDetail />} />
                <Route path="/criminal-proceedings/:proceedingId/civil-claims/create" element={<CriminalCivilClaimDetail />} />
                
                {/* ========== ГРАЖДАНСКИЕ ПРОИЗВОДСТВА ========== */}
                <Route path="civil-proceedings/:id" element={<CivilDetail />} />
                <Route path="civil-proceedings/create" element={<CivilDetail />} />
                
                <Route path="civil-proceedings/:proceedingId/lawyers/create" element={<LawyerDetails />} />
                <Route path="civil-proceedings/:proceedingId/lawyers/:lawyerId" element={<LawyerDetails />} />
                
                <Route path="civil-proceedings/:proceedingId/movements/create" element={<MovementDetail />} />
                <Route path="civil-proceedings/:proceedingId/movements/:movementId" element={<MovementDetail />} />
                
                <Route path="civil-proceedings/:proceedingId/petitions/create" element={<PetitionDetail />} />
                <Route path="civil-proceedings/:proceedingId/petitions/:petitionId" element={<PetitionDetail />} />

                <Route path="civil-proceedings/:proceedingId/sides/create" element={<SideDetail />} />
                <Route path="civil-proceedings/:proceedingId/sides/:sideId" element={<SideDetail />} />

                <Route path="civil-proceedings/:proceedingId/decisions/create" element={<CivilDecisionDetail />} />
                <Route path="civil-proceedings/:proceedingId/decisions/:decisionId" element={<CivilDecisionDetail />} />

                <Route path="civil-proceedings/:proceedingId/executions/create" element={<CivilExecutionDetail />} />
                <Route path="civil-proceedings/:proceedingId/executions/:executionId" element={<CivilExecutionDetail />} />

                {/* ========== АДМИНИСТРАТИВНЫЕ ПРАВОНАРУШЕНИЯ (КОАП) ========== */}
                <Route path="admin-proceedings/create" element={<AdministrativeDetail />} />
                <Route path="admin-proceedings/:id" element={<AdministrativeDetail />} />

                <Route path="admin-proceedings/:proceedingId/sides/create" element={<SideDetail />} />
                <Route path="admin-proceedings/:proceedingId/sides/:sideId" element={<SideDetail />} />

                <Route path="admin-proceedings/:proceedingId/lawyers/create" element={<LawyerDetails />} />
                <Route path="admin-proceedings/:proceedingId/lawyers/:lawyerId" element={<LawyerDetails />} />

                <Route path="admin-proceedings/:proceedingId/movements/create" element={<MovementDetail />} />
                <Route path="admin-proceedings/:proceedingId/movements/:movementId" element={<MovementDetail />} />

                <Route path="admin-proceedings/:proceedingId/petitions/create" element={<PetitionDetail />} />
                <Route path="admin-proceedings/:proceedingId/petitions/:petitionId" element={<PetitionDetail />} />

                <Route path="admin-proceedings/:proceedingId/decisions/create" element={<AdministrativeDecisionDetail />} />
                <Route path="admin-proceedings/:proceedingId/decisions/:decisionId" element={<AdministrativeDecisionDetail />} />

                <Route path="admin-proceedings/:proceedingId/executions/create" element={<AdministrativeProcedureActionDetail />} />
                <Route path="admin-proceedings/:proceedingId/executions/:executionId" element={<AdministrativeProcedureActionDetail />} />

                {/* Субъекты правонарушения */}
                <Route path="admin-proceedings/:proceedingId/subjects/create" element={<SubjectDetail />} />
                <Route path="admin-proceedings/:proceedingId/subjects/:subjectId" element={<SubjectDetail />} />

                {/* Меры обеспечения */}
                <Route path="admin-proceedings/:proceedingId/security-measures/create" element={<SecurityMeasureDetail />} />
                <Route path="admin-proceedings/:proceedingId/security-measures/:measureId" element={<SecurityMeasureDetail />} />

                {/* ========== АДМИНИСТРАТИВНЫЕ ДЕЛА (КАС РФ) ========== */}
                <Route path="kas-proceedings/create" element={<KasDetail />} />
                <Route path="kas-proceedings/:id" element={<KasDetail />} />

                <Route path="kas-proceedings/:proceedingId/sides/create" element={<SideDetail />} />
                <Route path="kas-proceedings/:proceedingId/sides/:sideId" element={<SideDetail />} />

                <Route path="kas-proceedings/:proceedingId/lawyers/create" element={<LawyerDetails />} />
                <Route path="kas-proceedings/:proceedingId/lawyers/:lawyerId" element={<LawyerDetails />} />

                <Route path="kas-proceedings/:proceedingId/movements/create" element={<MovementDetail />} />
                <Route path="kas-proceedings/:proceedingId/movements/:movementId" element={<MovementDetail />} />

                <Route path="kas-proceedings/:proceedingId/petitions/create" element={<PetitionDetail />} />
                <Route path="kas-proceedings/:proceedingId/petitions/:petitionId" element={<PetitionDetail />} />

                <Route path="kas-proceedings/:proceedingId/decisions/create" element={<KasDecisionDetail />} />
                <Route path="kas-proceedings/:proceedingId/decisions/:decisionId" element={<KasDecisionDetail />} />

                <Route path="kas-proceedings/:proceedingId/executions/create" element={<KasExecutionDetail />} />
                <Route path="kas-proceedings/:proceedingId/executions/:executionId" element={<KasExecutionDetail />} />

                {/* ========== ИНЫЕ МАТЕРИАЛЫ (ИНДЕКС 15) ========== */}
                <Route path="other-materials/create" element={<OtherMaterialDetail />} />
                <Route path="other-materials/:id" element={<OtherMaterialDetail />} />

                {/* Стороны (участники) - используем SideDetail, он уже работает */}
                <Route path="other-materials/:materialId/sides/create" element={<SideDetail />} />
                <Route path="other-materials/:materialId/sides/:sideId" element={<SideDetail />} />

                {/* Представители - используем LawyerDetails */}
                <Route path="other-materials/:materialId/lawyers/create" element={<LawyerDetails />} />
                <Route path="other-materials/:materialId/lawyers/:lawyerId" element={<LawyerDetails />} />

                {/* Решения по иным материалам */}
                <Route path="other-materials/:materialId/decisions/create" element={<OtherMaterialDecisionDetail />} />
                <Route path="other-materials/:materialId/decisions/:decisionId" element={<OtherMaterialDecisionDetail />} />

                {/* Документы по иным материалам */}
                <Route path="other-materials/:materialId/documents" 
                    element={<DocumentsPage caseType="other" />} />
                <Route path="other-materials/:materialId/documents/create" 
                    element={<DocumentFormPage caseType="other" />} />
                <Route path="other-materials/:materialId/documents/:documentId" 
                    element={<DocumentDetailPage caseType="other" />} />
                <Route path="other-materials/:materialId/documents/:documentId/edit" 
                    element={<DocumentFormPage caseType="other" isEdit={true} />} />
            </Route>
        </Routes>
    );
};

export default AppRouter;