// components/OtherMaterial/OtherMaterialBusinessCard.jsx
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
  const [movements, setMovements] = useState([]);
  const [petitions, setPetitions] = useState([]);
  const [activeTab, setActiveTab] = useState('summary');
  const [isArchived, setIsArchived] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [quickStats, setQuickStats] = useState({
    sides: 0,
    lawyers: 0,
    movements: 0,
    petitions: 0,
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
      
      const movementsData = await OtherMaterialService.getMovements(card.other_material_id);
      setMovements(movementsData);
      
      const petitionsData = await OtherMaterialService.getPetitions(card.other_material_id);
      setPetitions(petitionsData);
      
      setQuickStats(prev => ({
        ...prev,
        sides: sidesData.length,
        lawyers: lawyersData.length,
        movements: movementsData.length,
        petitions: petitionsData.length
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
  const handleAddMovement = () => navigate(`/other-materials/${card.other_material_id}/movements/create`);
  const handleAddPetition = () => navigate(`/other-materials/${card.other_material_id}/petitions/create`);

  const handleShowSides = () => setActiveTab('sides');
  const handleShowMovements = () => setActiveTab('movements');
  const handleShowPetitions = () => setActiveTab('petitions');

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
              className={`${styles.quickAction} ${activeTab === 'movements' ? styles.active : ''}`}
              onClick={handleShowMovements}
            >
              <span className={styles.quickActionCount}>{quickStats.movements}</span>
              Движения
            </button>
            <button 
              className={`${styles.quickAction} ${activeTab === 'petitions' ? styles.active : ''}`}
              onClick={handleShowPetitions}
            >
              <span className={styles.quickActionCount}>{quickStats.petitions}</span>
              Ходатайства
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
                {material?.consideration_result && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabel}>Результат:</div>
                    <div className={styles.detailValue}>{material.consideration_result}</div>
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
                <button onClick={handleAddSide} className={styles.addButton}>
                  + Добавить сторону
                </button>
                <button onClick={handleAddLawyer} className={styles.addButton}>
                  + Добавить представителя
                </button>
              </div>
              <div className={styles.compactList}>
                {sides.length > 0 && (
                  <>
                    <h4 className={styles.listSubtitle}>Стороны</h4>
                    {sides.map(side => (
                      <div key={side.id} className={styles.compactItem}>
                        <div className={styles.compactItemContent}>
                          <div className={styles.compactItemTitle}>
                            {side.sides_case_incase_detail?.name || 'Сторона'}
                            <span className={styles.sideType}>
                              {side.sides_case_role_detail?.name || 'Сторона'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {lawyers.length > 0 && (
                  <>
                    <h4 className={styles.listSubtitle}>Представители</h4>
                    {lawyers.map(lawyer => (
                      <div key={lawyer.id} className={styles.compactItem}>
                        <div className={styles.compactItemContent}>
                          <div className={styles.compactItemTitle}>
                            {lawyer.lawyer_detail?.law_firm_name || 'Представитель'}
                            <span className={styles.sideType}>
                              {lawyer.sides_case_role_detail?.name || 'Представитель'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'movements' && (
            <div className={styles.tabContent}>
              <div className={styles.tabHeader}>
                <button onClick={handleAddMovement} className={styles.addButton}>
                  + Добавить движение
                </button>
              </div>
              <div className={styles.compactList}>
                {movements.length > 0 ? (
                  movements.map(movement => {
                    const movementData = movement.business_movement_detail || movement;
                    return (
                      <div key={movement.id} className={styles.compactItem}>
                        <div className={styles.compactItemContent}>
                          <div className={styles.compactItemTitle}>
                            {movementData.date_meeting ? formatDate(movementData.date_meeting) : 'Движение'}
                          </div>
                          {movementData.result_court_session && (
                            <div className={styles.compactItemSubtitle}>
                              {movementData.result_court_session.slice(0, 100)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.emptyState}>
                    <p>Движения не добавлены</p>
                    <button onClick={handleAddMovement} className={styles.emptyStateButton}>
                      Добавить движение
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'petitions' && (
            <div className={styles.tabContent}>
              <div className={styles.tabHeader}>
                <button onClick={handleAddPetition} className={styles.addButton}>
                  + Добавить ходатайство/заявление
                </button>
              </div>
              <div className={styles.compactList}>
                {petitions.length > 0 ? (
                  petitions.map(petition => {
                    const petitionDetail = petition.petitions_incase_detail || {};
                    return (
                      <div key={petition.id} className={styles.compactItem}>
                        <div className={styles.compactItemContent}>
                          <div className={styles.compactItemTitle}>
                            {petitionDetail.date_application ? formatDate(petitionDetail.date_application) : 'Ходатайство'}
                          </div>
                          {petitionDetail.petitions_name && petitionDetail.petitions_name.length > 0 && (
                            <div className={styles.compactItemSubtitle}>
                              Тип: {petitionDetail.petitions_name.map(p => p.name).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.emptyState}>
                    <p>Ходатайства/заявления не добавлены</p>
                    <button onClick={handleAddPetition} className={styles.emptyStateButton}>
                      Добавить ходатайство
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