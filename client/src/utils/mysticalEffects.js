// mysticalEffects.js - MYSTIKA интерактивные эффекты в стиле найденного script.js

/**
 * Система частиц для мистического фона
 */
export class MysticalParticleSystem {
  constructor(containerId = 'particles') {
    this.particles = [];
    this.container = document.getElementById(containerId);
    this.isAnimating = false;
    this.init();
  }

  init() {
    if (!this.container) return;
    this.createParticles();
    this.animate();
  }

  createParticles(count = 50) {
    const colors = ['#00FFFF', '#FF00FF', '#8A2BE2'];
    
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'mystical-particle';
      
      // Случайное позиционирование
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      
      // Случайная задержка анимации
      particle.style.animationDelay = Math.random() * 6 + 's';
      
      // Случайный размер
      const size = Math.random() * 3 + 1;
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      
      // Случайный цвет
      const color = colors[Math.floor(Math.random() * colors.length)];
      particle.style.background = color;
      particle.style.boxShadow = `0 0 10px ${color}`;
      
      this.container.appendChild(particle);
      this.particles.push(particle);
    }
  }

  animate() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const animateParticles = () => {
      this.particles.forEach(particle => {
        // Добавляем случайное движение
        const moveX = (Math.random() - 0.5) * 2;
        const moveY = (Math.random() - 0.5) * 2;
        
        const currentX = parseFloat(particle.style.left);
        const currentY = parseFloat(particle.style.top);
        
        let newX = currentX + moveX;
        let newY = currentY + moveY;
        
        // Обертывание по экрану
        if (newX > 100) newX = 0;
        if (newX < 0) newX = 100;
        if (newY > 100) newY = 0;
        if (newY < 0) newY = 100;
        
        particle.style.left = newX + '%';
        particle.style.top = newY + '%';
      });
      
      requestAnimationFrame(animateParticles);
    };

    animateParticles();
  }

  destroy() {
    this.isAnimating = false;
    this.particles.forEach(particle => particle.remove());
    this.particles = [];
  }
}

/**
 * Анимированный счетчик
 */
export class MysticalCounter {
  constructor(element, target, duration = 2000) {
    this.element = element;
    this.target = target;
    this.duration = duration;
    this.current = 0;
    this.increment = target / (duration / 16);
    this.animate();
  }

  animate() {
    if (this.current < this.target) {
      this.current += this.increment;
      if (this.current > this.target) {
        this.current = this.target;
      }
      this.element.textContent = Math.floor(this.current).toLocaleString();
      requestAnimationFrame(() => this.animate());
    }
  }
}

/**
 * Мистический орб с интерактивностью
 */
export class MysticalOrb {
  constructor(selector) {
    this.orb = document.querySelector(selector);
    this.init();
  }

  init() {
    if (!this.orb) return;
    
    this.orb.addEventListener('mouseenter', () => this.onHover());
    this.orb.addEventListener('mouseleave', () => this.onLeave());
    this.orb.addEventListener('click', () => this.onClick());
  }

  onHover() {
    this.orb.style.transform = 'scale(1.1)';
    this.orb.style.boxShadow = '0 0 100px rgba(255, 0, 255, 0.8), inset 0 0 50px rgba(255, 255, 255, 0.2)';
  }

  onLeave() {
    this.orb.style.transform = '';
    this.orb.style.boxShadow = '';
  }

  onClick() {
    this.orb.style.animation = 'none';
    this.orb.offsetHeight; // Принудительный reflow
    this.orb.style.animation = 'mystical-pulse 0.5s ease-out';
    
    // Создание искр
    this.createSparkles();
  }

