// Calendar/MeetingsCalendar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CivilCaseService from '../../API/CivilCaseService';
import AdministrativeCaseService from '../../API/AdministrativeCaseService';
import KasCaseService from '../../API/KasCaseService';
import CriminalCaseService from '../../API/CriminalCaseService';
import styles from './MeetingsCalendar.module.css';

const MeetingsCalendar = ({ onClose }) => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'list'
  const calendarRef = useRef(null);
  const navigate = useNavigate();

  // Цвета для разных типов дел
  const caseTypeColors = {
    civil: { bg: '#e8f3ee', border: '#4d8b7a', text: '#2d5a4f' },
    admin: { bg: '#f5eee8', border: '#b77f5c', text: '#9e6b4f' },
    kas: { bg: '#e8f0fe', border: '#5b6f94', text: '#4a5b7a' },
    criminal: { bg: '#f0f0f0', border: '#6d6d6d', text: '#4a4a4a' }
  };

  useEffect(() => {
    fetchAllMeetings();
    
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAllMeetings = async () => {
    try {
      setLoading(true);
      const allMeetings = [];

      // 1. Получаем все гражданские дела и их движения
      try {
        const civilProceedings = await CivilCaseService.getAllCivilProceedings();
        console.log('Гражданские дела:', civilProceedings);
        
        if (Array.isArray(civilProceedings)) {
          for (const proceeding of civilProceedings) {
            try {
              const movements = await CivilCaseService.getMovements(proceeding.id);
              if (Array.isArray(movements)) {
                const extractedMeetings = extractMeetingsFromMovements(
                  movements, 
                  'civil', 
                  proceeding.id,
                  proceeding.case_number_civil,
                  proceeding.presiding_judge_full_name
                );
                allMeetings.push(...extractedMeetings);
              }
            } catch (error) {
              console.log(`Нет движений для гражданского дела ${proceeding.id}`);
            }
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки гражданских дел:', error);
      }

      // 2. Получаем все административные дела (КРФоАП)
      try {
        const adminProceedings = await AdministrativeCaseService.getAllAdministrativeProceedings();
        console.log('Административные дела:', adminProceedings);
        
        if (Array.isArray(adminProceedings)) {
          for (const proceeding of adminProceedings) {
            try {
              const movements = await AdministrativeCaseService.getMovements(proceeding.id);
              if (Array.isArray(movements)) {
                const extractedMeetings = extractMeetingsFromMovements(
                  movements, 
                  'admin', 
                  proceeding.id,
                  proceeding.case_number_admin,
                  proceeding.presiding_judge_full_name
                );
                allMeetings.push(...extractedMeetings);
              }
            } catch (error) {
              console.log(`Нет движений для админ дела ${proceeding.id}`);
            }
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки админ дел:', error);
      }

      // 3. Получаем все дела КАС
      try {
        const kasProceedings = await KasCaseService.getAllKasProceedings();
        console.log('Дела КАС:', kasProceedings);
        
        if (Array.isArray(kasProceedings)) {
          for (const proceeding of kasProceedings) {
            try {
              const movements = await KasCaseService.getMovements(proceeding.id);
              if (Array.isArray(movements)) {
                const extractedMeetings = extractMeetingsFromMovements(
                  movements, 
                  'kas', 
                  proceeding.id,
                  proceeding.case_number_kas,
                  proceeding.presiding_judge_full_name
                );
                allMeetings.push(...extractedMeetings);
              }
            } catch (error) {
              console.log(`Нет движений для дела КАС ${proceeding.id}`);
            }
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки дел КАС:', error);
      }

      // 4. Получаем все уголовные дела
      try {
        const criminalProceedings = await CriminalCaseService.getAllCriminalProceedings();
        console.log('Уголовные дела:', criminalProceedings);
        
        if (Array.isArray(criminalProceedings)) {
          for (const proceeding of criminalProceedings) {
            try {
              const movements = await CriminalCaseService.getCaseMovements(proceeding.id);
              if (Array.isArray(movements)) {
                const extractedMeetings = extractMeetingsFromMovements(
                  movements, 
                  'criminal', 
                  proceeding.id,
                  proceeding.case_number_criminal,
                  proceeding.presiding_judge_full_name
                );
                allMeetings.push(...extractedMeetings);
              }
            } catch (error) {
              console.log(`Нет движений для уголовного дела ${proceeding.id}`);
            }
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки уголовных дел:', error);
      }

      // Сортировка по дате
      allMeetings.sort((a, b) => new Date(a.date) - new Date(b.date));
      console.log('Все собранные встречи:', allMeetings);
      setMeetings(allMeetings);
    } catch (error) {
      console.error('Ошибка загрузки встреч:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractMeetingsFromMovements = (movements, caseType, proceedingId, caseNumber, judgeName) => {
    const meetings = [];
    
    if (!Array.isArray(movements)) return meetings;

    movements.forEach(movement => {
      // Проверяем разные форматы хранения данных о заседании
      let meetingData = null;

      if (movement.business_movement_detail) {
        // Данные в business_movement_detail
        meetingData = movement.business_movement_detail;
      } else if (movement.date_meeting) {
        // Данные прямо в объекте
        meetingData = movement;
      } else if (movement.first_hearing_date) {
        // Для уголовных дел
        meetingData = {
          date_meeting: movement.first_hearing_date,
          meeting_time: movement.meeting_time,
          result_court_session: movement.result,
          composition_colleges: movement.court_composition
        };
      }

      if (meetingData?.date_meeting) {
        // Сохраняем дату как есть, без преобразования в ISO
        let meetingDate = meetingData.date_meeting;
        
        // Если дата приходит в формате ISO с временем, обрезаем время
        if (meetingDate.includes('T')) {
          meetingDate = meetingDate.split('T')[0];
        }
        
        meetings.push({
          id: movement.id,
          proceedingId: proceedingId,
          date: meetingDate, // Сохраняем в формате YYYY-MM-DD
          time: meetingData.meeting_time || '',
          caseType: caseType,
          judge: judgeName || movement.case_judge || 'Судья не указан',
          caseNumber: caseNumber || movement.case_number || '№ не указан',
          result: meetingData.result_court_session || meetingData.result || '',
          composition: meetingData.composition_colleges || meetingData.court_composition || ''
        });
      }
    });

    return meetings;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

  const getMeetingsForDate = (date) => {
    // Форматируем дату в локальном формате YYYY-MM-DD без учета часового пояса
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const localDateStr = `${year}-${month}-${day}`;
    
    return meetings.filter(m => {
      // Обрезаем время, если оно есть в строке даты
      const meetingDate = m.date.split('T')[0];
      return meetingDate === localDateStr;
    });
  };


  const handleDateClick = (date, meetings) => {
    if (meetings.length > 0) {
      setSelectedDate(date);
      setViewMode('list');
    }
  };

  const handleMeetingClick = (meeting) => {
    // Навигация к конкретному делу
    const paths = {
      civil: `/civil-proceedings/${meeting.proceedingId}`,
      admin: `/admin-proceedings/${meeting.proceedingId}`,
      kas: `/kas-proceedings/${meeting.proceedingId}`,
      criminal: `/criminal-proceedings/${meeting.proceedingId}`
    };
    
    navigate(paths[meeting.caseType] || '/');
    onClose();
  };

  const changeMonth = (increment) => {
    setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + increment)));
  };

  const formatTime = (time) => {
    if (!time) return '';
    if (time.length >= 5) return time.slice(0, 5);
    return time;
  };

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  if (loading) {
    return (
      <div className={styles.calendarOverlay}>
        <div className={styles.calendarContainer} ref={calendarRef}>
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            Загрузка календаря...
          </div>
        </div>
      </div>
    );
  }

  const days = getDaysInMonth(currentMonth);

  return (
    <div className={styles.calendarOverlay}>
      <div className={styles.calendarContainer} ref={calendarRef}>
        <div className={styles.calendarHeader}>
          <h3>📅 Календарь заседаний</h3>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        <div className={styles.viewToggle}>
          <button 
            className={`${styles.viewButton} ${viewMode === 'month' ? styles.activeView : ''}`}
            onClick={() => setViewMode('month')}
          >
            Месяц
          </button>
          <button 
            className={`${styles.viewButton} ${viewMode === 'list' ? styles.activeView : ''}`}
            onClick={() => setViewMode('list')}
          >
            Список
          </button>
        </div>

        {viewMode === 'month' ? (
          <>
            <div className={styles.monthNavigation}>
              <button onClick={() => changeMonth(-1)} className={styles.navButton}>←</button>
              <span className={styles.currentMonth}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button onClick={() => changeMonth(1)} className={styles.navButton}>→</button>
            </div>

            <div className={styles.weekDays}>
              {dayNames.map(day => (
                <div key={day} className={styles.weekDay}>{day}</div>
              ))}
            </div>

            <div className={styles.calendarGrid}>
              {days.map((date, index) => {
                const dateMeetings = getMeetingsForDate(date);
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = date.toDateString() === selectedDate.toDateString();

                return (
                  <div
                    key={index}
                    className={`${styles.calendarDay} ${!isCurrentMonth ? styles.otherMonth : ''} 
                               ${isToday ? styles.today : ''} ${isSelected ? styles.selectedDay : ''}
                               ${dateMeetings.length > 0 ? styles.hasMeetings : ''}`}
                    onClick={() => handleDateClick(date, dateMeetings)}
                  >
                    <span className={styles.dayNumber}>{date.getDate()}</span>
                    <div className={styles.dayMeetings}>
                      {dateMeetings.slice(0, 3).map((meeting, idx) => (
                        <div
                          key={idx}
                          className={styles.meetingDot}
                          style={{ backgroundColor: caseTypeColors[meeting.caseType]?.border }}
                          title={`${meeting.caseNumber} - ${meeting.time || 'время не указано'}`}
                        />
                      ))}
                      {dateMeetings.length > 3 && (
                        <span className={styles.moreMeetings}>+{dateMeetings.length - 3}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.legend}>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ backgroundColor: caseTypeColors.civil.border }}></span>
                <span>Гражданские</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ backgroundColor: caseTypeColors.admin.border }}></span>
                <span>Адм. правонарушения</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ backgroundColor: caseTypeColors.kas.border }}></span>
                <span>КАС РФ</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ backgroundColor: caseTypeColors.criminal.border }}></span>
                <span>Уголовные</span>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.meetingsList}>
            <div className={styles.selectedDateHeader}>
              <span>
                {selectedDate.toLocaleDateString('ru-RU', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
              <button onClick={() => setViewMode('month')} className={styles.backToCalendar}>
                ← Назад
              </button>
            </div>
            
            {getMeetingsForDate(selectedDate).length > 0 ? (
              <div className={styles.listItems}>
                {getMeetingsForDate(selectedDate).map((meeting, index) => (
                  <div
                    key={index}
                    className={styles.listItem}
                    onClick={() => handleMeetingClick(meeting)}
                    style={{ 
                      borderLeftColor: caseTypeColors[meeting.caseType]?.border,
                    }}
                  >
                    <div 
                      className={styles.listItemTime}
                      style={{ backgroundColor: caseTypeColors[meeting.caseType]?.bg }}
                    >
                      {formatTime(meeting.time) || 'Время не указано'}
                    </div>
                    <div className={styles.listItemContent}>
                      <div className={styles.listItemNumber}>
                        {meeting.caseNumber}
                        <span 
                          className={styles.caseTypeTag} 
                          style={{ backgroundColor: caseTypeColors[meeting.caseType]?.border }}
                        >
                          {meeting.caseType === 'civil' ? 'Гр' : 
                           meeting.caseType === 'admin' ? 'АП' : 
                           meeting.caseType === 'kas' ? 'КАС' : 'Уг'}
                        </span>
                      </div>
                      <div className={styles.listItemJudge}>
                        {meeting.judge}
                      </div>
                      {meeting.result && (
                        <div className={styles.listItemResult}>
                          {meeting.result}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noMeetings}>
                Нет заседаний на выбранную дату
              </div>
            )}
          </div>
        )}

        <div className={styles.stats}>
          <span>Всего заседаний: {meetings.length}</span>
          <span>Сегодня: {getMeetingsForDate(new Date()).length}</span>
        </div>
      </div>
    </div>
  );
};

export default MeetingsCalendar;