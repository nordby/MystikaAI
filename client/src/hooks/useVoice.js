// client/src/hooks/useVoice.js
import { useState, useRef, useCallback } from 'react';
import aiService from '../services/ai';
import analyticsService from '../services/analytics';
import telegramService from '../services/telegram';

export const useVoice = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);

  // Проверка поддержки записи голоса
  const checkSupport = useCallback(() => {
    const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    setIsSupported(supported);
    return supported;
  }, []);

  // Начало записи
  const startRecording = useCallback(async () => {
    try {
      if (!checkSupport()) {
        throw new Error('Запись голоса не поддерживается в этом браузере');
      }

      setError(null);
      setTranscript('');
      setRecordingDuration(0);
      
      const result = await aiService.startVoiceRecording();
      
      if (result.success) {
        setIsRecording(true);
        startTimeRef.current = Date.now();
        
        // Обновляем счетчик времени записи
        intervalRef.current = setInterval(() => {
          if (startTimeRef.current) {
            setRecordingDuration(Date.now() - startTimeRef.current);
          }
        }, 100);

        // Вибрация при начале записи (если доступна)
        telegramService.vibrate();
        
        analyticsService.trackEvent('voice_recording_started');
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      analyticsService.trackError(err, { context: 'voice_recording_start' });
    }
  }, []);

  // Остановка записи
  const stopRecording = useCallback(async () => {
    try {
      if (!isRecording) return null;

      setIsProcessing(true);
      clearInterval(intervalRef.current);
      
      const duration = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
      
      const result = await aiService.stopVoiceRecording();
      
      if (result.success) {
        setTranscript(result.text);
        analyticsService.trackVoiceInput(true, duration);
        
        // Вибрация при успешном распознавании
        telegramService.vibrate();
        
        return {
          text: result.text,
          confidence: result.confidence,
          duration: duration
        };
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      analyticsService.trackVoiceInput(false, recordingDuration);
      analyticsService.trackError(err, { context: 'voice_recording_stop' });
      return null;
    } finally {
      setIsRecording(false);
      setIsProcessing(false);
      startTimeRef.current = null;
    }
  }, [isRecording, recordingDuration]);

  // Переключение записи
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      return await stopRecording();
    } else {
      await startRecording();
      return null;
    }
  }, [isRecording, startRecording, stopRecording]);

  // Отмена записи
  const cancelRecording = useCallback(() => {
    if (isRecording || isProcessing) {
      aiService.stopAllSounds();
      clearInterval(intervalRef.current);
      setIsRecording(false);
      setIsProcessing(false);
      setTranscript('');
      setRecordingDuration(0);
      startTimeRef.current = null;
      
      analyticsService.trackEvent('voice_recording_cancelled');
    }
  }, [isRecording, isProcessing]);

  // Использование локального распознавания речи (Web Speech API)
  const useLocalRecognition = useCallback(async () => {
    try {
      setError(null);
      setIsProcessing(true);
      
      const result = await aiService.localSpeechRecognition();
      
      if (result.success) {
        setTranscript(result.text);
        analyticsService.trackEvent('local_speech_recognition_used', {
          confidence: result.confidence
        });
        
        return {
          text: result.text,
          confidence: result.confidence
        };
      } else {
        throw new Error('Распознавание не удалось');
      }
    } catch (err) {
      setError(err.message);
      analyticsService.trackError(err, { context: 'local_speech_recognition' });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Очистка транскрипта
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  // Форматирование времени записи
  const formatDuration = useCallback((ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${remainingSeconds}с`;
    }
  }, []);

  // Получение статуса записи
  const getRecordingStatus = useCallback(() => {
    if (isProcessing) return 'processing';
    if (isRecording) return 'recording';
    if (transcript) return 'completed';
    return 'idle';
  }, [isRecording, isProcessing, transcript]);

  // Проверка максимальной длительности записи
  const checkMaxDuration = useCallback((maxDuration = 60000) => {
    return recordingDuration < maxDuration;
  }, [recordingDuration]);

  // Получение уровня громкости (если доступно)
  const getVolumeLevel = useCallback(() => {
    // Здесь можно добавить логику для получения уровня громкости
    // Требует дополнительной настройки MediaRecorder и анализа аудио
    return 0;
  }, []);

  // Сброс всех состояний
  const reset = useCallback(() => {
    cancelRecording();
    clearTranscript();
    setError(null);
    setRecordingDuration(0);
  }, [cancelRecording, clearTranscript]);

  // Инициализация при первом использовании
  useState(() => {
    checkSupport();
  });

  return {
    // Состояние
    isRecording,
    isProcessing,
    transcript,
    error,
    isSupported,
    recordingDuration,
    
    // Методы записи
    startRecording,
    stopRecording,
    toggleRecording,
    cancelRecording,
    
    // Альтернативные методы
    useLocalRecognition,
    
    // Утилиты
    clearTranscript,
    formatDuration,
    getRecordingStatus,
    checkMaxDuration,
    getVolumeLevel,
    reset,
    checkSupport,
    
    // Очистка ошибки
    clearError: () => setError(null)
  };
};