  createSparkles() {
    const orbRect = this.orb.getBoundingClientRect();
    const sparkleCount = 12;
    const colors = ['#00FFFF', '#FF00FF', '#8A2BE2'];
    
    for (let i = 0; i < sparkleCount; i++) {
      const sparkle = document.createElement('div');
      sparkle.style.cssText = `
        position: fixed;
        width: 4px;
        height: 4px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        left: ${orbRect.left + orbRect.width / 2}px;
        top: ${orbRect.top + orbRect.height / 2}px;
        box-shadow: 0 0 10px currentColor;
      `;
      
      document.body.appendChild(sparkle);
      
      // Анимация искр
      const angle = (i / sparkleCount) * Math.PI * 2;
      const distance = 100;
      const endX = Math.cos(angle) * distance;
      const endY = Math.sin(angle) * distance;
      
      sparkle.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${endX}px, ${endY}px) scale(0)`, opacity: 0 }
      ], {
        duration: 1000,
        easing: 'ease-out'
      }).onfinish = () => sparkle.remove();
    }
  }
}

/**
 * Система уведомлений в стиле MYSTIKA
 */
export class MysticalNotifications {
  static show(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'mystical-notification';
    
    const backgrounds = {
      success: 'linear-gradient(135deg, #00FF00, #00FFFF)',
      error: 'linear-gradient(135deg, #FF00FF, #8A2BE2)',
      info: 'linear-gradient(135deg, #00FFFF, #8A2BE2)',
      warning: 'linear-gradient(135deg, #FFD700, #FF8C00)'
    };

    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${backgrounds[type]};
      color: var(--primary-dark);
      padding: 1rem 2rem;
      border-radius: 15px;
      font-weight: 500;
      z-index: 10000;
      animation: mystical-slide-in 0.5s ease-out;
      box-shadow: 0 10px 30px rgba(0, 255, 255, 0.3);
      backdrop-filter: blur(10px);
      max-width: 300px;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'mystical-slide-out 0.5s ease-in forwards';
      setTimeout(() => notification.remove(), 500);
    }, duration);
  }
}

/**
 * Управление карточками игр
 */
export class MysticalGameCards {
  constructor() {
    this.cards = document.querySelectorAll('.mystical-card');
    this.init();
  }

  init() {
    this.cards.forEach(card => {
      card.addEventListener('mouseenter', () => this.onCardHover(card));
      card.addEventListener('mouseleave', () => this.onCardLeave(card));
      card.addEventListener('click', () => this.onCardClick(card));
    });
  }

  onCardHover(card) {
    card.style.boxShadow = '0 20px 40px rgba(0, 255, 255, 0.4)';
    
    const icon = card.querySelector('.card-icon');
    if (icon) {
      icon.style.transform = 'scale(1.1) rotate(5deg)';
    }
  }

  onCardLeave(card) {
    card.style.boxShadow = '';
    
    const icon = card.querySelector('.card-icon');
    if (icon) {
      icon.style.transform = '';
    }
  }

  onCardClick(card) {
    card.style.transform = 'translateY(-10px) scale(1.02)';
    setTimeout(() => {
      card.style.transform = 'translateY(-10px)';
    }, 150);
  }
}

/**
 * Система мистических эффектов мыши
 */
export class MysticalMouseTrail {
  constructor() {
    this.isEnabled = true;
    this.init();
  }

  init() {
    document.addEventListener('mousemove', (e) => {
      if (this.isEnabled && Math.random() < 0.1) { // 10% вероятность создания следа
        this.createTrail(e.clientX, e.clientY);
      }
    });
  }

  createTrail(x, y) {
    const colors = ['#00FFFF', '#FF00FF', '#8A2BE2'];
    const trail = document.createElement('div');
    trail.style.cssText = `
      position: fixed;
      width: 6px;
      height: 6px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: 50%;
      pointer-events: none;
      z-index: 1;
      left: ${x - 3}px;
      top: ${y - 3}px;
      animation: mystical-trail-fade 1s ease-out forwards;
      box-shadow: 0 0 10px currentColor;
    `;
    
    document.body.appendChild(trail);
    setTimeout(() => trail.remove(), 1000);
  }

  toggle() {
    this.isEnabled = !this.isEnabled;
  }
}

/**
 * Telegram WebApp интеграция
 */
export class TelegramWebAppIntegration {
  constructor() {
    this.tg = window.Telegram?.WebApp;
    this.init();
  }

  init() {
    if (!this.tg) return;

    // Настройка темы
    this.setupTheme();
    
    // Настройка главной кнопки
    this.setupMainButton();
    
    // Настройка обратной кнопки
    this.setupBackButton();
    
    // Предотвращение закрытия
    this.tg.enableClosingConfirmation();
    
    console.log('🔮 MYSTIKA Telegram WebApp интеграция активна');
  }

  setupTheme() {
    const isDark = this.tg.colorScheme === 'dark';
    document.documentElement.classList.toggle('telegram-dark', isDark);
    
    // Применение цветов Telegram
    document.documentElement.style.setProperty(
      '--tg-theme-bg-color', 
      this.tg.themeParams.bg_color || 'var(--primary-dark)'
    );
    document.documentElement.style.setProperty(
      '--tg-theme-text-color', 
      this.tg.themeParams.text_color || 'var(--text-primary)'
    );
  }

  setupMainButton() {
    this.tg.MainButton.setText('🔮 Главное меню');
    this.tg.MainButton.color = '#00FFFF';
    this.tg.MainButton.textColor = '#1A001A';
  }

  setupBackButton() {
    this.tg.BackButton.onClick(() => {
      // Логика возврата
      console.log('Возврат в MYSTIKA');
    });
  }

  showMainButton(text = '🔮 Главное меню', callback = null) {
    this.tg.MainButton.setText(text);
    if (callback) {
      this.tg.MainButton.onClick(callback);
    }
    this.tg.MainButton.show();
  }

  hideMainButton() {
    this.tg.MainButton.hide();
  }

  hapticFeedback(type = 'impact') {
    if (this.tg.HapticFeedback) {
      this.tg.HapticFeedback[type]();
    }
  }
}

// Добавление CSS анимаций
const mysticalAnimationsCSS = `
@keyframes mystical-slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes mystical-slide-out {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}

@keyframes mystical-trail-fade {
  0% { opacity: 0.8; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.3); }
}
`;

// Добавление стилей в DOM
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = mysticalAnimationsCSS;
  document.head.appendChild(style);
}

// Экспорт функций инициализации
export const initMysticalEffects = () => {
  // Инициализация частиц
  new MysticalParticleSystem();
  
  // Инициализация карточек
  new MysticalGameCards();
  
  // Инициализация орбов
  new MysticalOrb('.mystical-orb');
  
  // Инициализация следа мыши
  new MysticalMouseTrail();
  
  // Инициализация Telegram WebApp
  new TelegramWebAppIntegration();
  
  console.log('🔮 MYSTIKA мистические эффекты активированы');
};

// Утилиты
export const mysticalUtils = {
  // Случайный выбор элемента массива
  randomChoice: (array) => array[Math.floor(Math.random() * array.length)],
  
  // Случайное число в диапазоне
  randomRange: (min, max) => Math.random() * (max - min) + min,
  
  // Плавная прокрутка к элементу
  scrollToElement: (selector) => {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },
  
  // Показ уведомления
  notify: MysticalNotifications.show
};