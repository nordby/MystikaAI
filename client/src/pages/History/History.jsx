// client/src/pages/History/History.jsx
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@store/authStore';
import  useCardsStore  from '@store/cardsStore';
import { getReadingHistory, deleteReading, exportHistory } from '@services/api';
import { formatDate, formatDateTime } from '@utils/helpers';
import { READING_TYPES, ROUTES, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@utils/constants';
import Button from '@components/common/Button';
import Loading from '@components/common/Loading';
import Modal from '@components/common/Modal';
import TarotCard from '@components/cards/TarotCard';
import './History.css';

const History = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { readings, setReadings } = useCardsStore();
  const [loading, setLoading] = useState(true);
  const [selectedReading, setSelectedReading] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [readingToDelete, setReadingToDelete] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadHistory();
    }
  }, [isAuthenticated]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const history = await getReadingHistory();
      setReadings(history);
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
      addNotification(ERROR_MESSAGES.NETWORK_ERROR, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReading = (reading) => {
    setSelectedReading(reading);
    setModalOpen(true);
  };

  const handleDeleteReading = async () => {
    if (!readingToDelete) return;

    try {
      await deleteReading(readingToDelete.id);
      setReadings(readings.filter(r => r.id !== readingToDelete.id));
      addNotification('Гадание удалено', 'success');
      setDeleteModalOpen(false);
      setReadingToDelete(null);
    } catch (error) {
      console.error('Ошибка удаления:', error);
      addNotification(ERROR_MESSAGES.NETWORK_ERROR, 'error');
    }
  };

  const handleExportHistory = async () => {
    try {
      const exportData = await exportHistory();
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mistika_history_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addNotification('История экспортирована', 'success');
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      addNotification('Ошибка экспорта истории', 'error');
    }
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

  const getReadingTypeName = (type) => {
    const typeNames = {
      [READING_TYPES.DAILY_CARD]: 'Дневная карта',
      [READING_TYPES.ONE_CARD]: 'Одна карта',
      [READING_TYPES.THREE_CARDS]: 'Три карты',
      [READING_TYPES.CELTIC_CROSS]: 'Кельтский крест',
      [READING_TYPES.CUSTOM]: 'Пользовательский расклад',
      [READING_TYPES.NUMEROLOGY]: 'Нумерология',
      [READING_TYPES.LUNAR]: 'Лунный календарь'
    };
    return typeNames[type] || type;
  };

  const filteredAndSortedReadings = readings
    .filter(reading => {
      if (filter !== 'all' && reading.type !== filter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          reading.question?.toLowerCase().includes(query) ||
          reading.interpretation?.toLowerCase().includes(query) ||
          getReadingTypeName(reading.type).toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'type':
          return getReadingTypeName(a.type).localeCompare(getReadingTypeName(b.type));
        default:
          return 0;
      }
    });

  const groupedReadings = filteredAndSortedReadings.reduce((groups, reading) => {
    const date = formatDate(reading.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(reading);
    return groups;
  }, {});

  if (!isAuthenticated) {
    return (
      <div className="history-page">
        <div className="auth-required">
          <h2>Требуется авторизация</h2>
          <p>Войдите в систему, чтобы просматривать историю гаданий.</p>
          <Button variant="primary" onClick={() => window.location.href = ROUTES.HOME}>
            На главную
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="history-page">
        <Loading text="Загрузка истории гаданий..." />
      </div>
    );
  }

  return (
    <div className="history-page">
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
      <div className="history-header">
        <h1>История гаданий</h1>
        <p>Все ваши мистические открытия в одном месте</p>
      </div>

      {/* Статистика */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{readings.length}</div>
            <div className="stat-label">Всего гаданий</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {readings.filter(r => r.createdAt >= Date.now() - 7 * 24 * 60 * 60 * 1000).length}
            </div>
            <div className="stat-label">За неделю</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {new Set(readings.map(r => r.type)).size}
            </div>
            <div className="stat-label">Типов раскладов</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {readings.filter(r => r.type === READING_TYPES.DAILY_CARD).length}
            </div>
            <div className="stat-label">Дневных карт</div>
          </div>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="search-container">
            <input
              type="text"
              placeholder="Поиск по вопросу или интерпретации..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-controls">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Все типы</option>
              <option value={READING_TYPES.DAILY_CARD}>Дневная карта</option>
              <option value={READING_TYPES.ONE_CARD}>Одна карта</option>
              <option value={READING_TYPES.THREE_CARDS}>Три карты</option>
              <option value={READING_TYPES.CELTIC_CROSS}>Кельтский крест</option>
              <option value={READING_TYPES.NUMEROLOGY}>Нумерология</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="newest">Сначала новые</option>
              <option value="oldest">Сначала старые</option>
              <option value="type">По типу</option>
            </select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportHistory}
              disabled={readings.length === 0}
            >
              📥 Экспорт
            </Button>
          </div>
        </div>
      </div>

      {/* Список гаданий */}
      <div className="readings-section">
        {Object.keys(groupedReadings).length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔮</div>
            <h3>
              {readings.length === 0 
                ? 'У вас пока нет гаданий' 
                : 'Гадания не найдены'
              }
            </h3>
            <p>
              {readings.length === 0 
                ? 'Начните свой мистический путь с первого гадания!' 
                : 'Попробуйте изменить фильтры поиска'
              }
            </p>
            {readings.length === 0 && (
              <Button
                variant="primary"
                onClick={() => window.location.href = ROUTES.DAILY_CARD}
              >
                Получить дневную карту
              </Button>
            )}
          </div>
        ) : (
          Object.entries(groupedReadings).map(([date, dateReadings]) => (
            <div key={date} className="date-group">
              <h3 className="date-header">{date}</h3>
              <div className="readings-grid">
                {dateReadings.map(reading => (
                  <div key={reading.id} className="reading-card">
                    <div className="reading-header">
                      <div className="reading-type">
                        {getReadingTypeName(reading.type)}
                      </div>
                      <div className="reading-time">
                        {formatDateTime(reading.createdAt).split(' в ')[1]}
                      </div>
                    </div>
                    
                    <div className="reading-content">
                      {reading.cards && reading.cards.length > 0 && (
                        <div className="cards-preview">
                          {reading.cards.slice(0, 3).map((card, index) => (
                            <div key={index} className="card-mini">
                              <TarotCard
                                card={card}
                                size="sm"
                                isRevealed={true}
                                disabled={true}
                              />
                            </div>
                          ))}
                          {reading.cards.length > 3 && (
                            <div className="more-cards">
                              +{reading.cards.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {reading.question && (
                        <div className="reading-question">
                          <strong>Вопрос:</strong> {reading.question}
                        </div>
                      )}
                      
                      {reading.interpretation && (
                        <div className="reading-interpretation">
                          {reading.interpretation.length > 100 
                            ? `${reading.interpretation.substring(0, 100)}...`
                            : reading.interpretation
                          }
                        </div>
                      )}
                    </div>
                    
                    <div className="reading-actions">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReading(reading)}
                      >
                        Посмотреть
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="delete-button"
                        onClick={() => {
                          setReadingToDelete(reading);
                          setDeleteModalOpen(true);
                        }}
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Модальное окно просмотра гадания */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Детали гадания"
        size="lg"
      >
        {selectedReading && (
          <div className="reading-modal-content">
            <div className="reading-modal-header">
              <h3>{getReadingTypeName(selectedReading.type)}</h3>
              <p>{formatDateTime(selectedReading.createdAt)}</p>
            </div>
            
            {selectedReading.question && (
              <div className="reading-modal-question">
                <h4>Вопрос:</h4>
                <p>{selectedReading.question}</p>
              </div>
            )}
            
            {selectedReading.cards && selectedReading.cards.length > 0 && (
              <div className="reading-modal-cards">
                <h4>Карты:</h4>
                <div className="cards-display">
                  {selectedReading.cards.map((card, index) => (
                    <div key={index} className="card-with-position">
                      <TarotCard
                        card={card}
                        size="md"
                        isRevealed={true}
                        disabled={true}
                      />
                      {card.position && (
                        <div className="card-position-label">
                          {card.position}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {selectedReading.interpretation && (
              <div className="reading-modal-interpretation">
                <h4>Интерпретация:</h4>
                <div className="interpretation-text">
                  {selectedReading.interpretation}
                </div>
              </div>
            )}
            
            {selectedReading.numerologyData && (
              <div className="reading-modal-numerology">
                <h4>Нумерологические данные:</h4>
                <div className="numerology-data">
                  {Object.entries(selectedReading.numerologyData).map(([key, value]) => (
                    <div key={key} className="numerology-item">
                      <span className="numerology-key">{key}:</span>
                      <span className="numerology-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Модальное окно подтверждения удаления */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Подтверждение удаления"
      >
        <div className="delete-modal-content">
          <p>Вы уверены, что хотите удалить это гадание?</p>
          {readingToDelete && (
            <div className="delete-reading-info">
              <strong>{getReadingTypeName(readingToDelete.type)}</strong>
              <br />
              {formatDateTime(readingToDelete.createdAt)}
            </div>
          )}
          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={() => setDeleteModalOpen(false)}
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteReading}
            >
              Удалить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default History;