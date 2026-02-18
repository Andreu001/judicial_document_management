import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MyInput from './UI/input/MyInput';
import MyButton from './UI/button/MyButton';
import CardService from '../API/CardService';
import CriminalCaseService from '../API/CriminalCaseService';
import CivilCaseService from '../API/CivilCaseService';
import CaseRegistryService from '../API/CaseRegistryService';
import styles from './UI/input/Input.module.css';
import { useProtectedFetching } from '../hooks/useProtectedFetching';
import { useAuth } from '../context/AuthContext';

const CardForm = ({ create, editCardData, onSave, onCancel }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedCardData, setEditedCardData] = useState({ ...editCardData });
  const [card, setCard] = useState({
    original_name: '',
    case_category: '',
    pub_date: '',
    preliminary_hearing: '',
    registry_index: '',
  });
  
  const [categoryList, setCategoryList] = useState([]);
  const [registryIndexes, setRegistryIndexes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [nextNumber, setNextNumber] = useState('');
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false);
  
  const { isAuthenticated, user } = useAuth();
  const [fetchCategories, isCategoriesLoading] = useProtectedFetching();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (isAuthenticated()) {
      loadCategories();
      loadRegistryIndexes();
    }

    if (editCardData) {
      setIsEditing(true);
      setCard({ ...editCardData });
      setEditedCardData({ ...editCardData });
      
      // Определяем выбранную категорию при редактировании
      if (editCardData.case_category) {
        const category = categoryList.find(cat => cat.id === parseInt(editCardData.case_category));
        setSelectedCategory(category);
      }
    }
  }, [editCardData, isAuthenticated, categoryList]);

  // Загрузка категорий
  const loadCategories = async () => {
    try {
      await fetchCategories(async () => {
        const categories = await CardService.getCategories();
        setCategoryList(categories);
      });
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Загрузка индексов регистрации
  const loadRegistryIndexes = async () => {
    try {
      const indexes = await CaseRegistryService.getIndexes();
      setRegistryIndexes(indexes || []);
    } catch (error) {
      console.error('Ошибка загрузки индексов:', error);
      setRegistryIndexes([]);
    }
  };

  // Получение следующего номера для выбранного индекса
  const getNextNumber = async (indexCode) => {
    try {
      setIsGeneratingNumber(true);
      // В реальном приложении здесь запрос к серверу
      // const nextNum = await CaseRegistryService.getNextNumber(indexCode);
      // Пока используем заглушку
      const nextNum = Math.floor(Math.random() * 1000) + 1;
      setNextNumber(nextNum);
      return nextNum;
    } catch (error) {
      console.error('Ошибка получения номера:', error);
      return null;
    } finally {
      setIsGeneratingNumber(false);
    }
  };

  // Генерация номера дела на основе индекса
  const generateCaseNumber = async (indexCode) => {
    if (!indexCode) return '';
    const nextNum = await getNextNumber(indexCode);
    return `${indexCode}-${nextNum}/${currentYear}`;
  };

  // Обработчик изменения категории
  const handleCategoryChange = async (e) => {
    const categoryId = e.target.value;
    const category = categoryList.find(cat => cat.id === parseInt(categoryId));
    setSelectedCategory(category);
    
    const indexCode = getIndexForCategory(category);
    const caseNumber = await generateCaseNumber(indexCode);
    
    setCard({ 
      ...card, 
      case_category: categoryId,
      registry_index: indexCode,
      original_name: caseNumber
    });
  };

  // Получение индекса для категории
  const getIndexForCategory = (category) => {
    if (!category) return '';
    
    const categoryName = category.title_category.toLowerCase();
    if (categoryName.includes('уголов')) return '1';
    if (categoryName.includes('граждан')) return '2';
    if (categoryName.includes('административ')) return '2а';
    if (categoryName.includes('административных правонарушен')) return '5';
    return '15';
  };

  // Обработчик ручного выбора индекса
  const handleIndexChange = async (e) => {
    const indexCode = e.target.value;
    const caseNumber = await generateCaseNumber(indexCode);
    
    setCard({ 
      ...card, 
      registry_index: indexCode,
      original_name: caseNumber
    });
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();

    if (!selectedCategory) {
      alert('Пожалуйста, выберите категорию дела');
      return;
    }

    if (!card.original_name) {
      alert('Пожалуйста, сгенерируйте номер дела');
      return;
    }

    try {
      // Создаем основную карточку
      const cardData = {
        original_name: card.original_name,
        author: user?.id || 1,
        case_category: card.case_category,
        pub_date: card.pub_date || null,
        preliminary_hearing: card.preliminary_hearing || null,
        registry_index: card.registry_index,
      };

      const categoryName = selectedCategory.title_category.toLowerCase();
        
      
      // Сбрасываем форму
      setCard({
        original_name: '',
        case_category: '',
        pub_date: '',
        preliminary_hearing: '',
        registry_index: '',
      });
      setSelectedCategory(null);
      setNextNumber('');
      
    } catch (error) {
      console.error('Ошибка создания карточки:', error.response?.data || error);
      alert(`Ошибка создания: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedCategory(null);
    setCard({
      original_name: '',
      case_category: '',
      pub_date: '',
      preliminary_hearing: '',
      registry_index: '',
    });
    setNextNumber('');
    if (onCancel) onCancel();
  };

  if (!isAuthenticated()) {
    return (
      <div className={styles.formContainer}>
        <h3>Для создания карточек требуется авторизация</h3>
        <p>Пожалуйста, войдите в систему</p>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleCreateCard}>
        {/* Блок выбора категории */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Категория дела *</label>
            <select 
              name="case_category" 
              value={card.case_category} 
              onChange={handleCategoryChange}
              required
              className={styles.select}
              disabled={isEditing} // При редактировании нельзя изменить категорию
            >
              <option value="">Выберите категорию</option>
              {categoryList.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title_category}
                </option>
              ))}
            </select>
            {selectedCategory && !isEditing && (
              <small className={styles.helpText}>
                Будет создано: {
                  selectedCategory.title_category.toLowerCase().includes('уголов') ? 'Уголовное дело' :
                  selectedCategory.title_category.toLowerCase().includes('граждан') ? 'Гражданское дело' :
                  'Обычная карточка'
                }
              </small>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Автор *</label>
            <MyInput
              type="text"
              value={user ? `${user.first_name} ${user.last_name}` : 'Неизвестный пользователь'}
              disabled
              placeholder="Автор"
            />
          </div>
        </div>

        <div className={styles.buttonGroup}>
          {isEditing ? (
            <>
              <MyButton type="submit">Сохранить изменения</MyButton>
              <MyButton 
                type="button" 
                onClick={handleCancel} 
                style={{background: '#6c757d'}}
              >
                Отмена
              </MyButton>
            </>
          ) : (
            <>
              <MyButton type="submit">
                {selectedCategory ? (
                  selectedCategory.title_category.toLowerCase().includes('уголов') ? 'Создать уголовное дело →' :
                  selectedCategory.title_category.toLowerCase().includes('граждан') ? 'Создать гражданское дело →' :
                  'Создать карточку'
                ) : 'Создать карточку'}
              </MyButton>
              <MyButton 
                type="button" 
                onClick={handleCancel} 
                style={{background: '#6c757d'}}
              >
                Отмена
              </MyButton>
            </>
          )}
        </div>
        
        {/* Информационное сообщение */}
        {selectedCategory && !isEditing && (
          <div className={styles.infoMessage} style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#e3f2fd',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            ℹ️ После создания карточки вы будете перенаправлены на страницу{' '}
            {selectedCategory.title_category.toLowerCase().includes('уголов') ? 'уголовного' :
             selectedCategory.title_category.toLowerCase().includes('граждан') ? 'гражданского' : ''} 
            {' '}дела для заполнения дополнительной информации.
          </div>
        )}
      </form>
    </div>
  );
};

export default CardForm;