import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CardService from '../API/CardService';
import CriminalCaseService from '../API/CriminalCaseService';
import CivilCaseService from '../API/CivilCaseService';
import CaseRegistryService from '../API/CaseRegistryService';
import styles from './UI/input/CategoryBasedForm.module.css';
import { useProtectedFetching } from '../hooks/useProtectedFetching';
import { useAuth } from '../context/AuthContext';
import MyButton from './UI/button/MyButton';
import MyInput from './UI/input/MyInput';

const CategoryBasedForm = ({ create, editCardData, onSave, onCancel }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [fetchCategories, isCategoriesLoading] = useProtectedFetching();
  
  const [step, setStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryList, setCategoryList] = useState([]);
  const [registryIndexes, setRegistryIndexes] = useState([]);
  const [filteredIndexes, setFilteredIndexes] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectedCivilCaseType, setSelectedCivilCaseType] = useState(null);
  const [nextNumber, setNextNumber] = useState(null);
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] = useState([]);
  
  // Маппинг индексов для гражданских дел на значения case_type
  const civilCaseTypeMapping = {
    '2': null,
  };

  // Типы производств для отображения в UI
  const civilCaseTypeOptions = [
    { value: '1', label: 'Исковое производство' },
    { value: '2', label: 'Приказное производство' },
    { value: '3', label: 'Особое производство' },
    { value: '4', label: 'Упрощенное производство' },
    { value: '5', label: 'Производство по исполнению судебных постановлений' },
  ];

  // Флаги для отслеживания загрузки
  const categoriesLoaded = useRef(false);
  const indexesLoaded = useRef(false);
  
  const [card, setCard] = useState({
    original_name: '',
    case_category: '',
    pub_date: '',
    preliminary_hearing: '',
    registry_index: '',
    case_type: '', // Добавляем поле для вида производства
  });
  
  const currentYear = new Date().getFullYear();

  // Загрузка категорий - только один раз
  useEffect(() => {
    if (isAuthenticated() && !categoriesLoaded.current) {
      categoriesLoaded.current = true;
      loadCategories();
    }
  }, [isAuthenticated]);

  // Загрузка индексов - только один раз
  useEffect(() => {
    if (isAuthenticated() && !indexesLoaded.current) {
      indexesLoaded.current = true;
      loadRegistryIndexes();
    }
  }, [isAuthenticated]);

  // Фильтрация индексов при выборе категории
  useEffect(() => {
    if (selectedCategory && registryIndexes.length > 0) {
      filterIndexesByCategory(selectedCategory);
    }
  }, [selectedCategory, registryIndexes]);

  // Сброс выбранного типа производства при смене индекса
  useEffect(() => {
    if (selectedIndex) {
      // Если выбран индекс 2 (базовый), показываем выбор типа производства
      if (selectedIndex.index === '2') {
        setSelectedCivilCaseType(null);
      } else {
        // Если выбран подындекс, автоматически определяем case_type
        const caseTypeValue = civilCaseTypeMapping[selectedIndex.index];
        if (caseTypeValue) {
          setSelectedCivilCaseType(caseTypeValue);
          setCard(prev => ({
            ...prev,
            case_type: caseTypeValue
          }));
        } else {
          setSelectedCivilCaseType(null);
          setCard(prev => ({
            ...prev,
            case_type: ''
          }));
        }
      }
    }
  }, [selectedIndex]);

  // Обработка editCardData
  useEffect(() => {
    if (editCardData && categoryList.length > 0 && registryIndexes.length > 0) {
      setIsEditing(true);
      setStep(3);
      setCard({ ...editCardData });
      
      const category = categoryList.find(cat => cat.id === parseInt(editCardData.case_category));
      setSelectedCategory(category);
      
      // Если есть индекс, выбираем его
      if (editCardData.registry_index) {
        const index = registryIndexes.find(idx => idx.index === editCardData.registry_index);
        setSelectedIndex(index);
      }

      // Если есть case_type, устанавливаем его
      if (editCardData.case_type) {
        setSelectedCivilCaseType(editCardData.case_type);
      }
    }
  }, [editCardData, categoryList, registryIndexes]);

  // Фильтрация категорий
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCategories(categoryList);
    } else {
      const filtered = categoryList.filter(cat => 
        cat.title_category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchTerm, categoryList]);

  const loadCategories = async () => {
    try {
      await fetchCategories(async () => {
        const categories = await CardService.getCategories();
        setCategoryList(categories);
        setFilteredCategories(categories);
      });
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadRegistryIndexes = async () => {
    try {
      const indexes = await CaseRegistryService.getIndexes();
      setRegistryIndexes(indexes || []);
      setFilteredIndexes(indexes || []);
    } catch (error) {
      console.error('Ошибка загрузки индексов:', error);
      setRegistryIndexes([]);
      setFilteredIndexes([]);
    }
  };

  // Фильтрация индексов по категории дела
  const filterIndexesByCategory = (category) => {
    if (!category || !registryIndexes.length) return;
    
    const categoryName = category.title_category.toLowerCase();
    let filtered = [];
    
    // Определяем, какие индексы относятся к выбранной категории
    if (categoryName.includes('уголов')) {
      // Уголовное судопроизводство: индексы 1, 3, 3/*, 4, 4/*, 6, 7, 8, 8/*, 9, 9у, 10, 13, 14, 15
      filtered = registryIndexes.filter(idx => {
        const index = idx.index;
        return index === '1' || 
               index === '3' || index.startsWith('3/') ||
               index === '4' || index.startsWith('4/') ||
               index === '6' || index === '7' ||
               index === '8' || index.startsWith('8/') ||
               index === '9' || index === '9у' ||
               index === '10' || index === '13' || index === '14' || index === '15';
      });
    } else if (categoryName.includes('граждан')) {
      // Гражданское судопроизводство: индексы 2, 11, 13
      filtered = registryIndexes.filter(idx => 
        idx.index === '2' || idx.index === '11' || idx.index === '13'
      );
      
      // Сортируем: сначала базовый индекс 2, потом подтипы
      filtered.sort((a, b) => {
        if (a.index === '2') return -1;
        if (b.index === '2') return 1;
        return a.index.localeCompare(b.index);
      });
    } else if (categoryName.includes('административ') && categoryName.includes('правонарушен')) {
      // Административные правонарушения: индекс 5, 12
      filtered = registryIndexes.filter(idx => 
        idx.index === '5' || idx.index === '12'
      );
    } else if (categoryName.includes('административ')) {
      // Административное судопроизводство: индексы 2а, 9а, 13а
      filtered = registryIndexes.filter(idx => 
        idx.index === '2а' || idx.index === '9а' || idx.index === '13а'
      );
    } else {
      // По умолчанию - все индексы
      filtered = registryIndexes;
    }
    
    setFilteredIndexes(filtered);
  };

  const getNextNumber = async (indexCode) => {
    if (!indexCode) return null;
    
    try {
      setIsGeneratingNumber(true);
      const nextNum = await CaseRegistryService.getNextNumber(indexCode);
      setNextNumber(nextNum);
      return nextNum;
    } catch (error) {
      console.error('Ошибка получения следующего номера:', error);
      return null;
    } finally {
      setIsGeneratingNumber(false);
    }
  };

  const generateCaseNumber = async (indexCode) => {
    if (!indexCode) return '';
    
    const nextNum = await getNextNumber(indexCode);
    if (!nextNum) return '';
    
    return `${indexCode}-${nextNum}/${currentYear}`;
  };

  const getCategoryDescription = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes('уголов')) return 'Уголовное дело';
    if (name.includes('граждан')) return 'Гражданское дело';
    if (name.includes('административ') && name.includes('правонарушен')) return 'Административное правонарушение';
    if (name.includes('административ')) return 'Административное дело';
    return 'Обычная карточка';
  };

  const getCategoryIcon = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes('уголов')) return styles.criminalIcon;
    if (name.includes('граждан')) return styles.civilIcon;
    if (name.includes('административ')) return styles.adminIcon;
    return styles.defaultIcon;
  };

  const getProceedingType = (category) => {
    if (!category) return 'unknown';
    
    const name = category.title_category.toLowerCase();
    if (name.includes('уголов')) return 'criminal';
    if (name.includes('граждан')) return 'civil';
    if (name.includes('административ') && name.includes('правонарушен')) return 'administrative-offense';
    if (name.includes('административ')) return 'administrative';
    return 'regular';
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSelectedIndex(null);
    setSelectedCivilCaseType(null);
    setStep(2);
  };

  const handleIndexSelect = async (e) => {
    const indexCode = e.target.value;
    const index = filteredIndexes.find(idx => idx.index === indexCode);
    setSelectedIndex(index);
    
    if (indexCode) {
      const nextNum = await getNextNumber(indexCode);
      
      if (nextNum) {
        const caseNumber = `${indexCode}-${nextNum}/${currentYear}`;
        
        // Определяем case_type на основе выбранного индекса
        let caseType = '';
        if (getProceedingType(selectedCategory) === 'civil') {
          caseType = civilCaseTypeMapping[indexCode] || '';
        }
        
        setCard({
          ...card,
          case_category: selectedCategory.id,
          registry_index: indexCode,
          original_name: caseNumber,
          pub_date: new Date().toISOString().split('T')[0],
          case_type: caseType,
        });
      } else {
        setCard({
          ...card,
          case_category: selectedCategory.id,
          registry_index: indexCode,
          original_name: '',
          pub_date: new Date().toISOString().split('T')[0],
          case_type: '',
        });
      }
    }
  };

  const handleCivilCaseTypeChange = (e) => {
    const caseTypeValue = e.target.value;
    setSelectedCivilCaseType(caseTypeValue);
    setCard(prev => ({
      ...prev,
      case_type: caseTypeValue
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCard({ ...card, [name]: value });
  };

  const handleCreateAndRedirect = async () => {
    if (!selectedCategory || !card.original_name || !selectedIndex) {
      alert('Пожалуйста, выберите категорию и индекс дела');
      return;
    }

    // Для гражданских дел с индексом 2 проверяем, что выбран тип производства
    if (getProceedingType(selectedCategory) === 'civil' && 
        selectedIndex.index === '2' && 
        !selectedCivilCaseType) {
      alert('Пожалуйста, выберите вид производства (исковое, приказное и т.д.)');
      return;
    }
    
    setLoading(true);
    try {
      const indexCode = card.registry_index;
      
      // Извлекаем номер из полного номера
      const fullNumberPattern = new RegExp(`${indexCode}-(\\d+)/${currentYear}`);
      const match = card.original_name.match(fullNumberPattern);
      
      let caseNumber = null;
      if (match && match[1]) {
        caseNumber = parseInt(match[1], 10);
      } else {
        const numberMatch = card.original_name.match(/\d+$/);
        caseNumber = numberMatch ? parseInt(numberMatch[0], 10) : null;
      }
      
      if (!caseNumber) {
        throw new Error('Не удалось определить номер дела');
      }
      
      console.log('Регистрация дела с номером:', caseNumber);
      
      // Регистрируем дело в реестре
      const registeredCase = await CaseRegistryService.registerCase({
        index: indexCode,
        description: selectedIndex.name || selectedCategory.title_category,
        case_number: caseNumber,
        registration_date: new Date().toISOString().split('T')[0],
        business_card_id: null,
        criminal_proceedings_id: null,
      });
      
      console.log('Дело зарегистрировано в реестре:', registeredCase);
      
      // Создаем производство
      const proceedingType = getProceedingType(selectedCategory);
      
      if (proceedingType === 'criminal') {
        const criminalData = {
          case_number_criminal: card.original_name,
          status: 'active',
          registered_case_id: registeredCase.id
        };
        const proceeding = await CriminalCaseService.createCriminalProceedings(criminalData);
        
        if (create) create(proceeding);
        navigate(`/criminal-proceedings/${proceeding.id}`);
        
      } else if (proceedingType === 'civil') {
        const civilData = {
          case_number_civil: card.original_name,
          status: 'active',
          registered_case_id: registeredCase.id,
          case_type: card.case_type || '', // Передаем вид производства
        };
        
        const proceeding = await CivilCaseService.createCivilProceedings(civilData);
        
        if (create) create(proceeding);
        navigate(`/civil-proceedings/${proceeding.id}`);
        
      } else {
        navigate(`/create-proceeding?type=${proceedingType}&caseNumber=${card.original_name}&registeredCaseId=${registeredCase.id}`);
      }
      
      if (onCancel) onCancel();
      
    } catch (error) {
      console.error('Ошибка создания:', error);
      if (error.response?.data) {
        console.error('Детали ошибки:', error.response.data);
        alert(`Ошибка создания: ${JSON.stringify(error.response.data)}`);
      } else {
        alert(`Ошибка создания: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else {
      setStep(1);
      setSelectedCategory(null);
      setSelectedIndex(null);
      setSelectedCivilCaseType(null);
      setCard({
        original_name: '',
        case_category: '',
        pub_date: '',
        preliminary_hearing: '',
        registry_index: '',
        case_type: '',
      });
      setNextNumber(null);
    }
  };

  if (!isAuthenticated()) {
    return (
      <div className={styles.formContainer}>
        <h3>Для создания карточек требуется авторизация</h3>
        <p>Пожалуйста, войдите в систему</p>
        {onCancel && (
          <MyButton onClick={onCancel} className={styles.secondaryButton}>
            Отмена
          </MyButton>
        )}
      </div>
    );
  }

  // Шаг 1: Выбор категории
  if (step === 1) {
    return (
      <div className={styles.formContainer}>
        <div className={styles.breadcrumbs}>
          <span className={styles.breadcrumbActive}>Выбор категории</span>
          <span className={styles.breadcrumbSeparator}>→</span>
          <span className={styles.breadcrumbItem}>Подтверждение</span>
          <span className={styles.breadcrumbSeparator}>→</span>
          <span className={styles.breadcrumbItem}>Создание</span>
        </div>

        <div className={styles.progressBar}>
          <div className={styles.progressLine} />
          <div className={styles.progressFill} style={{ width: '33%' }} />
          
          <div className={styles.progressStep}>
            <div className={`${styles.stepIndicator} ${styles.active}`}>1</div>
            <span className={`${styles.stepLabel} ${styles.active}`}>Категория</span>
          </div>
          <div className={styles.progressStep}>
            <div className={styles.stepIndicator}>2</div>
            <span className={styles.stepLabel}>Подтверждение</span>
          </div>
          <div className={styles.progressStep}>
            <div className={styles.stepIndicator}>3</div>
            <span className={styles.stepLabel}>Создание</span>
          </div>
        </div>

        <h3>Выберите категорию дела</h3>

        {isCategoriesLoading ? (
          <div className={styles.loadingState}>
            <span className={styles.loadingSpinner} />
            <p>Загрузка категорий...</p>
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className={styles.categoriesGrid}>
            {filteredCategories.map(category => (
              <button
                key={category.id}
                className={`${styles.categoryCard} ${getCategoryIcon(category.title_category)}`}
                onClick={() => handleCategorySelect(category)}
              >
                <div className={styles.categoryTitle}>{category.title_category}</div>
                <div className={styles.categoryDescription}>
                  {getCategoryDescription(category.title_category)}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>🔍</div>
            <p>Категории не найдены</p>
          </div>
        )}

        {onCancel && (
          <button 
            onClick={onCancel} 
            className={styles.secondaryButton}
            style={{ marginTop: '1rem' }}
          >
            Отмена
          </button>
        )}
      </div>
    );
  }

  // Шаг 2: Подтверждение создания с выбором индекса и вида производства для гражданских дел
  return (
    <div className={styles.formContainer}>
      <div className={styles.breadcrumbs}>
        <button 
          onClick={() => setStep(1)} 
          className={styles.breadcrumbItem}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4299e1' }}
        >
          ← Выбор категории
        </button>
        <span className={styles.breadcrumbSeparator}>→</span>
        <span className={styles.breadcrumbActive}>Подтверждение</span>
        <span className={styles.breadcrumbSeparator}>→</span>
        <span className={styles.breadcrumbItem}>Создание</span>
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progressLine} />
        <div className={styles.progressFill} style={{ width: '66%' }} />
        
        <div className={styles.progressStep}>
          <div className={`${styles.stepIndicator} ${styles.completed}`}>✓</div>
          <span className={styles.stepLabel}>Категория</span>
        </div>
        <div className={styles.progressStep}>
          <div className={`${styles.stepIndicator} ${styles.active}`}>2</div>
          <span className={`${styles.stepLabel} ${styles.active}`}>Подтверждение</span>
        </div>
        <div className={styles.progressStep}>
          <div className={styles.stepIndicator}>3</div>
          <span className={styles.stepLabel}>Создание</span>
        </div>
      </div>

      <div className={styles.confirmationCard}>
        <h3>Создание нового дела</h3>
        
        <div className={styles.infoRow}>
          <strong>Категория:</strong>
          <span>{selectedCategory?.title_category}</span>
        </div>
        
        <div className={styles.infoRow}>
          <strong>Тип производства:</strong>
          <span className={styles.statusBadge}>
            {getCategoryDescription(selectedCategory?.title_category)}
          </span>
        </div>

        {/* Выбор индекса дела */}
        <div className={styles.formGroup} style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="registryIndex" className={styles.label}>
            Индекс дела <span className={styles.required}>*</span>
          </label>
          <select
            id="registryIndex"
            className={styles.select}
            value={card.registry_index || ''}
            onChange={handleIndexSelect}
            required
          >
            <option value="">Выберите индекс дела</option>
            {filteredIndexes.map((index) => (
              <option key={index.id || index.index} value={index.index}>
                {index.index} - {index.name}
              </option>
            ))}
          </select>
          {filteredIndexes.length === 0 && (
            <div className={styles.warningMessage}>
              ⚠️ Для выбранной категории нет доступных индексов
            </div>
          )}
        </div>

        {/* Для гражданских дел с индексом 2 показываем выбор вида производства */}
        {getProceedingType(selectedCategory) === 'civil' && 
         selectedIndex && selectedIndex.index === '2' && (
          <div className={styles.formGroup} style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="civilCaseType" className={styles.label}>
              Вид производства <span className={styles.required}>*</span>
            </label>
            <select
              id="civilCaseType"
              className={styles.select}
              value={selectedCivilCaseType || ''}
              onChange={handleCivilCaseTypeChange}
              required
            >
              <option value="">Выберите вид производства</option>
              {civilCaseTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className={styles.helpText}>
              Выберите конкретный вид гражданского производства
            </div>
          </div>
        )}
        
        {selectedIndex && (
          <>
            <div className={styles.previewSection}>
              <div className={styles.previewTitle}>Номер дела</div>
              <div className={styles.previewNumber}>
                {isGeneratingNumber ? (
                  <span className={styles.loadingSpinner} />
                ) : (
                  card.original_name || 'Номер не сгенерирован'
                )}
              </div>
              <div className={styles.previewHint}>
                Индекс: {card.registry_index || 'Не указан'}
              </div>
            </div>
            
            <div className={styles.infoRow}>
              <strong>Описание индекса:</strong>
              <span>{selectedIndex.name}</span>
            </div>

            {/* Отображаем выбранный вид производства для гражданских дел */}
            {getProceedingType(selectedCategory) === 'civil' && card.case_type && (
              <div className={styles.infoRow}>
                <strong>Вид производства:</strong>
                <span className={styles.statusBadge}>
                  {civilCaseTypeOptions.find(opt => opt.value === card.case_type)?.label || 'Не указан'}
                </span>
              </div>
            )}
          </>
        )}
        
        <div className={styles.infoRow}>
          <strong>Автор:</strong>
          <span>{user ? `${user.first_name} ${user.last_name}` : 'Система'}</span>
        </div>
        
        <div className={styles.infoRow}>
          <strong>Дата создания:</strong>
          <span>{new Date().toLocaleDateString('ru-RU')}</span>
        </div>
        
        {selectedCategory && (
          <div className={styles.infoMessage}>
            ℹ️ После создания вы будете перенаправлены на страницу{' '}
            {getProceedingType(selectedCategory) === 'criminal' ? 'уголовного' :
             getProceedingType(selectedCategory) === 'civil' ? 'гражданского' : ''} 
            дела для заполнения дополнительной информации.
          </div>
        )}
        
        <div className={styles.buttonGroup}>
          <button 
            className={styles.primaryButton}
            onClick={handleCreateAndRedirect}
            disabled={
              loading || 
              isGeneratingNumber || 
              !card.original_name || 
              !selectedIndex ||
              (getProceedingType(selectedCategory) === 'civil' && 
               selectedIndex.index === '2' && 
               !selectedCivilCaseType)
            }
          >
            {loading && <span className={styles.loadingSpinner} />}
            {loading ? 'Создание...' : 
              getProceedingType(selectedCategory) === 'criminal' ? 'Создать уголовное дело →' :
              getProceedingType(selectedCategory) === 'civil' ? 'Создать гражданское дело →' :
              'Создать карточку →'
            }
          </button>
          
          <button 
            className={styles.secondaryButton}
            onClick={() => setStep(1)}
            disabled={loading}
          >
            ← Назад
          </button>
          
          {onCancel && (
            <button 
              className={styles.dangerButton}
              onClick={onCancel}
              disabled={loading}
            >
              Отмена
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryBasedForm;