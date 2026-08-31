import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SideCaseService from '../../API/SideCaseService';
import AudioTranscriptionService from '../../API/AudioTranscriptionService';
import styles from './CaseViewOnly.module.css';

const CaseAudioView = () => {
  const { caseType, caseId } = useParams();
  const navigate = useNavigate();
  const [audioTranscriptions, setAudioTranscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [caseNumber, setCaseNumber] = useState('');

  useEffect(() => {
    loadAudio();
    loadCaseInfo();
  }, [caseType, caseId]);

  const normalizeCaseType = (type) => {
    const typeMap = {
      'criminal': 'criminal',
      'civil': 'civil',
      'kas': 'kas',
      'administrative': 'administrative',
      'coap': 'administrative',
      'admin': 'administrative'
    };
    return typeMap[type] || type;
  };

  const loadAudio = async () => {
    setLoading(true);
    try {
      const normalizedType = normalizeCaseType(caseType);
      const audioList = await SideCaseService.getAudioTranscriptions(normalizedType, caseId);
      setAudioTranscriptions(audioList || []);
    } catch (err) {
      console.error('Error loading audio:', err);
      setError('Ошибка загрузки аудио-протоколов');
    } finally {
      setLoading(false);
    }
  };

  const loadCaseInfo = async () => {
    try {
      const cases = await SideCaseService.getUserCases();
      let foundNumber = '';
      
      const typeMapping = {
        criminal: 'criminal',
        civil: 'civil',
        kas: 'kas',
        administrative: 'administrative'
      };
      
      const mappedType = typeMapping[caseType] || caseType;
      
      if (cases[mappedType]) {
        const found = cases[mappedType].find(c => c.case_id === parseInt(caseId));
        if (found) {
          foundNumber = found.case_number;
        }
      }
      
      setCaseNumber(foundNumber);
    } catch (err) {
      console.error('Error loading case info:', err);
    }
  };

  const handleDownloadAudio = async (transcriptionId, filename) => {
    try {
      const response = await fetch(`/side_case/audio-transcriptions/${transcriptionId}/download/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('side_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Ошибка скачивания');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || `audio_protocol_${transcriptionId}.wav`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading audio:', error);
      alert('Ошибка при скачивании аудио-протокола');
    }
  };

  const handleDownloadDocx = async (transcriptionId) => {
    try {
      const response = await fetch(`/audio-transcription/transcriptions/${transcriptionId}/download/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('side_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Ошибка скачивания');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `protocol_draft_${transcriptionId}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading docx:', error);
      alert('Ошибка при скачивании протокола');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCaseTypeName = () => {
    const names = {
      criminal: 'Уголовное дело',
      civil: 'Гражданское дело',
      kas: 'Административное дело (КАС РФ)',
      administrative: 'Дело об административном правонарушении'
    };
    return names[caseType] || 'Дело';
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Ожидает обработки',
      'processing': 'Распознавание...',
      'completed': 'Готово',
      'error': 'Ошибка',
      'cancelled': 'Отменено'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    const classMap = {
      'pending': styles.audioStatusProcessing,
      'processing': styles.audioStatusProcessing,
      'completed': styles.audioStatusCompleted,
      'error': styles.audioStatusError,
      'cancelled': styles.audioStatusCancelled
    };
    return classMap[status] || '';
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}ч ${m}м ${s}с`;
    }
    return `${m}м ${s}с`;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка аудио-протоколов...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <button onClick={() => navigate('/my-cases')} className={styles.backButton}>
          Вернуться к моим делам
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/my-cases')} className={styles.backButton}>
          Назад к моим делам
        </button>
        <h1>Аудио-протоколы</h1>
        {caseNumber && <p className={styles.caseNumber}>Дело №{caseNumber}</p>}
        <p className={styles.caseTypeLabel}>{getCaseTypeName()}</p>
      </div>

      <div className={styles.content}>
        {audioTranscriptions.length === 0 ? (
          <div className={styles.noData}>
            <p>Аудио-протоколы к данному делу не прикреплены</p>
            <p className={styles.emptyHint}>
              Аудиозаписи заседаний появляются после их обработки системой распознавания речи
            </p>
          </div>
        ) : (
          <div className={styles.audioList}>
            {audioTranscriptions.map(audio => (
              <div key={audio.id} className={styles.audioCard}>
                <div className={styles.audioInfo}>
                  <span className={styles.audioDate}>
                    {formatDate(audio.created_at)}
                  </span>
                  {audio.duration_seconds && (
                    <span className={styles.audioDuration}>
                      Длительность: {formatDuration(audio.duration_seconds)}
                    </span>
                  )}
                  {audio.speaker_count > 0 && (
                    <span className={styles.audioSpeakers}>
                      Говорящих: {audio.speaker_count}
                    </span>
                  )}
                  <span className={`${styles.audioStatus} ${getStatusClass(audio.status)}`}>
                    {getStatusText(audio.status)}
                  </span>
                </div>
                <div className={styles.audioActions}>
                  {audio.status === 'completed' && (
                    <>
                      <button 
                        className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                        onClick={() => handleDownloadAudio(audio.id, `audio_protocol_${caseNumber}_${new Date(audio.created_at).toISOString().slice(0,10)}.wav`)}
                      >
                        Скачать аудио
                      </button>
                      <button 
                        className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                        onClick={() => handleDownloadDocx(audio.id)}
                      >
                        Скачать протокол
                      </button>
                    </>
                  )}
                  {audio.status === 'processing' && (
                    <span className={styles.audioProcessingHint}>
                      Идёт распознавание речи...
                    </span>
                  )}
                  {audio.status === 'pending' && (
                    <span className={styles.audioPendingHint}>
                      Ожидает обработки
                    </span>
                  )}
                  {audio.status === 'error' && (
                    <span className={styles.audioErrorHint}>
                      Ошибка: {audio.error_message || 'неизвестная ошибка'}
                    </span>
                  )}
                  {audio.status === 'cancelled' && (
                    <span className={styles.audioCancelledHint}>
                      Обработка отменена
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className={styles.note}>
          <p>Аудио-протоколы формируются автоматически на основе записей судебных заседаний. Для получения протокола в формате DOCX дождитесь завершения обработки.</p>
        </div>
      </div>
    </div>
  );
};

export default CaseAudioView;