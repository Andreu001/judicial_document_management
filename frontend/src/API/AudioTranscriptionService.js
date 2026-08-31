import baseService from './baseService';

const AudioTranscriptionService = {
  uploadAudio: async (file, caseType, caseId, signal) => {
    const formData = new FormData();
    formData.append('audio_file', file);
    formData.append('case_type', caseType);
    formData.append('case_id', caseId);

    try {
      const response = await baseService.post('/audio-transcription/transcriptions/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal,
      });
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
      }
      throw new Error(error.response?.data?.audio_file?.[0] || 'Не удалось загрузить файл');
    }
  },

  getByCase: async (caseType, caseId) => {
    try {
      const response = await baseService.get(`/audio-transcription/transcriptions/by-case/?case_type=${caseType}&case_id=${caseId}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка получения списка аудио:', error);
      return [];
    }
  },

  downloadFile: async (id, fileName) => {
    try {
      const response = await baseService.get(`/audio-transcription/transcriptions/${id}/download/`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка скачивания:', error);
      alert('Ошибка при скачивании файла');
    }
  },

  cancelTranscription: async (id) => {
    try {
      const response = await baseService.post(`/audio-transcription/transcriptions/${id}/cancel/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Не удалось отменить обработку');
    }
  },

  deleteTranscription: async (id) => {
    try {
      const response = await baseService.delete(`/audio-transcription/transcriptions/${id}/delete/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Не удалось удалить запись');
    }
  },

  getProgress: async (id) => {
    try {
      const response = await baseService.get(`/audio-transcription/transcriptions/${id}/progress/`);
      return response.data;
    } catch (error) {
      console.error('Ошибка получения прогресса:', error);
      return null;
    }
  },

  getProtocolPreview: async (id) => {
    try {
      const response = await baseService.get(`/audio-transcription/transcriptions/${id}/protocol-preview/`);
      return response;
    } catch (error) {
      console.error('Ошибка получения предпросмотра:', error);
      const errorMessage = error.response?.data?.error || 'Не удалось загрузить данные протокола';
      throw new Error(errorMessage);
    }
  },

  getStructuredData: async (id) => {
    try {
      const response = await baseService.get(`/audio-transcription/transcriptions/${id}/structured/`);
      return response.data;
    } catch (error) {
      console.error('Ошибка получения структурированных данных:', error);
      return null;
    }
  },

  getAudioUrl: async (id) => {
    try {
      const response = await baseService.get(`/audio-transcription/transcriptions/${id}/`);
      const audioPath = response.data?.audio_file;
      if (audioPath) {
        return audioPath;
      }
      return null;
    } catch (error) {
      console.error('Ошибка получения аудио:', error);
      return null;
    }
  },

  // ===== НОВЫЙ МЕТОД: Сохранение ролей участников =====
  saveSpeakerRoles: async (transcriptionId, speakerMapping) => {
    try {
      const response = await baseService.post(
        `/audio-transcription/transcriptions/${transcriptionId}/save-speaker-roles/`,
        { speaker_mapping: speakerMapping }
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка сохранения ролей:', error);
      throw new Error(error.response?.data?.error || 'Не удалось сохранить роли');
    }
  },

  // ===== НОВЫЙ МЕТОД: Получение сохраненных ролей =====
  getSpeakerRoles: async (transcriptionId) => {
    try {
      const response = await baseService.get(
        `/audio-transcription/transcriptions/${transcriptionId}/speaker-roles/`
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка получения ролей:', error);
      return null;
    }
  }
};

export default AudioTranscriptionService;