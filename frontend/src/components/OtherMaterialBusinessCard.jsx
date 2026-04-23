import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OtherMaterialService from '../API/OtherMaterialService';
import styles from './UI/Card/OtherMaterialBusinessCard.module.css';
import ConfirmModal from './UI/Modal/ConfirmModal';

const OtherMaterialBusinessCard = ({ card, remove }) => {
  const navigate = useNavigate();
  const [material, setMaterial] = useState(null);
  const [sides, setSides] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [activeTab, setActiveTab] = useState('summary');
  const [isArchived, setIsArchived] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [quickStats, setQuickStats] = useState({
    sides: 0,
    lawyers: 0,
    decisions: 0,
    lastActivity: null
  });

  useEffect(() => {
    if (card.other_material_id) {
      loadMaterialData();
      loadRelatedData();
    }
  }, [card]);

  const loadMaterialData = async () => {
    try {
      const response = await OtherMaterialService.getOtherMaterialById(card.other_material_id);
      setMaterial(response);
      setIsArchived(response?.status === 'archived');
      setQuickStats(prev => ({
        ...prev,
        lastActivity: response?.updated_at
      }));
    } catch (error) {
      console.error('Ошибка загрузки материала:', error);
    }
  };

  const loadRelatedData = async () => {
    if (!card.other_material_id) return;
    
    try {
      const sidesData = await OtherMaterialService.getSides(card.other_material_id);
      setSides(sidesData);
      
      const lawyersData = await OtherMaterialService.getLawyers(card.other_material_id);
      setLawyers(lawyersData);

      const decisionsData = await OtherMaterialService.getDecisions(card.other_material_id);
      setDecisions(decisionsData);
      
      setQuickStats(prev => ({
        ...prev,
        sides: sidesData.length,
        lawyers: lawyersData.length,
        decisions: decisionsData.length
      }));
    } catch (error) {
      console.error('Ошибка загрузки связанных данных:', error);
    }
  };

  const handleShowDetails = () => {
    if (card.other_material_id) {
      navigate(`/other-materials/${card.other_material_id}`);
    }
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);
    try {
      if (card.other_material_id) {
        await OtherMaterialService.deleteOtherMaterial(card.other_material_id);
        remove(card.id);
      }
    } catch (error) {
      console.error('Ошибка удаления материала:', error);
    }
  };

  const handleAddSide = () => navigate(`/other-materials/${card.other_material_id}/sides/create`);
  const handleAddLawyer = () => navigate(`/other-materials/${card.other_material_id}/lawyers/create`);
  const handleAddDecision = () => navigate(`/other-materials/${card.other_material_id}/decisions/create`);

  const handleViewSide = (sideId) => navigate(`/other-materials/${card.other_material_id}/sides/${sideId}`);
  const handleViewLawyer = (lawyerId) => navigate(`/other-materials/${card.other_material_id}/lawyers/${lawyerId}`);
  const handleViewDecision = (decisionId) => navigate(`/other-materials/${card.other_material_id}/decisions/${decisionId}`);

  const handleDeleteSide = async (sideId) => {
    if (window.confirm('Удалить сторону?')) {
      try {
        await OtherMaterialService.deleteSide(card.other_material_id, sideId);
        setSides(sides.filter(s => s.id !== sideId));
        setQuickStats(prev => ({ ...prev, sides: prev.sides - 1 }));
      } catch (error) {
        console.error('Ошибка удаления стороны:', error);
        alert('Не удалось удалить сторону');
      }
    }
  };

  const handleDeleteLawyer = async (lawyerId) => {
    if (window.confirm('Удалить представителя?')) {
      try {
        await OtherMaterialService.deleteLawyer(card.other_material_id, lawyerId);
        setLawyers(lawyers.filter(l => l.id !== lawyerId));
        setQuickStats(prev => ({ ...prev, lawyers: prev.lawyers - 1 }));
      } catch (error) {
        console.error('Ошибка удаления представителя:', error);
        alert('Не удалось удалить представителя');
      }
    }
  };

  const handleDeleteDecision = async (decisionId) => {
    if (window.confirm('Удалить решение?')) {
      try {
        await OtherMaterialService.deleteDecision(card.other_material_id, decisionId);
        setDecisions(decisions.filter(d => d.id !== decisionId));
        setQuickStats(prev => ({ ...prev, decisions: prev.decisions - 1 }));
      } catch (error) {
        console.error('Ошибка удаления решения:', error);
        alert('Не удалось удалить решение');
      }
    }
  };

  const handleShowSides = () => setActiveTab('sides');
  const handleShowDecisions = () => setActiveTab('decisions');

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOutcomeLabel = (outcome) => {
    const outcomeMap = {
      'satisfied': 'Удовлетворено',
      'rejected': 'Отказано',
      'dismissed': 'Прекращено',
      'left_without': 'Оставлено без рассмотрения',
      'transferred': 'Передано'
    };
    return outcomeMap[outcome] || outcome || 'Не указан';
  };

  const SideItem = ({ side }) => {
    const sideDetail = side.sides_case_incase_detail || {};
    const roleDetail = side.sides_case_role_detail || {};

    return (
      <div className={styles.compactItem}>
        <div className={styles.compactItemContent}>
          <div className={styles.compactItemTitle}>
            {sideDetail.name || 'Сторона по делу'}
            <span className={styles.sideType}>
              {roleDetail.name || 'Не указана'}
            </span>
          </div>
          {sideDetail.phone && (
            <div className={styles.compactItemSubtitle}>
              Телефон: {sideDetail.phone}
            </div>
          )}
        </div>
        <div className={styles.compactItemActions}>
          <button 
            onClick={() => handleViewSide(side.id)}
            className={styles.actionButton}
            title="Просмотреть"
          >
            →
          </button>
          <button 
            onClick={() => handleDeleteSide(side.id)}
            className={styles.deleteButton}
            title="Удалить"
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  const LawyerItem = ({ lawyer }) => {
    const lawyerDetail = lawyer.lawyer_detail || {};
    const roleDetail = lawyer.sides_case_role_detail || {};

    return (
      <div className={styles.compactItem}>
        <div className={styles.compactItemContent}>
          <div className={styles.compactItemTitle}>
            {lawyerDetail.law_firm_name || 'Представитель'}
            <span className={styles.sideType}>
              {roleDetail.name || 'Представитель'}
            </span>
          </div>
          {lawyerDetail.law_firm_phone && (
            <div className={styles.compactItemSubtitle}>
              Телефон: {lawyerDetail.law_firm_phone}
            </div>
          )}
        </div>
        <div className={styles.compactItemActions}>
          <button 
            onClick={() => handleViewLawyer(lawyer.id)}
            className={styles.actionButton}
            title="Просмотреть"
          >
            →
          </button>
          <button 
            onClick={() => handleDeleteLawyer(lawyer.id)}
            className={styles.deleteButton}
            title="Удалить"
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  const DecisionItem = ({ decision }) => {
    return (
      <div className={styles.compactItem}>
        <div className={styles.compactItemContent}>
          <div className={styles.compactItemTitle}>
            {decision.decision_date ? formatDate(decision.decision_date) : 'Решение'}
            <span className={styles.sideType}>
              Решение
            </span>
          </div>
          <div className={styles.compactItemSubtitle}>
            {getOutcomeLabel(decision.outcome)}
          </div>
          {decision.decision_effective_date && (
            <div className={styles.compactItemSubtitle}>
              Вступило в силу: {formatDate(decision.decision_effective_date)}
            </div>
          )}
        </div>
        <div className={styles.compactItemActions}>
          <button 
            onClick={() => handleViewDecision(decision.id)}
            className={styles.actionButton}
            title="Просмотреть"
          >
            →
          </button>
          <button 
            onClick={() => handleDeleteDecision(decision.id)}
            className={styles.deleteButton}
            title="Удалить"
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={styles.cardContainer}>
        <div className={styles.cardHeader}>
          <div className={styles.headerMain}>
            <div className={styles.caseType}>
              Иные материалы
              {isArchived && <span className={styles.archivedBadge}>АРХИВ</span>}
            </div>
            <div className={styles.caseNumber}>
              {material?.registration_number || card.registration_number || 'Без номера'}
            </div>
            <div className={styles.caseTitle}>
              {material?.title || card.title || ''}
            </div>
          </div>
          <div className={styles.headerMeta}>
            <div className={styles.caseResponsible}>
              {material?.responsible_person_full_name ? `Судья: ${material.responsible_person_full_name}` : 'Судья не назначен'}
            </div>
            <div className={styles.caseDate}>
              {formatDate(material?.registration_date || card.registration_date)}
            </div>
          </div>
        </div>
        
        <div className={styles.quickActionsWrapper}>
          <div className={styles.quickActions}>
            <button 
              className={`${styles.quickAction} ${activeTab === 'sides' ? styles.active : ''}`}
              onClick={handleShowSides}
            >
              <span className={styles.quickActionCount}>{quickStats.sides + quickStats.lawyers}</span>
              Участники
            </button>
            <button 
              className={`${styles.quickAction} ${activeTab === 'decisions' ? styles.active : ''}`}
              onClick={handleShowDecisions}
            >
              <span className={styles.quickActionCount}>{quickStats.decisions}</span>
              Решения
            </button>
            <button 
              className={styles.quickAction}
              onClick={() => navigate(`/other-materials/${card.other_material_id}/documents`)}
            >
              <span className={styles.quickActionCount}>0</span>
              Документы
            </button>
          </div>
        </div>

        <div className={styles.cardContent}>
          {activeTab === 'summary' && (
            <div className={styles.summaryContent}>
              <div className={styles.summaryDetails}>
                {material?.description && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Описание:</div>
                    <div className={styles.detailValue}>{material.description}</div>
                  </div>
                )}
                {material?.incoming_number && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Вх. №:</div>
                    <div className={styles.detailValue}>{material.incoming_number}</div>
                  </div>
                )}
                {material?.incoming_date && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Дата поступления:</div>
                    <div className={styles.detailValue}>{formatDate(material.incoming_date)}</div>
                  </div>
                )}
                {material?.sender && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Отправитель:</div>
                    <div className={styles.detailValue}>{material.sender}</div>
                  </div>
                )}
                {material?.consideration_date && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Дата рассмотрения:</div>
                    <div className={styles.detailValue}>{formatDate(material.consideration_date)}</div>
                  </div>
                )}
                {material?.outcome && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Результат:</div>
                    <div className={styles.detailValue}>{getOutcomeLabel(material.outcome)}</div>
                  </div>
                )}
                {material?.status && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Статус:</div>
                    <div className={styles.detailValue}>{material.status_display || material.status}</div>
                  </div>
                )}
              </div>
              
              <div className={styles.lastActivity}>
                Обновлено: {formatDateTime(quickStats.lastActivity || material?.updated_at)}
              </div>
            </div>
          )}
          
          {activeTab === 'sides' && (
            <div className={styles.tabContent}>
              <div className={styles.tabHeader}>
                <div className={styles.tabHeaderActions}>
                  <button onClick={handleAddSide} className={styles.addButton}>
                    + Добавить сторону
                  </button>
                  <button onClick={handleAddLawyer} className={styles.addButton}>
                    + Добавить представителя
                  </button>
                </div>
              </div>
              <div className={styles.compactList}>
                {sides.length > 0 && (
                  <>
                    <h4 className={styles.listSubtitle}>Стороны</h4>
                    {sides.map(side => (
                      <SideItem key={`side-${side.id}`} side={side} />
                    ))}
                  </>
                )}
                {lawyers.length > 0 && (
                  <>
                    <h4 className={styles.listSubtitle}>Представители</h4>
                    {lawyers.map(lawyer => (
                      <LawyerItem key={`lawyer-${lawyer.id}`} lawyer={lawyer} />
                    ))}
                  </>
                )}
                {sides.length === 0 && lawyers.length === 0 && (
                  <div className={styles.emptyState}>
                    <p>Участники не добавлены</p>
                    <div className={styles.emptyStateActions}>
                      <button onClick={handleAddSide} className={styles.emptyStateButton}>
                        Добавить сторону
                      </button>
                      <button onClick={handleAddLawyer} className={styles.emptyStateButton}>
                        Добавить представителя
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'decisions' && (
            <div className={styles.tabContent}>
              <div className={styles.tabHeader}>
                <button onClick={handleAddDecision} className={styles.addButton}>
                  + Добавить решение
                </button>
              </div>
              <div className={styles.compactList}>
                {decisions.length > 0 ? (
                  decisions.map(decision => (
                    <DecisionItem key={decision.id} decision={decision} />
                  ))
                ) : (
                  <div className={styles.emptyState}>
                    <p>Решения не добавлены</p>
                    <button onClick={handleAddDecision} className={styles.emptyStateButton}>
                      Добавить решение
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.cardFooter}>
          <button onClick={handleShowDetails} className={styles.primaryButton}>
            Подробнее о материале
          </button>
          <div className={styles.footerActions}>
            <button onClick={() => setShowDeleteModal(true)} className={styles.dangerButton}>
              Удалить
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        message="Вы уверены, что хотите удалить иной материал?"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};

export default OtherMaterialBusinessCard;