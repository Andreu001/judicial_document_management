import React, { useState, useEffect } from 'react';
import MyInput from '../../components/UI/input/MyInput';
import MyButton from '../../components/UI/button/MyButton';
import SideService from '../../API/SideService';
import styles from '../../components//UI/input/Input.module.css';
import baseService from '../../API/baseService';
import LawyerService from '../../API/LawyerService';
import CriminalCaseService from '../../API/CriminalCaseService';

const SidesForm = ({ create, editSideData = {}, onSave, onCancel, cardId }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingSideId, setEditingSideId] = useState(null);

    const [side, setSide] = useState({
      name: '',
      sides_case: [],
      date_sending_agenda: '',
      business_card: cardId,
    });
  
    const [sidesCaseList, setsidesCaseList] = useState([]);
  
    useEffect(() => {
      baseService
        .get('http://localhost:8000/business_card/sides/')
        .then((response) => {
          setsidesCaseList(response.data);
        })
        .catch((error) => {
          console.error('Error fetching category list:', error);
        });
    
      if (editSideData) {
        setIsEditing(true);
        setSide((prevSide) => ({
          ...prevSide,
          ...editSideData,
          sides_case: editSideData.sides_case ? editSideData.sides_case : [],
        }));
        setEditingSideId(editSideData.id);
      }
    }, [editSideData, cardId]);
    
  
    const handleCancel = () => {
      setIsEditing(false);
      onCancel();
    };
  
    const handleChange = (e) => {
      const { name, value, type } = e.target;
    
      if (name === 'sides_case') {
        // Преобразуем строку в массив чисел
        const sideCaseArray = value ? [parseInt(value)] : [];
        setSide((prevSide) => ({
          ...prevSide,
          [name]: sideCaseArray,
        }));
      } else {
        setSide((prevSide) => ({
          ...prevSide,
          [name]: value,
        }));
      }
    };
    
    const handleAddNewSide = async (e) => {
      e.preventDefault();
    
      // Проверяем, выбрана ли сторона
      if (!side.sides_case || side.sides_case.length === 0) {
        console.error('Не выбрана сторона по делу');
        alert('Пожалуйста, выберите сторону по делу');
        return;
      }
    
      try {
        // Получаем ID выбранной стороны дела
        const selectedSideCaseId = side.sides_case[0];
        
        // Проверяем, является ли выбранная сторона адвокатом/защитником
        const selectedSideCase = sidesCaseList.find(sc => sc.id === selectedSideCaseId);
        const isLawyer = selectedSideCase && 
          (selectedSideCase.sides_case.toLowerCase().includes('адвокат') || 
           selectedSideCase.sides_case.toLowerCase().includes('защитник'));
        
        // Проверяем, является ли выбранная сторона обвиняемым/осужденным/подозреваемым/подсудимым
        const isDefendant = [8, 9, 12, 13].includes(selectedSideCaseId);
        
        console.log('Выбранная сторона:', selectedSideCase);
        console.log('Это адвокат?', isLawyer);
        console.log('Это обвиняемый/подсудимый?', isDefendant);
        
        if (isLawyer) {
          // Если выбрана сторона "Адвокат" или "Защитник", создаем запись в таблице адвокатов
          const lawyerData = {
            name: side.name,
            sides_case: side.sides_case, // Отправляем как массив
          };
          
          console.log('Создание адвоката:', lawyerData);
          
          try {
            // Создаем адвоката
            const response = await LawyerService.createLawyer(cardId, lawyerData);
            console.log('Адвокат создан:', response);
            
            // Если функция create существует и нужно обновить список
            if (create) {
              create(response);
            }
          } catch (lawyerError) {
            console.error('Ошибка создания адвоката:', lawyerError);
            // Пробуем альтернативный формат
            try {
              const alternativeLawyerData = {
                name: side.name,
                sides_case_incase: side.sides_case[0], // ID как число
              };
              
              console.log('Пробуем альтернативный формат:', alternativeLawyerData);
              
              const altResponse = await baseService.post(
                `/business_card/businesscard/${cardId}/lawyers/`,
                alternativeLawyerData
              );
              
              console.log('Адвокат создан (альтернативный формат):', altResponse.data);
              
              if (create) {
                create(altResponse.data);
              }
            } catch (altError) {
              console.error('Ошибка в альтернативном формате:', altError);
              throw altError;
            }
          }
        } else if (isDefendant) {
          // Если выбрана сторона обвиняемый/осужденный/подозреваемый/подсудимый, создаем запись в таблице обвиняемых
          const defendantData = {
            name: side.name,
            sides_case: side.sides_case, // ID стороны дела как массив
          };
          
          console.log('Создание обвиняемого/подсудимого:', defendantData);
          
          try {
            // Создаем обвиняемого через CriminalCaseService
            const response = await CriminalCaseService.createDefendant(cardId, defendantData);
            console.log('Обвиняемый/подсудимый создан:', response);
            
            // Если функция create существует и нужно обновить список
            if (create) {
              create(response);
            }
          } catch (defendantError) {
            console.error('Ошибка создания обвиняемого/подсудимого:', defendantError);
            
            // Пробуем создать через baseService напрямую
            try {
              console.log('Пробуем создать через baseService напрямую');
              
              const response = await baseService.post(
                `http://localhost:8000/criminal_proceedings/businesscard/${cardId}/defendants/`,
                defendantData
              );
              
              console.log('Обвиняемый/подсудимый создан (через baseService):', response.data);
              
              if (create) {
                create(response.data);
              }
            } catch (baseError) {
              console.error('Ошибка создания через baseService:', baseError);
              throw baseError;
            }
          }
        } else {
          // Для всех остальных сторон создаем обычную запись
          const newSideData = {
            name: side.name,
            sides_case: side.sides_case,
            date_sending_agenda: side.date_sending_agenda ? formatDate(side.date_sending_agenda) : null,
            business_card: side.business_card,
          };
          
          if (newSideData.date_sending_agenda === null) {
            delete newSideData.date_sending_agenda;
          }
          
          if (editingSideId) {
            // Редактирование существующей стороны
            const response = await SideService.updateSide(cardId, editingSideId, newSideData);
            onSave(response.data);
          } else {
            // Создание новой стороны
            const response = await baseService.post(
              `http://localhost:8000/business_card/businesscard/${cardId}/sidescaseincase/`,
              newSideData
            );
            if (create) {
              create(response.data);
            }
          }
        }
        
        onCancel();
    
        setSide({
          name: '',
          sides_case: [],
          date_sending_agenda: '',
          business_card: cardId,
        });
      } catch (error) {
        console.error('Ошибка создания/обновления стороны:', error);
        console.error('Дополнительные сведения:', error.response?.data || error.message);

        if (error.response?.data) {
          console.error('Данные ошибки с сервера:', error.response.data);
          alert(`Ошибка: ${JSON.stringify(error.response.data)}`);
        }
      }
    };
  
    const formatDate = (inputDate) => {
      const date = new Date(inputDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
  
    return (
      <div className={styles.formContainer}>
        <form>
          <div className={styles.formGroup}>
            <label>Ф.И.О.</label>
            <MyInput
              type="text"
              name="name"
              value={side.name || editSideData.name || ''}
              onChange={handleChange}
              placeholder="ФИО"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Сторона по делу</label>
            <select
              name="sides_case"
              value={side.sides_case.length > 0 ? side.sides_case[0] : ''}
              onChange={handleChange}
              required
            >
              <option value="">Выберите Название стороны</option>
              {sidesCaseList.map((sideCase, index) => (
                <option key={index} value={sideCase.id}>
                  {sideCase.sides_case}
                </option>
              ))}
            </select>
          </div>
          {isEditing ? (
            <>
              <MyButton onClick={handleAddNewSide}>Сохранить</MyButton>
              <MyButton onClick={handleCancel}>Отменить</MyButton>
            </>
          ) : null}
        </form>
      </div>
    );
  };
  
  export default SidesForm;