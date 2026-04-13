import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CardService from '../API/CardService';
import CriminalCaseService from '../API/CriminalCaseService';
import CivilCaseService from '../API/CivilCaseService';
import AdministrativeCaseService from '../API/AdministrativeCaseService';
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
  const [selectedSubIndex, setSelectedSubIndex] = useState(null);
  const [availableSubIndexes, setAvailableSubIndexes] = useState([]);
  const [selectedCivilCaseType, setSelectedCivilCaseType] = useState(null);
  const [selectedAdminOffenseType, setSelectedAdminOffenseType] = useState(null);
  const [nextNumber, setNextNumber] = useState(null);
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] = useState([]);
  
  // Маппинг индексов для гражданских дел на значения case_type
  const civilCaseTypeMapping = {
    '2': null,
  };

  // Типы производств для отображения в UI (гражданские)
  const civilCaseTypeOptions = [
    { value: '1', label: 'Исковое производство' },
    { value: '2', label: 'Приказное производство' },
    { value: '3', label: 'Особое производство' },
    { value: '4', label: 'Упрощенное производство' },
    { value: '5', label: 'Производство по исполнению судебных постановлений' },
  ];

  // Типы административных правонарушений для отображения в UI
  const adminOffenseTypeOptions = [
    { value: '5', label: 'Дело об административном правонарушении (индекс 5)' },
    { value: '12', label: 'Дело по жалобе на постановление по делу об АП (индекс 12)' },
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
      // Сбрасываем подындекс при смене основного индекса
      setSelectedSubIndex(null);
      setAvailableSubIndexes([]);
      
      // Если выбран индекс 2 (базовый), показываем выбор типа производства
      if (selectedIndex.index === '2') {
        setSelectedCivilCaseType(null);
        setSelectedAdminOffenseType(null);
      } 
      // Если выбран индекс 3, 4 или 8 - загружаем подындексы
      else if (['3', '4', '8'].includes(selectedIndex.index)) {
        loadSubIndexes(selectedIndex.index);
        setSelectedCivilCaseType(null);
        setSelectedAdminOffenseType(null);
      }
      // Если выбран индекс 5 или 12 (административные правонарушения)
      else if (selectedIndex.index === '5' || selectedIndex.index === '12') {
        setSelectedAdminOffenseType(selectedIndex.index);
        setSelectedCivilCaseType(null);
        setCard(prev => ({
          ...prev,
          case_type: selectedIndex.index // Сохраняем индекс как case_type для идентификации типа
        }));
      } 
      else {
        // Если выбран другой индекс
        setSelectedCivilCaseType(null);
        setSelectedAdminOffenseType(null);
        setCard(prev => ({
          ...prev,
          case_type: ''
        }));
      }
    }
  }, [selectedIndex]);

  // Обработка выбора подындекса
  useEffect(() => {
    if (selectedSubIndex) {
      // Обновляем номер дела при выборе подындекса
      updateCaseNumber(selectedSubIndex.index);
      
      setCard(prev => ({
        ...prev,
        registry_index: selectedSubIndex.index,
        case_type: '' // Сбрасываем case_type для уголовных дел
      }));
    }
  }, [selectedSubIndex]);

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
        const indexCode = editCardData.registry_index;
        
        // Проверяем, является ли индекс подындексом (содержит '/')
        if (indexCode.includes('/')) {
          const baseIndex = indexCode.split('/')[0];
          const baseIndexObj = registryIndexes.find(idx => idx.index === baseIndex);
          setSelectedIndex(baseIndexObj);
          
          // Загружаем подындексы и выбираем нужный
          loadSubIndexes(baseIndex);
          
          // После загрузки подындексов выберем нужный
          setTimeout(() => {
            const subIndexObj = registryIndexes.find(idx => idx.index === indexCode);
            if (subIndexObj) {
              setSelectedSubIndex(subIndexObj);
            }
          }, 100);
        } else {
          const indexObj = registryIndexes.find(idx => idx.index === indexCode);
          setSelectedIndex(indexObj);
        }
        
        // Если индекс 5 или 12, устанавливаем тип административного правонарушения
        if (indexCode === '5' || indexCode === '12') {
          setSelectedAdminOffenseType(indexCode);
        }
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
      
      // Функция для естественной сортировки индексов
      const sortIndexes = (a, b) => {
        const aParts = a.index.split('/');
        const bParts = b.index.split('/');
        
        // Сравниваем основные части
        const aMain = parseInt(aParts[0]) || aParts[0];
        const bMain = parseInt(bParts[0]) || bParts[0];
        
        if (aMain !== bMain) {
          // Если основные части разные, сравниваем как числа или строки
          if (typeof aMain === 'number' && typeof bMain === 'number') {
            return aMain - bMain;
          }
          return String(aMain).localeCompare(String(bMain));
        }
        
        // Если основные части равны и есть подчасти
        if (aParts.length > 1 && bParts.length > 1) {
          return parseInt(aParts[1]) - parseInt(bParts[1]);
        }
        
        // Если у одного есть подчасть, а у другого нет
        if (aParts.length > 1) return 1;
        if (bParts.length > 1) return -1;
        
        return 0;
      };
      
      const sortedIndexes = [...(indexes || [])].sort(sortIndexes);
      setRegistryIndexes(sortedIndexes);
      setFilteredIndexes(sortedIndexes);
    } catch (error) {
      console.error('Ошибка загрузки индексов:', error);
      setRegistryIndexes([]);
      setFilteredIndexes([]);
    }
  };

  // Загрузка подындексов для указанного базового индекса
  const loadSubIndexes = (baseIndex) => {
    const subIndexes = registryIndexes.filter(idx => 
      idx.index.startsWith(`${baseIndex}/`)
    );
    
    // Сортируем подындексы по числовому значению
    const sortedSubIndexes = subIndexes.sort((a, b) => {
      const aNum = parseInt(a.index.split('/')[1]);
      const bNum = parseInt(b.index.split('/')[1]);
      return aNum - bNum;
    });
    
    setAvailableSubIndexes(sortedSubIndexes);
  };

  // Фильтрация индексов по категории дела
  const filterIndexesByCategory = (category) => {
    if (!category || !registryIndexes.length) return;
    
    const categoryName = category.title_category.toLowerCase();
    let filtered = [];
    
    // Определяем, какие индексы относятся к выбранной категории
    if (categoryName.includes('уголов')) {
      // Уголовное судопроизводство: основные индексы 1, 3, 4, 6, 7, 8, 9у, 10, 14
      // Показываем только основные индексы (без подындексов)
      filtered = registryIndexes.filter(idx => {
        const index = idx.index;
        // Не включаем подындексы в основной список
        if (index.includes('/')) return false;
        
        return ['1', '3', '4', '6', '7', '8', '9у', '10', '14'].includes(index);
      });
    } else if (categoryName.includes('граждан')) {
      // Гражданское судопроизводство: индексы 2, 11, 13
      filtered = registryIndexes.filter(idx => 
        ['2', '11', '13'].includes(idx.index) && !idx.index.includes('/')
      );
    } else if (categoryName.includes('коап')) {
      // Административные правонарушения (КоАП): индексы 5, 12
      filtered = registryIndexes.filter(idx => 
        ['5', '12'].includes(idx.index) && !idx.index.includes('/')
      );
    } else if (categoryName.includes('административ')) {
      // Административное судопроизводство: индексы 2а, 9а, 13а
      filtered = registryIndexes.filter(idx => 
        ['2а', '9а', '13а'].includes(idx.index)
      );
    } else if (categoryName.includes('прочие')) {
      // Прочие материалы: индексы 15
      filtered = registryIndexes.filter(idx => 
        ['15'].includes(idx.index) && !idx.index.includes('/')
      );
    } else {
      // По умолчанию - все основные индексы
      filtered = registryIndexes.filter(idx => !idx.index.includes('/'));
    }
    
    // Сортируем отфильтрованные индексы
    const sortBasicIndexes = (a, b) => {
      const aIsNumber = !isNaN(parseInt(a.index));
      const bIsNumber = !isNaN(parseInt(b.index));
      
      if (aIsNumber && bIsNumber) {
        return parseInt(a.index) - parseInt(b.index);
      }
      if (aIsNumber) return -1;
      if (bIsNumber) return 1;
      
      // Для индексов с буквами (2а, 9а и т.д.)
      return a.index.localeCompare(b.index);
    };
    
    filtered.sort(sortBasicIndexes);
    setFilteredIndexes(filtered);
  };

  const updateCaseNumber = async (indexCode) => {
    if (!indexCode) return;
    
    try {
      setIsGeneratingNumber(true);
      const nextNum = await CaseRegistryService.getNextNumber(indexCode);
      setNextNumber(nextNum);
      
      if (nextNum) {
        const caseNumber = `${indexCode}-${nextNum}/${currentYear}`;
        setCard(prev => ({
          ...prev,
          original_name: caseNumber
        }));
      }
    } catch (error) {
      console.error('Ошибка получения следующего номера:', error);
    } finally {
      setIsGeneratingNumber(false);
    }
  };

  const getCategoryDescription = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes('уголов')) return 'Уголовное дело';
    if (name.includes('граждан')) return 'Гражданское дело';
    if (name.includes('коап')) return 'Административное правонарушение (КоАП)';
    if (name.includes('административ')) return 'Административное дело';
    if (name.includes('прочие')) return 'Прочие материалы';
    return 'Обычная карточка';
  };

  const getCategoryIcon = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes('уголов')) return styles.criminalIcon;
    if (name.includes('граждан')) return styles.civilIcon;
    if (name.includes('административ')) return styles.adminIcon;
    if (name.includes('коап')) return styles.adminOffenseIcon;
    if (name.includes('прочие')) return styles.otherIcon;
    return styles.defaultIcon;
  };

  const getProceedingType = (category) => {
    if (!category) return 'unknown';
    
    const name = category.title_category.toLowerCase();
    if (name.includes('уголов')) return 'criminal';
    if (name.includes('граждан')) return 'civil';
    if (name.includes('коап')) return 'administrative-offense';
    if (name.includes('административ')) return 'administrative';
    if (name.includes('прочие')) return 'other';
    return 'regular';
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSelectedIndex(null);
    setSelectedSubIndex(null);
    setSelectedCivilCaseType(null);
    setSelectedAdminOffenseType(null);
    setAvailableSubIndexes([]);
    setStep(2);
  };

  const handleIndexSelect = async (e) => {
    const indexCode = e.target.value;
    const index = filteredIndexes.find(idx => idx.index === indexCode);
    setSelectedIndex(index);
    
    if (indexCode) {
      // Если это индекс 3, 4 или 8, не генерируем номер сразу
      // Ждем выбора подындекса
      if (['3', '4', '8'].includes(indexCode)) {
        setCard(prev => ({
          ...prev,
          case_category: selectedCategory.id,
          registry_index: '', // Пока не устанавливаем
          pub_date: new Date().toISOString().split('T')[0],
        }));
      } else {
        // Для остальных индексов генерируем номер сразу
        await updateCaseNumber(indexCode);
        
        setCard(prev => ({
          ...prev,
          case_category: selectedCategory.id,
          registry_index: indexCode,
          pub_date: new Date().toISOString().split('T')[0],
          case_type: getProceedingType(selectedCategory) === 'civil' ? '' : indexCode,
        }));
      }
    }
  };

  const handleSubIndexSelect = async (e) => {
    const subIndexCode = e.target.value;
    const subIndex = availableSubIndexes.find(idx => idx.index === subIndexCode);
    setSelectedSubIndex(subIndex);
    
    if (subIndexCode) {
      await updateCaseNumber(subIndexCode);
      
      setCard(prev => ({
        ...prev,
        case_category: selectedCategory.id,
        registry_index: subIndexCode,
        pub_date: new Date().toISOString().split('T')[0],
        case_type: '', // Для уголовных дел case_type не используется
      }));
    }
  };

  const handleAdminOffenseTypeChange = (e) => {
    const offenseType = e.target.value;
    setSelectedAdminOffenseType(offenseType);
    setCard(prev => ({
      ...prev,
      case_type: offenseType,
      registry_index: offenseType // Обновляем индекс при выборе типа
    }));
    
    // Перегенерируем номер с новым индексом
    if (offenseType) {
      updateCaseNumber(offenseType);
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
    if (!selectedCategory || !card.original_name) {
      alert('Пожалуйста, выберите категорию и дождитесь генерации номера дела');
      return;
    }

    // Проверяем наличие выбранного индекса (основного или подындекса)
    const finalIndexCode = selectedSubIndex ? selectedSubIndex.index : 
                          (selectedIndex ? selectedIndex.index : null);
    
    if (!finalIndexCode) {
      alert('Пожалуйста, выберите индекс дела');
      return;
    }

    const proceedingType = getProceedingType(selectedCategory);
    
    // Для гражданских дел с индексом 2 проверяем, что выбран тип производства
    if (proceedingType === 'civil' && 
        finalIndexCode === '2' && 
        !selectedCivilCaseType) {
      alert('Пожалуйста, выберите вид производства (исковое, приказное и т.д.)');
      return;
    }
    
    setLoading(true);
    try {
      const indexCode = finalIndexCode;
      
      // Извлекаем номер из полного номера
      const fullNumberPattern = new RegExp(`${indexCode.replace('/', '\\/')}-(\\d+)/${currentYear}`);
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
      
      // УБИРАЕМ РУЧНУЮ РЕГИСТРАЦИЮ ЧЕРЕЗ registerCase
      // Дело будет автоматически зарегистрировано через сигналы при создании производства
      
      // Создаем производство в зависимости от типа
      if (proceedingType === 'criminal') {
        const criminalData = {
          case_number_criminal: card.original_name,
          status: 'active'
          // НЕ ПЕРЕДАЕМ registered_case_id - он установится автоматически через сигнал
        };
        const proceeding = await CriminalCaseService.createCriminalProceedings(criminalData);
        
        if (create) create(proceeding);
        navigate(`/criminal-proceedings/${proceeding.id}`);
        
      } else if (proceedingType === 'civil') {
        const civilData = {
          case_number_civil: card.original_name,
          status: 'active',
          case_type: card.case_type || '',
          // НЕ ПЕРЕДАЕМ registered_case_id - он установится автоматически через сигнал
        };
        
        const proceeding = await CivilCaseService.createCivilProceedings(civilData);
        
        if (create) create(proceeding);
        navigate(`/civil-proceedings/${proceeding.id}`);
        
      } else if (proceedingType === 'administrative-offense') {
        // Создание административного правонарушения (КоАП)
        const adminData = {
          case_number_admin: card.original_name,
          status: 'active',
          offense_type: card.case_type || indexCode, // Сохраняем тип правонарушения (5 или 12)
        };
        
        const proceeding = await AdministrativeCaseService.createAdministrativeProceedings(adminData);
        
        if (create) create(proceeding);
        navigate(`/admin-proceedings/${proceeding.id}`);
        
      } else if (proceedingType === 'administrative') {
        // Создание административного дела (КАС РФ)
        console.log('Создание административного дела (КАС РФ) с номером:', card.original_name);
        
        // Импортируем сервис для КАС дел
        const KasCaseService = (await import('../API/KasCaseService')).default;
        
        const kasData = {
          case_number_kas: card.original_name,
          status: 'active',
        };
        
        const proceeding = await KasCaseService.createKasProceedings(kasData);
        
        if (create) create(proceeding);
        navigate(`/kas-proceedings/${proceeding.id}`);
        
      } else if (proceedingType === 'other') {
        // Создание иных материалов (индекс 15)
        console.log('Создание иных материалов с номером:', card.original_name);
        
        // Импортируем сервис для иных материалов
        const OtherMaterialService = (await import('../API/OtherMaterialService')).default;
        
        const otherMaterialData = {
          registration_number: card.original_name,
          title: card.original_name, // Временно используем номер как название
          status: 'active',
          registration_date: new Date().toISOString().split('T')[0],
        };
        
        const proceeding = await OtherMaterialService.createOtherMaterial(otherMaterialData);
        
        if (create) create(proceeding);
        navigate(`/other-materials/${proceeding.id}`);
      } else {
        // Если тип не определен, показываем сообщение об ошибке
        console.error('Неизвестный тип производства:', proceedingType);
        alert(`Неизвестный тип производства: ${proceedingType}`);
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
      setSelectedSubIndex(null);
      setSelectedCivilCaseType(null);
      setSelectedAdminOffenseType(null);
      setAvailableSubIndexes([]);
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

  // Шаг 2: Подтверждение создания с выбором индекса
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
            value={selectedIndex?.index || ''}
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

        {/* Выбор подындекса для уголовных дел (3, 4, 8) */}
        {selectedIndex && ['3', '4', '8'].includes(selectedIndex.index) && (
          <div className={styles.formGroup} style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="subIndex" className={styles.label}>
              Выберите конкретный вид дела <span className={styles.required}>*</span>
            </label>
            <select
              id="subIndex"
              className={styles.select}
              value={selectedSubIndex?.index || ''}
              onChange={handleSubIndexSelect}
              required
            >
              <option value="">Выберите вид дела</option>
              {availableSubIndexes.map((subIndex) => (
                <option key={subIndex.id || subIndex.index} value={subIndex.index}>
                  {subIndex.index} - {subIndex.name}
                </option>
              ))}
            </select>
            {availableSubIndexes.length === 0 && (
              <div className={styles.warningMessage}>
                ⚠️ Для индекса {selectedIndex.index} нет доступных подындексов
              </div>
            )}
            <div className={styles.helpText}>
              Выберите конкретный вид уголовного дела
            </div>
          </div>
        )}

        {/* Для административных правонарушений (КоАП) показываем дополнительную информацию */}
        {getProceedingType(selectedCategory) === 'administrative-offense' && selectedIndex && (
          <div className={styles.infoMessage} style={{ marginBottom: '1.5rem' }}>
            {selectedIndex.index === '5' ? (
              <p>📋 Создается <strong>дело об административном правонарушении (КоАП)</strong> (индекс 5)</p>
            ) : selectedIndex.index === '12' ? (
              <p>📋 Создается <strong>дело по жалобе на постановление по делу об административном правонарушении (КоАП)</strong> (индекс 12)</p>
            ) : null}
          </div>
        )}

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
        
        {(selectedIndex || selectedSubIndex) && (
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
                Индекс: {selectedSubIndex?.index || selectedIndex?.index || 'Не указан'}
              </div>
            </div>
            
            <div className={styles.infoRow}>
              <strong>Описание индекса:</strong>
              <span>{selectedSubIndex?.name || selectedIndex?.name || ''}</span>
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

            {/* Отображаем информацию для административных правонарушений (КоАП) */}
            {getProceedingType(selectedCategory) === 'administrative-offense' && (
              <div className={styles.infoRow}>
                <strong>Тип дела:</strong>
                <span className={styles.statusBadge}>
                  {selectedIndex?.index === '5' ? 'Дело об АП (КоАП)' : 
                   selectedIndex?.index === '12' ? 'Жалоба на постановление по АП (КоАП)' : 
                   'Административное правонарушение (КоАП)'}
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
             getProceedingType(selectedCategory) === 'civil' ? 'гражданского' :
             getProceedingType(selectedCategory) === 'administrative-offense' ? 'дела об административном правонарушении (КоАП)' :
             getProceedingType(selectedCategory) === 'administrative' ? 'административного дела (КАС РФ)' :
             getProceedingType(selectedCategory) === 'other' ? 'прочих материалов' : ''} 
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
              !(selectedIndex || selectedSubIndex) ||
              (selectedIndex && ['3', '4', '8'].includes(selectedIndex.index) && !selectedSubIndex) ||
              (getProceedingType(selectedCategory) === 'civil' && 
               selectedIndex?.index === '2' && 
               !selectedCivilCaseType)
            }
          >
            {loading && <span className={styles.loadingSpinner} />}
            {loading ? 'Создание...' : 
              getProceedingType(selectedCategory) === 'criminal' ? 'Создать уголовное дело →' :
              getProceedingType(selectedCategory) === 'civil' ? 'Создать гражданское дело →' :
              getProceedingType(selectedCategory) === 'administrative-offense' ? 'Создать дело об АП (КоАП) →' :
              getProceedingType(selectedCategory) === 'administrative' ? 'Создать административное дело (КАС РФ) →' :
              getProceedingType(selectedCategory) === 'other' ? 'Создать прочие материалы →' :
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