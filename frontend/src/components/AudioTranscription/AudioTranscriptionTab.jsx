import React, { useState, useEffect, useRef, useCallback } from 'react';
import AudioTranscriptionService from '../../API/AudioTranscriptionService';
import CriminalCaseService from '../../API/CriminalCaseService';
import styles from './AudioTranscriptionTab.module.css';
import SpeakerRoleEditor from './SpeakerRoleEditor';
import CivilCaseService from '../../API/CivilCaseService';
import KasCaseService from '../../API/KasCaseService';
import AdministrativeCaseService from '../../API/AdministrativeCaseService';

// =============================================================================
// Компонент аудиоплеера
// =============================================================================
const AudioPlayer = ({ audioUrl, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className={styles.audioPlayer}>
      <div className={styles.audioPlayerHeader}>
        <span className={styles.audioPlayerTitle}>Аудиозапись заседания</span>
        <button className={styles.audioPlayerClose} onClick={onClose}>×</button>
      </div>
      <div className={styles.audioPlayerControls}>
        <button 
          className={styles.audioPlayBtn} 
          onClick={togglePlay}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <span className={styles.audioTime}>{formatTime(currentTime)}</span>
        <input
          type="range"
          className={styles.audioSeek}
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
        />
        <span className={styles.audioTime}>{formatTime(duration)}</span>
      </div>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
};

// =============================================================================
// Компонент предпросмотра протокола
// =============================================================================
const ProtocolPreview = ({ transcriptionId, audioUrl, onClose }) => {
  const [protocolData, setProtocolData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRoles, setExpandedRoles] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await AudioTranscriptionService.getProtocolPreview(transcriptionId);
        setProtocolData(response.data);
      } catch (err) {
        console.error('Ошибка загрузки протокола:', err);
        const errorMsg = err.message || 'Не удалось загрузить данные протокола';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [transcriptionId]);

  const formatTime = (seconds) => {
    if (!seconds) return '00:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const toggleRole = (role) => {
    setExpandedRoles(prev => ({
      ...prev,
      [role]: !prev[role]
    }));
  };

  const roleColors = {
    'Судья': '#2c5282',
    'Прокурор': '#c53030',
    'Защитник': '#2f855a',
    'Подсудимый': '#744210',
    'Потерпевший': '#6b46c1',
  };

  if (loading) {
    return (
      <div className={styles.previewLoading}>
        <div className={styles.loadingSpinner} />
        <span>Загрузка протокола...</span>
      </div>
    );
  }

  if (error) {
    return <div className={styles.previewError}>{error}</div>;
  }

  if (!protocolData) {
    return <div className={styles.previewEmpty}>Нет данных для отображения</div>;
  }

  const { speakers, segments_by_role, total_segments, duration } = protocolData;

  return (
    <div className={styles.protocolPreview}>
      <div className={styles.previewHeader}>
        <h3 className={styles.previewTitle}>Предпросмотр протокола</h3>
        <button className={styles.closePreviewBtn} onClick={onClose}>×</button>
      </div>
      
      <div className={styles.previewInfo}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Длительность:</span>
          <span className={styles.infoValue}>{formatTime(duration)}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Всего реплик:</span>
          <span className={styles.infoValue}>{total_segments}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Участников:</span>
          <span className={styles.infoValue}>{Object.keys(speakers).length}</span>
        </div>
      </div>

      <div className={styles.speakersStats}>
        {Object.entries(speakers).map(([role, count]) => (
          <span 
            key={role} 
            className={styles.speakerStat}
            style={{ borderColor: roleColors[role] || '#718096' }}
          >
            <span className={styles.speakerStatName}>{role}:</span>
            <span className={styles.speakerStatCount}>{count}</span>
          </span>
        ))}
      </div>

      <div className={styles.previewActions}>
        <button 
          className={`${styles.actionBtn} ${styles.downloadBtn}`}
          onClick={() => AudioTranscriptionService.downloadFile(transcriptionId, `protocol_draft_${transcriptionId}.docx`)}
        >
          📄 Скачать DOCX
        </button>
        {audioUrl && (
          <button 
            className={`${styles.actionBtn} ${styles.audioBtn}`}
            onClick={() => {
              const event = new CustomEvent('openAudioPlayer', { detail: { audioUrl } });
              window.dispatchEvent(event);
            }}
          >
            🔊 Прослушать аудио
          </button>
        )}
      </div>

      <div className={styles.protocolSegments}>
        {Object.entries(segments_by_role).map(([role, segments]) => (
          <div key={role} className={styles.roleGroup}>
            <div 
              className={styles.roleHeader}
              onClick={() => toggleRole(role)}
              style={{ borderLeftColor: roleColors[role] || '#718096' }}
            >
              <span className={styles.roleName}>{role}</span>
              <span className={styles.roleCount}>({segments.length} реплик)</span>
              <span className={styles.roleToggle}>
                {expandedRoles[role] ? '−' : '+'}
              </span>
            </div>
            {expandedRoles[role] && (
              <div className={styles.roleSegments}>
                {segments.map((seg, idx) => (
                  <div key={idx} className={styles.segmentLine}>
                    <span className={styles.segmentTime}>[{formatTime(seg.start)}]</span>
                    <span className={styles.segmentText}>{seg.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// Компонент отображения элемента транскрипции
// =============================================================================
const TranscriptionItem = ({ 
  item, 
  onCancel, 
  onDelete, 
  onDownload, 
  onPreview,
  onPlayAudio,
  onEditRoles,
  formatDate, 
  formatDuration 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isProcessing = item.status === 'pending' || item.status === 'processing';
  const isCompleted = item.status === 'completed';
  const isError = item.status === 'error';
  const isCancelled = item.status === 'cancelled';
  
  const getStatusText = () => {
    switch (item.status) {
      case 'pending': return 'Ожидает обработки';
      case 'processing': return 'Распознавание...';
      case 'completed': return 'Завершено';
      case 'error': return 'Ошибка';
      case 'cancelled': return 'Отменено';
      default: return item.status;
    }
  };

  const getStatusClass = () => {
    switch (item.status) {
      case 'pending': return styles.statusPending;
      case 'processing': return styles.statusProcessing;
      case 'completed': return styles.statusCompleted;
      case 'error': return styles.statusError;
      case 'cancelled': return styles.statusCancelled;
      default: return '';
    }
  };

  return (
    <div className={`${styles.transcriptionItem} ${isProcessing ? styles.processingItem : ''}`}>
      <div className={styles.itemHeader}>
        <div className={styles.itemInfo}>
          <div className={styles.itemMeta}>
            <span className={styles.itemDate}>{formatDate(item.created_at)}</span>
            {item.duration_seconds && (
              <span className={styles.itemDuration}>Длительность: {formatDuration(item.duration_seconds)}</span>
            )}
            {item.speaker_count > 0 && (
              <span className={styles.itemSpeakers}>Говорящих: {item.speaker_count}</span>
            )}
          </div>
        </div>
        <div className={styles.itemStatus}>
          <span className={`${styles.statusBadge} ${getStatusClass()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {(item.status === 'pending' || item.status === 'processing') && (
        <div className={styles.progressWrapper}>
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${item.progress_percent || 0}%` }}
              />
            </div>
            <div className={styles.progressText}>
              {item.progress_percent || 0}%
            </div>
          </div>
          <div className={styles.progressStatus}>
            {item.status === 'pending' && 'Ожидание в очереди...'}
            {item.status === 'processing' && (
              <span className={styles.processingAnimation}>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                Обработка аудио...
              </span>
            )}
          </div>
        </div>
      )}

      {isError && item.error_message && (
        <div className={styles.errorMessage}>
          <div className={styles.errorText}>
            <strong>Ошибка:</strong> {item.error_message}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className={styles.cancelledMessage}>
          Обработка была отменена пользователем
        </div>
      )}

      {isCompleted && item.speakers_summary && Object.keys(item.speakers_summary).length > 0 && (
        <div className={styles.speakersSummary}>
          {Object.entries(item.speakers_summary).map(([role, count]) => (
            <span key={role} className={styles.speakerSummaryTag}>
              {role}: {count}
            </span>
          ))}
          <span className={styles.editHint} onClick={() => onEditRoles(item.id)}>
            ✏️ редактировать
          </span>
        </div>
      )}

      {isCompleted && item.raw_text && (
        <div className={styles.textPreview}>
          <button 
            className={styles.textToggle}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span>{isExpanded ? 'Скрыть текст' : 'Показать распознанный текст'}</span>
            <span className={styles.textLength}>
              {item.raw_text.length} символов
            </span>
          </button>
          {isExpanded && (
            <div className={styles.rawText}>
              {item.raw_text}
            </div>
          )}
        </div>
      )}

      <div className={styles.itemActions}>
        {isCompleted && (
          <>
            <button 
              className={`${styles.actionBtn} ${styles.downloadBtn}`}
              onClick={() => onDownload(item.id)}
            >
              📄 Скачать DOCX
            </button>
            <button 
              className={`${styles.actionBtn} ${styles.previewBtn}`}
              onClick={() => onPreview(item.id)}
            >
              👁 Предпросмотр
            </button>
            <button 
              className={`${styles.actionBtn} ${styles.audioBtn}`}
              onClick={() => onPlayAudio(item.id)}
            >
              🔊 Прослушать
            </button>
            <button 
              className={`${styles.actionBtn} ${styles.editRolesBtn}`}
              onClick={() => onEditRoles(item.id)}
            >
              👤 Настроить роли
            </button>
          </>
        )}
        
        {(item.status === 'pending' || item.status === 'processing') && (
          <button 
            className={`${styles.actionBtn} ${styles.cancelBtn}`}
            onClick={() => onCancel(item.id)}
          >
            Отменить
          </button>
        )}
        
        {item.status !== 'processing' && (
          <button 
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={() => onDelete(item.id)}
          >
            Удалить
          </button>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// ОСНОВНОЙ КОМПОНЕНТ AudioTranscriptionTab
// =============================================================================
const AudioTranscriptionTab = ({ caseId, caseType = 'criminal' }) => {
  const [transcriptions, setTranscriptions] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPreviewId, setSelectedPreviewId] = useState(null);
  const [audioPlayerVisible, setAudioPlayerVisible] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  
  // Состояния для редактора ролей
  const [showRoleEditor, setShowRoleEditor] = useState(false);
  const [editingTranscriptionId, setEditingTranscriptionId] = useState(null);
  const [selectedSpeakers, setSelectedSpeakers] = useState(null);
  const [caseParticipants, setCaseParticipants] = useState([]);
  
  const fileInputRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Загрузка участников дела
  const fetchCaseParticipants = useCallback(async () => {
    try {
      let participants = [];
      
      // УГОЛОВНЫЕ ДЕЛА
      if (caseType === 'criminal') {
        const defendants = await CriminalCaseService.getDefendants(caseId);
        const lawyers = await CriminalCaseService.getLawyers(caseId);
        const sides = await CriminalCaseService.getSides(caseId);
        
        participants = [
          ...defendants.map(d => ({
            id: d.id,
            full_name: d.full_name_criminal || d.full_name || 'Подсудимый',
            role: 'defendant'
          })),
          ...lawyers.map(l => ({
            id: l.id,
            full_name: l.lawyer_detail?.law_firm_name || 'Адвокат',
            role: 'defense'
          })),
          ...sides.map(s => ({
            id: s.id,
            full_name: s.criminal_side_case_detail?.name ||
                      s.sides_case_criminal_detail?.sides_case ||
                      'Сторона',
            role: 'other'
          })),
        ];
      }
      
      // ГРАЖДАНСКИЕ ДЕЛА
      else if (caseType === 'civil') {
        const sides = await CivilCaseService.getSides(caseId);
        const lawyers = await CivilCaseService.getLawyers(caseId);
        
        participants = [
          ...sides.map(side => {
            let role = 'other';
            let fullName = 'Сторона';
            
            if (side.plaintiff_name) {
              role = 'plaintiff';
              fullName = side.plaintiff_name;
            } else if (side.defendant_name) {
              role = 'defendant';
              fullName = side.defendant_name;
            } else if (side.third_parties) {
              role = 'third_party';
              fullName = side.third_parties;
            }
            
            return { id: side.id, full_name: fullName, role: role };
          }),
          ...lawyers.map(l => ({
            id: l.id,
            full_name: l.lawyer_detail?.law_firm_name || 'Адвокат',
            role: 'defense'
          })),
        ];
      }
      
      // АДМИНИСТРАТИВНЫЕ ДЕЛА ПО КАС
      else if (caseType === 'kas') {
        const sides = await KasCaseService.getSides(caseId);
        participants = sides.map(s => ({
          id: s.id,
          full_name: s.sides_case_incase_detail?.name || 'Сторона по делу',
          role: 'other'
        }));
      }
      
      // АДМИНИСТРАТИВНЫЕ ДЕЛА ПО КОАП
      else if (caseType === 'coap') {
        const sides = await AdministrativeCaseService.getSides(caseId);
        const lawyers = await AdministrativeCaseService.getLawyers(caseId);
        
        participants = [
          ...sides.map(s => ({
            id: s.id,
            full_name: s.sides_case_incase_detail?.name || 'Сторона по делу',
            role: 'other'
          })),
          ...lawyers.map(l => ({
            id: l.id,
            full_name: l.lawyer_detail?.law_firm_name || 'Защитник',
            role: 'defense'
          })),
        ];
      }
      
      setCaseParticipants(participants);
      
    } catch (error) {
      console.error('Ошибка загрузки участников дела:', error);
      setCaseParticipants([]);
    }
  }, [caseId, caseType]);

  // Загрузка списка транскрипций
  const fetchList = useCallback(async () => {
    try {
      const data = await AudioTranscriptionService.getByCase(caseType, caseId);
      setTranscriptions(data);
      setError(null);
      return data;
    } catch (err) {
      console.error('Ошибка загрузки списка:', err);
      setError('Не удалось загрузить список аудиозаписей');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [caseType, caseId]);

  const hasActiveTasks = useCallback(() => {
    return transcriptions.some(t => t.status === 'pending' || t.status === 'processing');
  }, [transcriptions]);

  // Загрузка участников при монтировании
  useEffect(() => {
    if (caseId) {
      fetchCaseParticipants();
    }
  }, [caseId, fetchCaseParticipants]);

  useEffect(() => {
    fetchList();
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchList]);

  useEffect(() => {
    if (hasActiveTasks()) {
      if (!pollingIntervalRef.current) {
        pollingIntervalRef.current = setInterval(() => {
          fetchList();
        }, 3000);
      }
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [hasActiveTasks, fetchList]);

  useEffect(() => {
    const handleOpenAudioPlayer = (event) => {
      setAudioUrl(event.detail.audioUrl);
      setAudioPlayerVisible(true);
    };
    window.addEventListener('openAudioPlayer', handleOpenAudioPlayer);
    return () => {
      window.removeEventListener('openAudioPlayer', handleOpenAudioPlayer);
    };
  }, []);

  // Обработчик редактирования ролей
  const handleEditRoles = async (id) => {
    const item = transcriptions.find(t => t.id === id);
    if (item && item.speakers_summary) {
      setEditingTranscriptionId(id);
      setSelectedSpeakers(item.speakers_summary);
      setShowRoleEditor(true);
    }
  };

  // Обработчик сохранения ролей
  const handleSaveSpeakerRoles = async (transcriptionId, speakerMapping) => {
    try {
      await AudioTranscriptionService.saveSpeakerRoles(transcriptionId, speakerMapping);
      await fetchList();
      return { success: true };
    } catch (error) {
      throw new Error(error.message || 'Ошибка сохранения ролей');
    }
  };

  // Загрузка файла
  const handleUpload = async (file) => {
    if (!file) return;

    const validExts = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.opus', '.aac'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExts.includes(ext)) {
      setError(`Неподдерживаемый формат: ${ext}. Разрешены: ${validExts.join(', ')}`);
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      setError('Файл слишком большой. Максимум 200 МБ.');
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 200);

    try {
      abortControllerRef.current = new AbortController();
      
      await AudioTranscriptionService.uploadAudio(
        file, 
        caseType, 
        caseId,
        abortControllerRef.current.signal
      );
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      await fetchList();
      
      setTimeout(() => setUploadProgress(0), 1000);
      
    } catch (err) {
      clearInterval(progressInterval);
      if (err.name === 'AbortError') {
        setError('Загрузка была отменена');
      } else {
        setError(err.message || 'Не удалось загрузить файл');
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      abortControllerRef.current = null;
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Вы уверены, что хотите отменить обработку аудио?')) return;
    
    try {
      await AudioTranscriptionService.cancelTranscription(id);
      await fetchList();
    } catch (err) {
      setError(err.message || 'Не удалось отменить обработку');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту запись?')) return;
    
    try {
      await AudioTranscriptionService.deleteTranscription(id);
      await fetchList();
    } catch (err) {
      setError(err.message || 'Не удалось удалить запись');
    }
  };

  const handleDownload = (id) => {
    AudioTranscriptionService.downloadFile(id, `protocol_draft_${id}.docx`);
  };

  const handlePreview = (id) => {
    setSelectedPreviewId(id);
  };

  const handleClosePreview = () => {
    setSelectedPreviewId(null);
  };

  const handlePlayAudio = async (id) => {
    try {
      const response = await AudioTranscriptionService.getAudioUrl(id);
      if (response) {
        setAudioUrl(response);
        setAudioPlayerVisible(true);
      } else {
        setError('Не удалось загрузить аудио');
      }
    } catch (err) {
      console.error('Ошибка загрузки аудио:', err);
      setError('Не удалось загрузить аудио');
    }
  };

  const handleCloseAudioPlayer = () => {
    setAudioPlayerVisible(false);
    setAudioUrl(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (secs) => {
    if (!secs) return '—';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}ч ${m}м ${s}с`;
    }
    return `${m}м ${s}с`;
  };

  const getStatusCount = (status) => {
    return transcriptions.filter(t => t.status === status).length;
  };

  const pendingCount = getStatusCount('pending');
  const processingCount = getStatusCount('processing');
  const completedCount = getStatusCount('completed');
  const errorCount = getStatusCount('error');

  return (
    <div className={styles.tabContent}>
      <div className={styles.audioHeader}>
        <div className={styles.headerTop}>
          <h3 className={styles.subsectionTitle}>Распознавание аудиозаписей заседаний</h3>
          <div className={styles.headerStats}>
            {processingCount > 0 && (
              <span className={styles.statBadgeProcessing}>
                В обработке: {processingCount}
              </span>
            )}
            {pendingCount > 0 && (
              <span className={styles.statBadgePending}>
                В очереди: {pendingCount}
              </span>
            )}
            {completedCount > 0 && (
              <span className={styles.statBadgeCompleted}>
                Завершено: {completedCount}
              </span>
            )}
            {errorCount > 0 && (
              <span className={styles.statBadgeError}>
                Ошибок: {errorCount}
              </span>
            )}
          </div>
        </div>
        <p className={styles.audioHint}>
          Система автоматически распознает речь и создает черновик протокола в формате Word.
          <br />
          <span className={styles.hintSub}>
            После завершения обработки вы можете просмотреть структурированный протокол с разбивкой по участникам.
          </span>
        </p>
      </div>

      {error && (
        <div className={styles.globalError}>
          <span>{error}</span>
          <button className={styles.errorClose} onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div 
        className={`${styles.dropZone} ${isDragging ? styles.dragging : ''} ${isUploading ? styles.uploading : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".mp3,.wav,.ogg,.m4a,.flac,.opus,.aac" 
          style={{ display: 'none' }}
          disabled={isUploading}
        />
        
        {isUploading ? (
          <div className={styles.uploadingContent}>
            <div className={styles.uploadSpinner} />
            <div className={styles.uploadInfo}>
              <span className={styles.uploadTitle}>Загрузка файла...</span>
              <div className={styles.uploadProgressBar}>
                <div 
                  className={styles.uploadProgressFill} 
                  style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                />
              </div>
              <span className={styles.uploadPercent}>
                {Math.round(Math.min(uploadProgress, 100))}%
              </span>
            </div>
            <button 
              className={styles.cancelUploadBtn}
              onClick={(e) => {
                e.stopPropagation();
                if (abortControllerRef.current) {
                  abortControllerRef.current.abort();
                }
              }}
            >
              Отменить
            </button>
          </div>
        ) : (
          <>
            <p className={styles.dropText}>
              Перетащите аудиофайл сюда или <span className={styles.browseLink}>выберите файл</span>
            </p>
            <small className={styles.dropHint}>
              Поддерживаемые форматы: MP3, WAV, OGG, M4A, FLAC, AAC (макс. 200 МБ)
            </small>
          </>
        )}
      </div>

      {isLoading ? (
        <div className={styles.loadingList}>
          <div className={styles.loadingSpinner} />
          <span>Загрузка списка...</span>
        </div>
      ) : transcriptions.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Нет загруженных аудиозаписей</p>
          <small>Загрузите аудиофайл для распознавания речи</small>
        </div>
      ) : (
        <div className={styles.transcriptionList}>
          <div className={styles.listHeader}>
            <span className={styles.listTitle}>
              Все записи ({transcriptions.length})
            </span>
            <button 
              className={styles.refreshBtn}
              onClick={fetchList}
            >
              Обновить
            </button>
          </div>
          
          {transcriptions.map(item => (
            <TranscriptionItem
              key={item.id}
              item={item}
              caseType={caseType}
              onCancel={handleCancel}
              onDelete={handleDelete}
              onDownload={handleDownload}
              onPreview={handlePreview}
              onPlayAudio={handlePlayAudio}
              onEditRoles={handleEditRoles}
              formatDate={formatDate}
              formatDuration={formatDuration}
            />
          ))}
        </div>
      )}

      {selectedPreviewId && (
        <div className={styles.modalOverlay} onClick={handleClosePreview}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <ProtocolPreview 
              transcriptionId={selectedPreviewId} 
              audioUrl={audioUrl}
              onClose={handleClosePreview}
            />
          </div>
        </div>
      )}

      {audioPlayerVisible && audioUrl && (
        <div className={styles.audioPlayerOverlay}>
          <AudioPlayer 
            audioUrl={audioUrl} 
            onClose={handleCloseAudioPlayer} 
          />
        </div>
      )}

      {/* Модальное окно редактора ролей */}
      {showRoleEditor && selectedSpeakers && (
        <div className={styles.modalOverlay} onClick={() => setShowRoleEditor(false)}>
          <div className={styles.editorModalContent} onClick={e => e.stopPropagation()}>
            <SpeakerRoleEditor
              speakersSummary={selectedSpeakers}
              transcriptionId={editingTranscriptionId}
              onSave={handleSaveSpeakerRoles}
              onClose={() => setShowRoleEditor(false)}
              caseParticipants={caseParticipants}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioTranscriptionTab;