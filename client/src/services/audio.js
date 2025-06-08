// client/src/services/audio.js

class AudioService {
  constructor() {
    this.isSupported = this.checkSupport();
    this.audioContext = null;
    this.oscillator = null;
    this.gainNode = null;
  }

  // Проверка поддержки Web Audio API
  checkSupport() {
    return !!(window.AudioContext || window.webkitAudioContext);
  }

  // Инициализация аудио контекста
  async initAudioContext() {
    if (!this.isSupported) {
      throw new Error('Web Audio API не поддерживается');
    }

    if (!this.audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
    }

    // Возобновляем контекст если он приостановлен
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    return this.audioContext;
  }

  // Воспроизведение мистического звука
  async playMysticalSound(frequency = 432, duration = 1000, type = 'sine') {
    try {
      await this.initAudioContext();

      // Создаем осциллятор
      this.oscillator = this.audioContext.createOscillator();
      this.gainNode = this.audioContext.createGain();

      // Настройка звука
      this.oscillator.type = type;
      this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

      // Настройка громкости с плавным затуханием
      this.gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      this.gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

      // Подключение узлов
      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      // Воспроизведение
      this.oscillator.start(this.audioContext.currentTime);
      this.oscillator.stop(this.audioContext.currentTime + duration / 1000);

      return new Promise((resolve) => {
        this.oscillator.onended = resolve;
      });
    } catch (error) {
      console.error('Ошибка воспроизведения звука:', error);
    }
  }

  // Воспроизведение звука тасования карт
  async playCardShuffle() {
    const shuffleSounds = [
      { frequency: 200, duration: 100 },
      { frequency: 150, duration: 80 },
      { frequency: 300, duration: 60 },
      { frequency: 180, duration: 120 },
      { frequency: 250, duration: 90 }
    ];

    for (let i = 0; i < shuffleSounds.length; i++) {
      const { frequency, duration } = shuffleSounds[i];
      await this.playMysticalSound(frequency, duration, 'sawtooth');
      await this.delay(50);
    }
  }

  // Звук переворота карты
  async playCardFlip() {
    await this.playMysticalSound(800, 200, 'triangle');
    await this.delay(100);
    await this.playMysticalSound(400, 150, 'triangle');
  }

  // Звук успешного действия
  async playSuccess() {
    const notes = [261.63, 329.63, 392.00]; // C, E, G
    for (const note of notes) {
      await this.playMysticalSound(note, 200, 'sine');
      await this.delay(50);
    }
  }

  // Звук ошибки
  async playError() {
    await this.playMysticalSound(150, 500, 'sawtooth');
  }

  // Звук уведомления
  async playNotification() {
    await this.playMysticalSound(523.25, 300, 'sine'); // C5
  }

  // Воспроизведение звукового файла
  async playAudioFile(url) {
    try {
      const audio = new Audio(url);
      audio.volume = 0.5;
      
      return new Promise((resolve, reject) => {
        audio.onended = resolve;
        audio.onerror = reject;
        audio.play();
      });
    } catch (error) {
      console.error('Ошибка воспроизведения файла:', error);
    }
  }

  // Загрузка и воспроизведение звука по URL
  async playFromUrl(url, volume = 0.5) {
    try {
      await this.initAudioContext();

      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = audioBuffer;
      gainNode.gain.value = volume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start();

      return new Promise((resolve) => {
        source.onended = resolve;
      });
    } catch (error) {
      console.error('Ошибка воспроизведения с URL:', error);
    }
  }

  // Создание белого шума для медитации
  async playWhiteNoise(duration = 60000) {
    try {
      await this.initAudioContext();

      const bufferSize = this.audioContext.sampleRate * (duration / 1000);
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const channelData = buffer.getChannelData(0);

      // Генерация белого шума
      for (let i = 0; i < bufferSize; i++) {
        channelData[i] = (Math.random() * 2 - 1) * 0.1;
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      gainNode.gain.value = 0.1;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start();

      return new Promise((resolve) => {
        source.onended = resolve;
      });
    } catch (error) {
      console.error('Ошибка воспроизведения белого шума:', error);
    }
  }

  // Создание бинауральных ритмов
  async playBinauralBeats(leftFreq = 440, rightFreq = 444, duration = 60000) {
    try {
      await this.initAudioContext();

      // Создаем стерео буфер
      const buffer = this.audioContext.createBuffer(2, this.audioContext.sampleRate * (duration / 1000), this.audioContext.sampleRate);
      
      const leftChannel = buffer.getChannelData(0);
      const rightChannel = buffer.getChannelData(1);

      for (let i = 0; i < buffer.length; i++) {
        const time = i / this.audioContext.sampleRate;
        leftChannel[i] = Math.sin(2 * Math.PI * leftFreq * time) * 0.1;
        rightChannel[i] = Math.sin(2 * Math.PI * rightFreq * time) * 0.1;
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start();

      return new Promise((resolve) => {
        source.onended = resolve;
      });
    } catch (error) {
      console.error('Ошибка воспроизведения бинауральных ритмов:', error);
    }
  }

  // Остановка всех звуков
  stopAllSounds() {
    if (this.oscillator) {
      try {
        this.oscillator.stop();
      } catch (e) {
        // Осциллятор уже остановлен
      }
    }
  }

  // Задержка
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Установка общей громкости
  setMasterVolume(volume) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  // Получение поддерживаемых форматов
  getSupportedFormats() {
    const audio = new Audio();
    const formats = {};

    formats.mp3 = audio.canPlayType('audio/mpeg') !== '';
    formats.ogg = audio.canPlayType('audio/ogg') !== '';
    formats.wav = audio.canPlayType('audio/wav') !== '';
    formats.m4a = audio.canPlayType('audio/mp4') !== '';

    return formats;
  }

  // Очистка ресурсов
  dispose() {
    this.stopAllSounds();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    this.audioContext = null;
    this.oscillator = null;
    this.gainNode = null;
  }
}

export default new AudioService();