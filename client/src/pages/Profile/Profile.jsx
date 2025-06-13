// client/src/pages/Profile/Profile.jsx
import React, { useState, useEffect } from 'react';
import  useAuthStore  from '../../store/authStore';
import  useUserStore  from '../../store/userStore';
import   useSettingsStore   from '../../store/settingsStore';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import { formatDate, isValidEmail } from '../../utils/helpers';
import { THEMES, LANGUAGES, SUCCESS_MESSAGES } from '../../utils/constants';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { Modal } from '../../components/common/Modal';
import './Profile.css';

const Profile = () => {
  const { user, setUser, isAuthenticated, logout } = useAuthStore();
  const { preferences, setPreferences } = useUserStore();
  const { updateProfile } = useAuth();
  const { 
    theme, setTheme, 
    language, setLanguage, 
    cardGeneration, 
    updateCardGeneration 
  } = useSettingsStore();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    birthDate: '',
    timezone: 'Europe/Moscow'
  });

  const [settingsData, setSettingsData] = useState({
    theme: theme || 'dark',
    language: language || 'ru',
    notifications: {
      daily: true,
      readings: true,
      premium: true,
      marketing: false
    },
    privacy: {
      showProfile: true,
      showReadings: false,
      showStatistics: true
    },
    cardGeneration: cardGeneration || {
      defaultStyle: 'mystic',
      autoGenerate: true,
      highQuality: false,
      parallelGeneration: true,
      fallbackEnabled: true
    }
  });

  const [availableStyles, setAvailableStyles] = useState({});

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        bio: user.bio || '',
        birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
        timezone: user.timezone || 'Europe/Moscow'
      });
    }
  }, [user]);

  useEffect(() => {
    if (preferences) {
      console.log('👤 Loading user preferences:', preferences);
      setSettingsData(prev => ({
        ...prev,
        notifications: { ...prev.notifications, ...preferences.notifications },
        privacy: { ...prev.privacy, ...preferences.privacy },
        cardGeneration: { ...prev.cardGeneration, ...preferences.cardGeneration }
      }));
      
      // Также обновляем store, если есть настройки генерации карт
      if (preferences.cardGeneration) {
        console.log('👤 Updating store with user cardGeneration:', preferences.cardGeneration);
        updateCardGeneration(preferences.cardGeneration);
      }
    }
  }, [preferences, updateCardGeneration]);

  // Синхронизация с настройками из store
  useEffect(() => {
    if (cardGeneration) {
      console.log('🔄 Syncing cardGeneration from store:', cardGeneration);
      setSettingsData(prev => ({
        ...prev,
        cardGeneration: { ...prev.cardGeneration, ...cardGeneration }
      }));
    }
  }, [cardGeneration]);

  // Загружаем доступные стили колод
  useEffect(() => {
    const loadAvailableStyles = async () => {
      try {
        const response = await api.getAvailableStyles();
        if (response.success) {
          setAvailableStyles(response.styles);
        }
      } catch (error) {
        console.error('Failed to load available styles:', error);
        // Устанавливаем дефолтные стили в случае ошибки
        setAvailableStyles({
          mystic: { name: 'Мистический', emoji: '🔮' },
          classic: { name: 'Классический', emoji: '📜' },
          modern: { name: 'Современный', emoji: '🔳' },
          fantasy: { name: 'Фэнтези', emoji: '🧚' }
        });
      }
    };
    
    loadAvailableStyles();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSettingsChange = (section, field, value) => {
    setSettingsData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));

    // Если изменяются настройки генерации карт, сразу обновляем в store
    if (section === 'cardGeneration') {
      const updatedCardGeneration = {
        ...settingsData.cardGeneration,
        [field]: value
      };
      console.log('🔧 Updating card generation settings:', updatedCardGeneration);
      updateCardGeneration(updatedCardGeneration);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      // Валидация
      if (!formData.firstName.trim()) {
        addNotification('Имя не может быть пустым', 'error');
        return;
      }
      
      if (formData.email && !isValidEmail(formData.email)) {
        addNotification('Некорректный email адрес', 'error');
        return;
      }

      const result = await updateProfile({
        ...formData,
        preferences: {
          notifications: settingsData.notifications,
          privacy: settingsData.privacy,
          cardGeneration: settingsData.cardGeneration
        }
      });
      
      // Также обновляем в store для мгновенного применения
      console.log('💾 Saving card generation settings to server:', settingsData.cardGeneration);
      updateCardGeneration(settingsData.cardGeneration);
      
      if (result.success) {
        setUser(result.user);
        setPreferences(result.user.preferences);
        console.log('✅ Profile saved successfully, user preferences:', result.user.preferences);
        addNotification('Профиль успешно обновлен!', 'success');
      }
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
      addNotification('Ошибка сохранения профиля. Попробуйте еще раз.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    try {
      setLoading(true);
      const avatarUrl = await uploadAvatar(avatarFile);
      const updatedUser = { ...user, avatar: avatarUrl };
      setUser(updatedUser);
      setAvatarModalOpen(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      addNotification('Аватар обновлен!', 'success');
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      addNotification('Ошибка загрузки аватара', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addNotification('Размер файла не должен превышать 5MB', 'error');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        addNotification('Можно загружать только изображения', 'error');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      await deleteAccount();
      logout();
      addNotification('Аккаунт удален', 'info');
      window.location.href = ROUTES.HOME;
    } catch (error) {
      console.error('Ошибка удаления аккаунта:', error);
      addNotification('Ошибка удаления аккаунта', 'error');
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
    }
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      const userData = await exportUserData();
      const blob = new Blob([JSON.stringify(userData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mistika_user_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportModalOpen(false);
      addNotification('Данные экспортированы!', 'success');
    } catch (error) {
      console.error('Ошибка экспорта данных:', error);
      addNotification('Ошибка экспорта данных', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    setSettingsData(prev => ({ ...prev, theme: newTheme }));
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setSettingsData(prev => ({ ...prev, language: newLanguage }));
  };

  const handleTestGeneration = async () => {
    try {
      setLoading(true);
      addNotification('Запуск тестовой генерации...', 'info');
      
      // Показываем текущие настройки
      const currentSettings = cardGeneration || settingsData.cardGeneration;
      console.log('🧪 Testing with settings:', currentSettings);
      addNotification(
        `Тестирование со стилем: ${currentSettings.defaultStyle || 'mystic'}`, 
        'info'
      );
      
      const result = await api.testImageGeneration();
      
      if (result.success) {
        addNotification(
          `Тест успешен! ${result.isMock ? 'Использован fallback режим' : 'AI генерация работает'}`, 
          'success'
        );
      } else {
        addNotification(`Тест не прошел: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Test generation error:', error);
      addNotification('Ошибка тестирования генерации', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleShowCurrentSettings = () => {
    const currentSettings = cardGeneration || settingsData.cardGeneration;
    console.log('📋 Current card generation settings:', currentSettings);
    addNotification(
      `Текущие настройки: стиль "${currentSettings.defaultStyle}", ` +
      `параллельная генерация: ${currentSettings.parallelGeneration ? 'ВКЛ' : 'ВЫКЛ'}`,
      'info'
    );
  };

  const addNotification = (message, type) => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  if (!isAuthenticated) {
    return (
      <div className="profile-page">
        <div className="auth-required">
          <h2>Требуется авторизация</h2>
          <p>Войдите в систему, чтобы управлять профилем.</p>
          <Button variant="primary" onClick={() => window.location.href = ROUTES.HOME}>
            На главную
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Уведомления */}
      {notifications.length > 0 && (
        <div className="notifications">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`notification notification-${notification.type}`}
            >
              {notification.message}
            </div>
          ))}
        </div>
      )}

      {/* Заголовок */}
      <div className="profile-header">
        <h1>Настройки профиля</h1>
        <p>Управляйте своими данными и настройками приложения</p>
      </div>

      <div className="profile-content">
        {/* Основная информация */}
        <div className="profile-section">
          <div className="section-header">
            <h2>Основная информация</h2>
            <p>Ваши личные данные и информация о профиле</p>
          </div>

          <div className="profile-form">
            {/* Аватар */}
            <div className="avatar-section">
              <div className="avatar-container">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Аватар" className="avatar-image" />
                ) : (
                  <div className="avatar-placeholder">
                    {(formData.firstName?.[0] || user?.username?.[0] || '?').toUpperCase()}
                  </div>
                )}
                <button
                  className="avatar-edit-button"
                  onClick={() => setAvatarModalOpen(true)}
                >
                  📷
                </button>
              </div>
              <div className="avatar-info">
                <h4>{formData.firstName || user?.username || 'Пользователь'}</h4>
                <p>Участник с {formatDate(user?.createdAt)}</p>
              </div>
            </div>

            {/* Поля формы */}
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="firstName">Имя *</label>
                <input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Введите ваше имя"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Фамилия</label>
                <input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Введите вашу фамилию"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your@email.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="birthDate">Дата рождения</label>
                <input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="bio">О себе</label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Расскажите немного о себе..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="timezone">Часовой пояс</label>
                <select
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                >
                  <option value="Europe/Moscow">Москва (UTC+3)</option>
                  <option value="Europe/Kiev">Киев (UTC+2)</option>
                  <option value="Asia/Almaty">Алматы (UTC+6)</option>
                  <option value="Asia/Tashkent">Ташкент (UTC+5)</option>
                  <option value="Europe/Minsk">Минск (UTC+3)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Настройки приложения */}
        <div className="profile-section">
          <div className="section-header">
            <h2>Настройки приложения</h2>
            <p>Персонализация интерфейса и поведения приложения</p>
          </div>

          <div className="settings-grid">
            {/* Тема */}
            <div className="setting-group">
              <h4>Тема оформления</h4>
              <div className="theme-options">
                {[{key: 'dark', label: '🌙 Темная'}, {key: 'light', label: '☀️ Светлая'}, {key: 'auto', label: '🔄 Автоматическая'}].map(({key, label}) => (
                  <label key={key} className="theme-option">
                    <input
                      type="radio"
                      name="theme"
                      value={key}
                      checked={settingsData.theme === key}
                      onChange={() => handleThemeChange(key)}
                    />
                    <span className="theme-label">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Язык */}
            <div className="setting-group">
              <h4>Язык интерфейса</h4>
              <select
                value={settingsData.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="language-select"
              >
                <option value="ru">🇷🇺 Русский</option>
                <option value="en">🇺🇸 English</option>
                <option value="es">🇪🇸 Español</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="de">🇩🇪 Deutsch</option>
              </select>
            </div>

            {/* Уведомления */}
            <div className="setting-group">
              <h4>Уведомления</h4>
              <div className="notifications-settings">
                {Object.entries(settingsData.notifications).map(([key, value]) => (
                  <label key={key} className="notification-option">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleSettingsChange('notifications', key, e.target.checked)}
                    />
                    <span className="notification-label">
                      {key === 'daily' && 'Дневные карты'}
                      {key === 'readings' && 'Завершение гаданий'}
                      {key === 'premium' && 'Премиум возможности'}
                      {key === 'marketing' && 'Маркетинговые сообщения'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Приватность */}
            <div className="setting-group">
              <h4>Приватность</h4>
              <div className="privacy-settings">
                {Object.entries(settingsData.privacy).map(([key, value]) => (
                  <label key={key} className="privacy-option">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleSettingsChange('privacy', key, e.target.checked)}
                    />
                    <span className="privacy-label">
                      {key === 'showProfile' && 'Показывать профиль друзьям'}
                      {key === 'showReadings' && 'Делиться гаданиями'}
                      {key === 'showStatistics' && 'Показывать статистику'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Настройки генерации изображений */}
        <div className="profile-section">
          <div className="section-header">
            <h2>🎨 Генерация изображений карт</h2>
            <p>Настройки AI генерации персональных изображений карт Таро</p>
          </div>

          <div className="settings-grid">
            {/* Стиль колоды по умолчанию */}
            <div className="setting-group">
              <h4>Стиль колоды по умолчанию</h4>
              <div className="style-options">
                {Object.entries(availableStyles).map(([key, style]) => (
                  <label key={key} className="style-option">
                    <input
                      type="radio"
                      name="defaultStyle"
                      value={key}
                      checked={settingsData.cardGeneration.defaultStyle === key}
                      onChange={() => {
                        handleSettingsChange('cardGeneration', 'defaultStyle', key);
                        addNotification(`Стиль изменен на "${style.name}"`, 'success');
                      }}
                    />
                    <span className="style-label">
                      {style.emoji} {style.name}
                    </span>
                    {style.description && (
                      <span className="style-description">{style.description}</span>
                    )}
                  </label>
                ))}
              </div>
              <div className="current-style-info">
                <small>
                  💡 Текущий стиль: <strong>
                    {availableStyles[settingsData.cardGeneration.defaultStyle]?.name || settingsData.cardGeneration.defaultStyle}
                  </strong>
                </small>
              </div>
            </div>

            {/* Параметры генерации */}
            <div className="setting-group">
              <h4>Параметры генерации</h4>
              <div className="generation-settings">
                <label className="generation-option">
                  <input
                    type="checkbox"
                    checked={settingsData.cardGeneration.autoGenerate}
                    onChange={(e) => handleSettingsChange('cardGeneration', 'autoGenerate', e.target.checked)}
                  />
                  <span className="generation-label">
                    <strong>Автоматическая генерация</strong>
                    <small>Генерировать изображения автоматически при получении новых карт</small>
                  </span>
                </label>

                <label className="generation-option">
                  <input
                    type="checkbox"
                    checked={settingsData.cardGeneration.parallelGeneration}
                    onChange={(e) => {
                      handleSettingsChange('cardGeneration', 'parallelGeneration', e.target.checked);
                      addNotification(
                        `Параллельная генерация ${e.target.checked ? 'включена' : 'отключена'}`, 
                        'success'
                      );
                    }}
                  />
                  <span className="generation-label">
                    <strong>Параллельная генерация</strong>
                    <small>Генерировать несколько изображений одновременно (быстрее)</small>
                  </span>
                </label>

                <label className="generation-option">
                  <input
                    type="checkbox"
                    checked={settingsData.cardGeneration.fallbackEnabled}
                    onChange={(e) => handleSettingsChange('cardGeneration', 'fallbackEnabled', e.target.checked)}
                  />
                  <span className="generation-label">
                    <strong>Резервные изображения</strong>
                    <small>Использовать стандартные изображения при сбое генерации</small>
                  </span>
                </label>

                {user?.isPremium && (
                  <label className="generation-option">
                    <input
                      type="checkbox"
                      checked={settingsData.cardGeneration.highQuality}
                      onChange={(e) => handleSettingsChange('cardGeneration', 'highQuality', e.target.checked)}
                    />
                    <span className="generation-label">
                      <strong>Высокое качество</strong>
                      <small>Генерация в высоком разрешении (только для Premium)</small>
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* Тест генерации */}
            <div className="setting-group">
              <h4>Тестирование</h4>
              <div className="test-generation">
                <p className="test-description">
                  Протестируйте генерацию изображений с выбранными настройками
                </p>
                <div className="test-buttons">
                  <Button
                    variant="outline"
                    onClick={handleTestGeneration}
                    disabled={loading}
                    className="test-button"
                  >
                    {loading ? 'Тестирование...' : '🧪 Тестовая генерация'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShowCurrentSettings}
                    className="test-button"
                  >
                    📋 Показать текущие настройки
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Действия с данными */}
        <div className="profile-section">
          <div className="section-header">
            <h2>Управление данными</h2>
            <p>Экспорт, удаление и другие действия с вашими данными</p>
          </div>

          <div className="data-actions">
            <Button
              variant="outline"
              onClick={() => setExportModalOpen(true)}
              disabled={loading}
            >
              📥 Экспортировать данные
            </Button>
            
            <Button
              variant="danger"
              onClick={() => setDeleteModalOpen(true)}
              disabled={loading}
            >
              🗑️ Удалить аккаунт
            </Button>
          </div>
        </div>

        {/* Кнопка сохранения */}
        <div className="profile-actions">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSaveProfile}
            disabled={saving}
          >
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
        </div>
      </div>

      {/* Модальное окно аватара */}
      <Modal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        title="Изменить аватар"
      >
        <div className="avatar-modal-content">
          <div className="avatar-upload">
            {avatarPreview ? (
              <div className="avatar-preview">
                <img src={avatarPreview} alt="Предпросмотр" />
              </div>
            ) : (
              <div className="upload-area">
                <div className="upload-icon">📷</div>
                <p>Выберите изображение</p>
              </div>
            )}
            
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              style={{ display: 'none' }}
              id="avatar-input"
            />
            
            <div className="avatar-actions">
              <Button
                variant="outline"
                onClick={() => document.getElementById('avatar-input').click()}
              >
                Выбрать файл
              </Button>
              
              {avatarFile && (
                <Button
                  variant="primary"
                  onClick={handleAvatarUpload}
                  disabled={loading}
                >
                  {loading ? 'Загрузка...' : 'Сохранить'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Модальное окно экспорта */}
      <Modal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Экспорт данных"
      >
        <div className="export-modal-content">
          <p>Экспорт включает:</p>
          <ul>
            <li>Профиль и настройки</li>
            <li>История гаданий</li>
            <li>Статистика использования</li>
            <li>Сохраненные расклады</li>
          </ul>
          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={() => setExportModalOpen(false)}
            >
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={handleExportData}
              disabled={loading}
            >
              {loading ? 'Экспорт...' : 'Экспортировать'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Модальное окно удаления */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Удаление аккаунта"
      >
        <div className="delete-modal-content">
          <div className="warning-icon">⚠️</div>
          <h3>Вы уверены?</h3>
          <p>
            Это действие нельзя отменить. Все ваши данные, включая историю гаданий 
            и настройки, будут безвозвратно удалены.
          </p>
          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={() => setDeleteModalOpen(false)}
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              disabled={loading}
            >
              {loading ? 'Удаление...' : 'Удалить аккаунт'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;