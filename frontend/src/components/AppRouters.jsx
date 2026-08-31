import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { useSideAuth } from '../context/SideAuthContext';
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
import CriminalCasesPage from './CaseCategories/CriminalCasesPage';
import CivilCasesPage from './CaseCategories/CivilCasesPage';
import AdministrativeCasesPage from './CaseCategories/AdministrativeCasesPage';
import AdminOffensesPage from './CaseCategories/AdminOffensesPage';
import SideProfile from './SideAuth/SideProfile';
import OAuthCallbackHandler from './SideAuth/OAuthCallbackHandler';
import CaseDetailView from './SideAuth/CaseDetailView';
import DocumentsViewPage from './SideAuth/DocumentsViewPage';
import SidePetitionForm from './SideAuth/SidePetitionForm';
import PartyDocumentsPage from './Documents/PartyDocumentsPage';
import PartyDocumentForm from './Documents/PartyDocumentForm';
import PartyDocumentDetailPage from './Documents/PartyDocumentDetailPage';
import SideClaimForm from './SideAuth/SideClaimForm';
import CasePetitionsView from './SideAuth/CasePetitionsView';
import CasePartyDocumentsView from './SideAuth/CasePartyDocumentsView';
import CaseAudioView from './SideAuth/CaseAudioView';

// Court Registry pages
import CourtRegistryDashboard from '../components/CourtRegistry/CourtRegistryDashboard';
import CourtList from '../components/CourtRegistry/Courts/CourtList';
import CourtDetail from '../components/CourtRegistry/Courts/CourtDetail';
import CourtForm from '../components/CourtRegistry/Courts/CourtForm';
import TransferList from '../components/CourtRegistry/Transfers/TransferList';
import TransferDetail from '../components/CourtRegistry/Transfers/TransferDetail';
import TransferForm from '../components/CourtRegistry/Transfers/TransferForm';
import NotificationList from '../components/CourtRegistry/Notifications/NotificationList';
import PendingTransferList from '../components/CourtRegistry/PendingTransfers/PendingTransferList';
import VCSList from '../components/CourtRegistry/VCS/VCSList';
import VCSDetail from '../components/CourtRegistry/VCS/VCSDetail';
import VCSForm from '../components/CourtRegistry/VCS/VCSForm';
import MessengerRegistration from '../components/CourtRegistry/Messenger/MessengerRegistration';
import AuditLog from '../components/CourtRegistry/Audit/AuditLog';
import DepartmentList from '../components/CourtRegistry/Departments/DepartmentList';
import DepartmentForm from '../components/CourtRegistry/Departments/DepartmentForm';
import EmployeeList from '../components/CourtRegistry/Employees/EmployeeList';
import EmployeeForm from '../components/CourtRegistry/Employees/EmployeeForm';

import Messenger from './Messenger/MessengerApp';
import CaseDistributionPage from '../components/CaseDistribution/CaseDistributionPage';


// Компонент для защиты маршрутов только для сотрудников суда
const JudgeRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { isAuthenticated: isSideAuth } = useSideAuth();
  
  // Если авторизована сторона - редирект на мои дела
  if (isSideAuth()) {
    return <Navigate to="/my-cases" replace />;
  }
  
  // Если не авторизован сотрудник - редирект на главную
  if (!isAuthenticated()) {
    return <Navigate to="/cards" replace />;
  }
  
  return children;
};

