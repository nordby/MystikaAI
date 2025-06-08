// client/src/services/ai.js
import apiService from './api';

class AIService {
  constructor() {
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  // Генерация интерпретации карт
  async generateInterpretation(cards, question, context = {}) {
    try {
      const response = await apiService.generateAIInterpretation({
        cards,
        question,
        context: {
          ...context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        }
      });

      return {
        success: true,
        interpretation: response.interpretation,
        confidence: response.confidence || 0.85,
        suggestions: response.suggestions || []
      };
    } catch (error) {
      console.error('Ошибка генерации интерпретации:', error);
      return {
        success: false,
        error: 'Не удалось сгенерировать интерпретацию'
      };
    }
  }

  // Начать запись голоса
  async startVoiceRecording() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Запись голоса не поддерживается в этом браузере');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;

      return { success: true, message: 'Запись началась' };
    } catch (error) {
      console.error('Ошибка начала записи:', error);
      return { 
        success: false, 
        error: error.message || 'Не удалось начать запись' 
      };
    }
  }

  // Остановить запись голоса
  async stopVoiceRecording() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve({ 
          success: false, 
          error: 'Запись не была начата' 
        });
        return;
      }

      this.mediaRecorder.onstop = async () => {
        this.isRecording = false;
        
        // Останавливаем все треки
        const stream = this.mediaRecorder.stream;
        stream.getTracks().forEach(track => track.stop());

        // Создаем Blob из записанных данных
        const audioBlob = new Blob(this.audioChunks, { 
          type: 'audio/webm;codecs=opus' 
        });

        try {
          // Отправляем на сервер для распознавания
          const response = await apiService.processVoiceInput(audioBlob);
          
          resolve({
            success: true,
            text: response.text,
            confidence: response.confidence,
            audioBlob: audioBlob
          });
        } catch (error) {
          console.error('Ошибка обработки голоса:', error);
          resolve({
            success: false,
            error: 'Не удалось распознать речь',
            audioBlob: audioBlob
          });
        }
      };

      this.mediaRecorder.stop();
    });
  }

  // Анализ фотографии
  async analyzePhoto(photoFile) {
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);

      const response = await fetch('/api/ai/analyze-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          analysis: result.analysis,
          recommendations: result.recommendations,
          photoUrl: result.photoUrl
        };
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Ошибка анализа фото:', error);
      return {
        success: false,
        error: 'Не удалось проанализировать фотографию'
      };
    }
  }

  // Генерация персонализированной карты
  async generatePersonalCard(cardName, cardMeaning, userPhoto, style = 'mystical') {
    try {
      const response = await fetch('/api/cards/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          cardName,
          cardMeaning,
          userPhoto,
          style
        })
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          imageUrl: result.imageUrl,
          cardName: result.cardName
        };
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Ошибка генерации карты:', error);
      return {
        success: false,
        error: 'Не удалось сгенерировать карту'
      };
    }
  }

  // Улучшение качества вопроса
  async enhanceQuestion(userQuestion) {
    try {
      const response = await fetch('/api/ai/enhance-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ question: userQuestion })
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          enhancedQuestion: result.enhancedQuestion,
          suggestions: result.suggestions
        };
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Ошибка улучшения вопроса:', error);
      return {
        success: false,
        error: 'Не удалось улучшить вопрос',
        enhancedQuestion: userQuestion
      };
    }
  }

  // Проверка состояния записи
  getRecordingState() {
    return {
      isRecording: this.isRecording,
      isSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    };
  }

  // Преобразование аудио в текст (локально, если доступно)
  async localSpeechRecognition() {
    return new Promise((resolve, reject) => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        reject(new Error('Распознавание речи не поддерживается'));
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'ru-RU';

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        
        resolve({
          success: true,
          text: text,
          confidence: confidence
        });
      };

      recognition.onerror = (event) => {
        reject(new Error(`Ошибка распознавания: ${event.error}`));
      };

      recognition.start();
    });
  }
}

export default new AIService();