// Компонент для защиты маршрутов только для сторон
const SideRoute = ({ children }) => {
  const { isAuthenticated: isSideAuth } = useSideAuth();
  
  if (!isSideAuth()) {
    return <Navigate to="/cards" replace />;
  }
  
  return children;
};

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Публичные маршруты */}
        <Route index element={<Cards />} />
        <Route path="about" element={<About />} />
        <Route path="cards" element={<Cards />} />
        <Route path="archive" element={<Archive />} />
        <Route path="legal-documents" element={<LegalDocuments />} />
        <Route path="/civil-claim/new" element={
          <SideRoute>
            <SideClaimForm />
          </SideRoute>
        } />
        <Route path="/civil-claim/:caseType/:caseId" element={<SideClaimForm />} />
        <Route path="messenger" element={
          <JudgeRoute>
            <Messenger onClose={() => window.history.back()} />
          </JudgeRoute>
        } />

        <Route path="case-distribution" element={
          <JudgeRoute>
            <CaseDistributionPage />
          </JudgeRoute>
        } />

        {/* ================================================================= */}
        {/* Реестр судов — Court Registry */}
        {/* ================================================================= */}
        <Route path="court-registry" element={
          <JudgeRoute>
            <CourtRegistryDashboard />
          </JudgeRoute>
        } />
        <Route path="court-registry/courts" element={
          <JudgeRoute>
            <CourtList />
          </JudgeRoute>
        } />
        <Route path="court-registry/courts/new" element={
          <JudgeRoute>
            <CourtForm />
          </JudgeRoute>
        } />
        <Route path="court-registry/courts/:id" element={
          <JudgeRoute>
            <CourtDetail />
          </JudgeRoute>
        } />
        <Route path="court-registry/courts/:id/edit" element={
          <JudgeRoute>
            <CourtForm />
          </JudgeRoute>
        } />
        <Route path="court-registry/transfers" element={
          <JudgeRoute>
            <TransferList />
          </JudgeRoute>
        } />
        <Route path="court-registry/transfers/new" element={
          <JudgeRoute>
            <TransferForm />
          </JudgeRoute>
        } />
        <Route path="court-registry/transfers/:id" element={
          <JudgeRoute>
            <TransferDetail />
          </JudgeRoute>
        } />
        <Route path="court-registry/notifications" element={
          <JudgeRoute>
            <NotificationList />
          </JudgeRoute>
        } />
        <Route path="court-registry/pending-transfers" element={
          <JudgeRoute>
            <PendingTransferList />
          </JudgeRoute>
        } />
        <Route path="court-registry/vcs" element={
          <JudgeRoute>
            <VCSList />
          </JudgeRoute>
        } />
        <Route path="court-registry/vcs/new" element={
          <JudgeRoute>
            <VCSForm />
          </JudgeRoute>
        } />
        <Route path="court-registry/vcs/:id" element={
          <JudgeRoute>
            <VCSDetail />
          </JudgeRoute>
        } />
        <Route path="court-registry/messenger" element={
          <JudgeRoute>
            <MessengerRegistration />
          </JudgeRoute>
        } />
        <Route path="court-registry/audit" element={
          <JudgeRoute>
            <AuditLog />
          </JudgeRoute>
        } />
        <Route path="court-registry/departments" element={
          <JudgeRoute>
            <DepartmentList />
          </JudgeRoute>
        } />
        <Route path="court-registry/departments/new" element={
          <JudgeRoute>
            <DepartmentForm />
          </JudgeRoute>
        } />
        <Route path="court-registry/departments/:id" element={
          <JudgeRoute>
            <DepartmentForm />
          </JudgeRoute>
        } />
        <Route path="court-registry/departments/:id/edit" element={
          <JudgeRoute>
            <DepartmentForm isEdit={true} />
          </JudgeRoute>
        } />

        <Route path="court-registry/employees" element={
          <JudgeRoute>
            <EmployeeList />
          </JudgeRoute>
        } />
        <Route path="court-registry/employees/new" element={
          <JudgeRoute>
            <EmployeeForm />
          </JudgeRoute>
        } />
        <Route path="court-registry/employees/:id" element={
          <JudgeRoute>
            <EmployeeForm />
          </JudgeRoute>
        } />
        <Route path="court-registry/employees/:id/edit" element={
          <JudgeRoute>
            <EmployeeForm isEdit={true} />
          </JudgeRoute>
        } />
        {/* Маршруты для стороны (участники процесса) */}
        <Route path="my-cases" element={
          <SideRoute>
            <SideProfile />
          </SideRoute>
        } />
        <Route path="/case-audio/:caseType/:caseId" element={<CaseAudioView />} />
        <Route path="/case-view/:caseType/:caseId" element={<SideRoute><CaseDetailView /></SideRoute>} />
        <Route path="/documents/:caseType/:caseId" element={<SideRoute><DocumentsViewPage /></SideRoute>} />
        <Route path="side_case/oauth-callback/" element={<OAuthCallbackHandler />} />

        <Route path="/side-petition/:caseType/:caseId" element={<SidePetitionForm />} />
        <Route path="/case-documents/:caseType/:caseId" element={
          <SideRoute>
            <DocumentsViewPage />
          </SideRoute>
        } />
        <Route path="/case-petitions/:caseType/:caseId" element={
          <SideRoute>
            <CasePetitionsView />
          </SideRoute>
        } />
        <Route path="/case-party-documents/:caseType/:caseId" element={
          <SideRoute>
            <CasePartyDocumentsView />
          </SideRoute>
        } />

        {/* Маршруты только для сотрудников суда */}
        <Route path="profile" element={
          <JudgeRoute>
            <Profile />
          </JudgeRoute>
        } />
        <Route path="person-search" element={
          <JudgeRoute>
            <PersonSearch />
          </JudgeRoute>
        } />
        <Route path="hr" element={
          <JudgeRoute>
            <PersonnelPage />
          </JudgeRoute>
        } />
        <Route path="statistics" element={
          <JudgeRoute>
            <Statistics />
          </JudgeRoute>
        } />
        
        {/* Экспедиция - только для сотрудников */}
        <Route path="in" element={
          <JudgeRoute>
            <CorrespondenceIn />
          </JudgeRoute>
        } />
        <Route path="in/new" element={
          <JudgeRoute>
            <CorrespondenceForm />
          </JudgeRoute>
        } />
        <Route path="in/:id" element={
          <JudgeRoute>
            <CorrespondenceDetail />
          </JudgeRoute>
        } />
        <Route path="in/:id/edit" element={
          <JudgeRoute>
            <CorrespondenceForm mode="edit" />
          </JudgeRoute>
        } />
        <Route path="out" element={
          <JudgeRoute>
            <CorrespondenceOut />
          </JudgeRoute>
        } />
        <Route path="out/new" element={
          <JudgeRoute>
            <CorrespondenceForm />
          </JudgeRoute>
        } />
        <Route path="out/:id" element={
          <JudgeRoute>
            <CorrespondenceDetail />
          </JudgeRoute>
        } />
        <Route path="out/:id/edit" element={
          <JudgeRoute>
            <CorrespondenceForm mode="edit" />
          </JudgeRoute>
        } />

        {/* Категории дел - только для сотрудников */}
        <Route path="criminal" element={
          <JudgeRoute>
            <CriminalCasesPage />
          </JudgeRoute>
        } />
        <Route path="civil" element={
          <JudgeRoute>
            <CivilCasesPage />
          </JudgeRoute>
        } />
        <Route path="administrative" element={
          <JudgeRoute>
            <AdministrativeCasesPage />
          </JudgeRoute>
        } />
        <Route path="admin-offenses" element={
          <JudgeRoute>
            <AdminOffensesPage />
          </JudgeRoute>
        } />

        <Route path="cards/:id" element={
          <JudgeRoute>
            <CardIdPage />
          </JudgeRoute>
        } />
        <Route path="business_card/businesscard/" element={
          <JudgeRoute>
            <CardList />
          </JudgeRoute>
        } />
        <Route path="business_card/businesscard/:id/sidescaseincase/:id" element={
          <JudgeRoute>
            <SideDetail />
          </JudgeRoute>
        } />
        <Route path="/businesscard/:cardId/sides/:sideId" element={
          <JudgeRoute>
            <SideDetail />
          </JudgeRoute>
        } />
        <Route path="business_card/businesscard/:id/considered/:id" element={
          <JudgeRoute>
            <ConsideredDetail />
          </JudgeRoute>
        } />

        <Route path="/criminal-proceedings/:proceedingId/party-documents" element={<PartyDocumentsPage caseType="criminal" />} />
        <Route path="/civil-proceedings/:proceedingId/party-documents" element={<PartyDocumentsPage caseType="civil" />} />
        <Route path="/admin-proceedings/:proceedingId/party-documents" element={<PartyDocumentsPage caseType="admin" />} />
        <Route path="/kas-proceedings/:proceedingId/party-documents" element={<PartyDocumentsPage caseType="kas" />} />

        <Route path="/criminal-proceedings/:proceedingId/party-documents/create" element={<PartyDocumentForm caseType="criminal" />} />
        <Route path="/civil-proceedings/:proceedingId/party-documents/create" element={<PartyDocumentForm caseType="civil" />} />
        <Route path="/admin-proceedings/:proceedingId/party-documents/create" element={<PartyDocumentForm caseType="admin" />} />
        <Route path="/kas-proceedings/:proceedingId/party-documents/create" element={<PartyDocumentForm caseType="kas" />} />

        <Route path="/criminal-proceedings/:proceedingId/party-documents/:documentId" element={<PartyDocumentDetailPage caseType="criminal" />} />
        <Route path="/civil-proceedings/:proceedingId/party-documents/:documentId" element={<PartyDocumentDetailPage caseType="civil" />} />
        <Route path="/admin-proceedings/:proceedingId/party-documents/:documentId" element={<PartyDocumentDetailPage caseType="admin" />} />
        <Route path="/kas-proceedings/:proceedingId/party-documents/:documentId" element={<PartyDocumentDetailPage caseType="kas" />} />

        {/* Документы по делам - только для сотрудников */}
        <Route path="criminal-proceedings/:proceedingId/documents" 
          element={<JudgeRoute><DocumentsPage caseType="criminal" /></JudgeRoute>} />
        <Route path="criminal-proceedings/:proceedingId/documents/create" 
          element={<JudgeRoute><DocumentFormPage caseType="criminal" /></JudgeRoute>} />
        <Route path="criminal-proceedings/:proceedingId/documents/:documentId" 
          element={<JudgeRoute><DocumentDetailPage caseType="criminal" /></JudgeRoute>} />
        <Route path="criminal-proceedings/:proceedingId/documents/:documentId/edit" 
          element={<JudgeRoute><DocumentFormPage caseType="criminal" isEdit={true} /></JudgeRoute>} />

        <Route path="civil-proceedings/:proceedingId/documents" 
          element={<JudgeRoute><DocumentsPage caseType="civil" /></JudgeRoute>} />
        <Route path="civil-proceedings/:proceedingId/documents/create" 
          element={<JudgeRoute><DocumentFormPage caseType="civil" /></JudgeRoute>} />
        <Route path="civil-proceedings/:proceedingId/documents/:documentId" 
          element={<JudgeRoute><DocumentDetailPage caseType="civil" /></JudgeRoute>} />
        <Route path="civil-proceedings/:proceedingId/documents/:documentId/edit" 
          element={<JudgeRoute><DocumentFormPage caseType="civil" isEdit={true} /></JudgeRoute>} />

        <Route path="admin-proceedings/:proceedingId/documents" 
          element={<JudgeRoute><DocumentsPage caseType="admin" /></JudgeRoute>} />
        <Route path="admin-proceedings/:proceedingId/documents/create" 
          element={<JudgeRoute><DocumentFormPage caseType="admin" /></JudgeRoute>} />
        <Route path="admin-proceedings/:proceedingId/documents/:documentId" 
          element={<JudgeRoute><DocumentDetailPage caseType="admin" /></JudgeRoute>} />
        <Route path="admin-proceedings/:proceedingId/documents/:documentId/edit" 
          element={<JudgeRoute><DocumentFormPage caseType="admin" isEdit={true} /></JudgeRoute>} />

        <Route path="kas-proceedings/:proceedingId/documents" 
          element={<JudgeRoute><DocumentsPage caseType="kas" /></JudgeRoute>} />
        <Route path="kas-proceedings/:proceedingId/documents/create" 
          element={<JudgeRoute><DocumentFormPage caseType="kas" /></JudgeRoute>} />
        <Route path="kas-proceedings/:proceedingId/documents/:documentId" 
          element={<JudgeRoute><DocumentDetailPage caseType="kas" /></JudgeRoute>} />
        <Route path="kas-proceedings/:proceedingId/documents/:documentId/edit" 
          element={<JudgeRoute><DocumentFormPage caseType="kas" isEdit={true} /></JudgeRoute>} />

        {/* Уголовные производства - только для сотрудников */}
        <Route path="criminal-proceedings/:id" element={<JudgeRoute><CriminalDetail /></JudgeRoute>} />
        <Route path="criminal-proceedings/:proceedingId/petitions/create" element={<JudgeRoute><PetitionDetail /></JudgeRoute>} />
        <Route path="criminal-proceedings/:proceedingId/petitions/:petitionId" element={<PetitionDetail />} />
        <Route path="criminal-proceedings/:proceedingId/criminal-decisions/create" element={<JudgeRoute><CriminalDecisionDetail /></JudgeRoute>} />
        <Route path="criminal-proceedings/:proceedingId/criminal-decisions/:id" element={<JudgeRoute><CriminalDecisionDetail /></JudgeRoute>} />
        <Route path="criminal-proceedings/:proceedingId/criminal-case-movement/create" element={<JudgeRoute><MovementDetail /></JudgeRoute>} />
        <Route path="criminal-proceedings/:proceedingId/criminal-case-movement/:movementId" element={<JudgeRoute><MovementDetail /></JudgeRoute>} />
        <Route path="/criminal-proceedings/:proceedingId/defendants/create" element={<JudgeRoute><DefendantDetail /></JudgeRoute>} />
        <Route path="/criminal-proceedings/:proceedingId/defendants/:id" element={<JudgeRoute><DefendantDetail /></JudgeRoute>} />
        <Route path="/criminal-proceedings/:proceedingId/defendants/:defendantId/person-card" element={<JudgeRoute><CriminalPersonCard /></JudgeRoute>} />
        <Route path="criminal-proceedings/:proceedingId/lawyers-criminal/create" element={<JudgeRoute><LawyerDetails /></JudgeRoute>} />
        <Route path="criminal-proceedings/:proceedingId/lawyers-criminal/:lawyerId" element={<JudgeRoute><LawyerDetails /></JudgeRoute>} />
        <Route path="criminal-proceedings/:proceedingId/sides-case-in-case/create" element={<JudgeRoute><SideDetail /></JudgeRoute>} />
        <Route path="criminal-proceedings/:proceedingId/sides-case-in-case/:sideId" element={<JudgeRoute><SideDetail /></JudgeRoute>} />
        <Route path="criminal-proceedings/:proceedingId/executions/create" element={<JudgeRoute><CriminalExecutionDetail /></JudgeRoute>} />
        <Route path="criminal-proceedings/:proceedingId/executions/:executionId" element={<JudgeRoute><CriminalExecutionDetail /></JudgeRoute>} />
        <Route path="/criminal-proceedings/:proceedingId/civil-claims/:id?" element={<JudgeRoute><CriminalCivilClaimDetail /></JudgeRoute>} />
        <Route path="/criminal-proceedings/:proceedingId/civil-claims/create" element={<JudgeRoute><CriminalCivilClaimDetail /></JudgeRoute>} />

        {/* Гражданские производства - только для сотрудников */}
        <Route path="civil-proceedings/:id" element={<JudgeRoute><CivilDetail /></JudgeRoute>} />
        <Route path="civil-proceedings/create" element={<JudgeRoute><CivilDetail /></JudgeRoute>} />
        <Route path="civil-proceedings/:proceedingId/lawyers/create" element={<JudgeRoute><LawyerDetails /></JudgeRoute>} />
        <Route path="civil-proceedings/:proceedingId/lawyers/:lawyerId" element={<JudgeRoute><LawyerDetails /></JudgeRoute>} />
        <Route path="civil-proceedings/:proceedingId/movements/create" element={<JudgeRoute><MovementDetail /></JudgeRoute>} />
        <Route path="civil-proceedings/:proceedingId/movements/:movementId" element={<JudgeRoute><MovementDetail /></JudgeRoute>} />
        <Route path="civil-proceedings/:proceedingId/petitions/create" element={<JudgeRoute><PetitionDetail /></JudgeRoute>} />
        <Route path="civil-proceedings/:proceedingId/petitions/:petitionId" element={<PetitionDetail />} />
        <Route path="civil-proceedings/:proceedingId/sides/create" element={<JudgeRoute><SideDetail /></JudgeRoute>} />
        <Route path="civil-proceedings/:proceedingId/sides/:sideId" element={<JudgeRoute><SideDetail /></JudgeRoute>} />
        <Route path="civil-proceedings/:proceedingId/decisions/create" element={<JudgeRoute><CivilDecisionDetail /></JudgeRoute>} />
        <Route path="civil-proceedings/:proceedingId/decisions/:decisionId" element={<JudgeRoute><CivilDecisionDetail /></JudgeRoute>} />
        <Route path="civil-proceedings/:proceedingId/executions/create" element={<JudgeRoute><CivilExecutionDetail /></JudgeRoute>} />
        <Route path="civil-proceedings/:proceedingId/executions/:executionId" element={<JudgeRoute><CivilExecutionDetail /></JudgeRoute>} />

        {/* Административные правонарушения (КоАП) - только для сотрудников */}
        <Route path="admin-proceedings/create" element={<JudgeRoute><AdministrativeDetail /></JudgeRoute>} />
        <Route path="admin-proceedings/:id" element={<JudgeRoute><AdministrativeDetail /></JudgeRoute>} />
        <Route path="admin-proceedings/:proceedingId/sides/create" element={<JudgeRoute><SideDetail /></JudgeRoute>} />
        <Route path="admin-proceedings/:proceedingId/sides/:sideId" element={<JudgeRoute><SideDetail /></JudgeRoute>} />
        <Route path="admin-proceedings/:proceedingId/lawyers/create" element={<JudgeRoute><LawyerDetails /></JudgeRoute>} />
        <Route path="admin-proceedings/:proceedingId/lawyers/:lawyerId" element={<JudgeRoute><LawyerDetails /></JudgeRoute>} />
        <Route path="admin-proceedings/:proceedingId/movements/create" element={<JudgeRoute><MovementDetail /></JudgeRoute>} />
        <Route path="admin-proceedings/:proceedingId/movements/:movementId" element={<JudgeRoute><MovementDetail /></JudgeRoute>} />
        <Route path="admin-proceedings/:proceedingId/petitions/create" element={<JudgeRoute><PetitionDetail /></JudgeRoute>} />
        <Route path="admin-proceedings/:proceedingId/petitions/:petitionId" element={<PetitionDetail />} />
        <Route path="admin-proceedings/:proceedingId/decisions/create" element={<JudgeRoute><AdministrativeDecisionDetail /></JudgeRoute>} />
        <Route path="admin-proceedings/:proceedingId/decisions/:decisionId" element={<JudgeRoute><AdministrativeDecisionDetail /></JudgeRoute>} />
        <Route path="admin-proceedings/:proceedingId/executions/create" element={<JudgeRoute><AdministrativeProcedureActionDetail /></JudgeRoute>} />
        <Route path="admin-proceedings/:proceedingId/executions/:executionId" element={<JudgeRoute><AdministrativeProcedureActionDetail /></JudgeRoute>} />
        <Route path="admin-proceedings/:proceedingId/subjects/create" element={<JudgeRoute><SubjectDetail /></JudgeRoute>} />
        <Route path="admin-proceedings/:proceedingId/subjects/:subjectId" element={<JudgeRoute><SubjectDetail /></JudgeRoute>} />
        <Route path="admin-proceedings/:proceedingId/security-measures/create" element={<JudgeRoute><SecurityMeasureDetail /></JudgeRoute>} />
        <Route path="admin-proceedings/:proceedingId/security-measures/:measureId" element={<JudgeRoute><SecurityMeasureDetail /></JudgeRoute>} />

        {/* Административные дела (КАС) - только для сотрудников */}
        <Route path="kas-proceedings/create" element={<JudgeRoute><KasDetail /></JudgeRoute>} />
        <Route path="kas-proceedings/:id" element={<JudgeRoute><KasDetail /></JudgeRoute>} />
        <Route path="kas-proceedings/:proceedingId/sides/create" element={<JudgeRoute><SideDetail /></JudgeRoute>} />
        <Route path="kas-proceedings/:proceedingId/sides/:sideId" element={<JudgeRoute><SideDetail /></JudgeRoute>} />
        <Route path="kas-proceedings/:proceedingId/lawyers/create" element={<JudgeRoute><LawyerDetails /></JudgeRoute>} />
        <Route path="kas-proceedings/:proceedingId/lawyers/:lawyerId" element={<JudgeRoute><LawyerDetails /></JudgeRoute>} />
        <Route path="kas-proceedings/:proceedingId/movements/create" element={<JudgeRoute><MovementDetail /></JudgeRoute>} />
        <Route path="kas-proceedings/:proceedingId/movements/:movementId" element={<JudgeRoute><MovementDetail /></JudgeRoute>} />
        <Route path="kas-proceedings/:proceedingId/petitions/create" element={<JudgeRoute><PetitionDetail /></JudgeRoute>} />
        <Route path="kas-proceedings/:proceedingId/petitions/:petitionId" element={<PetitionDetail />} />
        <Route path="kas-proceedings/:proceedingId/decisions/create" element={<JudgeRoute><KasDecisionDetail /></JudgeRoute>} />
        <Route path="kas-proceedings/:proceedingId/decisions/:decisionId" element={<JudgeRoute><KasDecisionDetail /></JudgeRoute>} />
        <Route path="kas-proceedings/:proceedingId/executions/create" element={<JudgeRoute><KasExecutionDetail /></JudgeRoute>} />
        <Route path="kas-proceedings/:proceedingId/executions/:executionId" element={<JudgeRoute><KasExecutionDetail /></JudgeRoute>} />

        {/* Иные материалы - только для сотрудников */}
        <Route path="other-materials/create" element={<JudgeRoute><OtherMaterialDetail /></JudgeRoute>} />
        <Route path="other-materials/:id" element={<JudgeRoute><OtherMaterialDetail /></JudgeRoute>} />
        <Route path="other-materials/:materialId/sides/create" element={<JudgeRoute><SideDetail /></JudgeRoute>} />
        <Route path="other-materials/:materialId/sides/:sideId" element={<JudgeRoute><SideDetail /></JudgeRoute>} />
        <Route path="other-materials/:materialId/lawyers/create" element={<JudgeRoute><LawyerDetails /></JudgeRoute>} />
        <Route path="other-materials/:materialId/lawyers/:lawyerId" element={<JudgeRoute><LawyerDetails /></JudgeRoute>} />
        <Route path="other-materials/:materialId/decisions/create" element={<JudgeRoute><OtherMaterialDecisionDetail /></JudgeRoute>} />
        <Route path="other-materials/:materialId/decisions/:decisionId" element={<JudgeRoute><OtherMaterialDecisionDetail /></JudgeRoute>} />
        <Route path="other-materials/:materialId/documents" 
          element={<JudgeRoute><DocumentsPage caseType="other" /></JudgeRoute>} />
        <Route path="other-materials/:materialId/documents/create" 
          element={<JudgeRoute><DocumentFormPage caseType="other" /></JudgeRoute>} />
        <Route path="other-materials/:materialId/documents/:documentId" 
          element={<JudgeRoute><DocumentDetailPage caseType="other" /></JudgeRoute>} />
        <Route path="other-materials/:materialId/documents/:documentId/edit" 
          element={<JudgeRoute><DocumentFormPage caseType="other" isEdit={true} /></JudgeRoute>} />
      </Route>
    </Routes>
  );
};

export default AppRouter;