// client/src/pages/Friends/Friends.jsx
import React, { useState, useEffect } from 'react';
import  useAuthStore  from '@store/authStore';
import  useUserStore  from '@store/userStore';
import { shareReading, getFriends, sendFriendRequest } from '@services/api';
import { ROUTES, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@utils/constants';
import { copyToClipboard } from '@utils/helpers';
import Button from '@components/common/Button';
import Loading from '@components/common/Loading';
import Modal from '@components/common/Modal';
import './Friends.css';

const Friends = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { friends, setFriends } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedReading, setSelectedReading] = useState(null);
  const [inviteLink, setInviteLink] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadFriends();
      generateInviteLink();
    }
  }, [isAuthenticated]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const friendsData = await getFriends();
      setFriends(friendsData);
    } catch (error) {
      console.error('Ошибка загрузки друзей:', error);
      addNotification(ERROR_MESSAGES.NETWORK_ERROR, 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateInviteLink = () => {
    const baseUrl = window.location.origin;
    const referralCode = user?.referralCode || user?.id;
    const link = `${baseUrl}?ref=${referralCode}`;
    setInviteLink(link);
  };

  const handleShareReading = async (readingId) => {
    try {
      const shareData = await shareReading(readingId);
      const shareUrl = `${window.location.origin}/shared/${shareData.shareId}`;
      await copyToClipboard(shareUrl);
      addNotification(SUCCESS_MESSAGES.SHARING_SUCCESS, 'success');
      setShareModalOpen(false);
    } catch (error) {
      console.error('Ошибка создания ссылки:', error);
      addNotification(ERROR_MESSAGES.NETWORK_ERROR, 'error');
    }
  };

  const handleInviteFriend = async () => {
    try {
      await copyToClipboard(inviteLink);
      addNotification('Ссылка-приглашение скопирована!', 'success');
    } catch (error) {
      addNotification('Ошибка копирования ссылки', 'error');
    }
  };

  const handleSendFriendRequest = async (username) => {
    try {
      await sendFriendRequest(username);
      addNotification('Запрос дружбы отправлен!', 'success');
      setSearchQuery('');
    } catch (error) {
      console.error('Ошибка отправки запроса:', error);
      addNotification(ERROR_MESSAGES.NETWORK_ERROR, 'error');
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

  const filteredFriends = friends.filter(friend =>
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="friends-page">
        <div className="auth-required">
          <h2>Требуется авторизация</h2>
          <p>Войдите в систему, чтобы просматривать друзей и делиться гаданиями.</p>
          <Button variant="primary" onClick={() => window.location.href = ROUTES.HOME}>
            На главную
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="friends-page">
        <Loading text="Загрузка списка друзей..." />
      </div>
    );
  }

  return (
    <div className="friends-page">
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
      <div className="friends-header">
        <h1>Друзья и сообщество</h1>
        <p>Делитесь мистическими открытиями с близкими</p>
      </div>

      {/* Приглашение друзей */}
      <div className="invite-section">
        <div className="invite-card">
          <div className="invite-icon">👥</div>
          <h3>Пригласить друзей</h3>
          <p>Поделитесь магией Таро с друзьями и получите бонусы!</p>
          <div className="invite-link">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="invite-input"
            />
            <Button
              variant="primary"
              onClick={handleInviteFriend}
              className="copy-button"
            >
              📋 Копировать
            </Button>
          </div>
          <div className="invite-stats">
            <span>Приглашено: {user?.referrals?.length || 0}</span>
            <span>Бонусов получено: {user?.referralBonus || 0}</span>
          </div>
        </div>
      </div>

      {/* Поиск друзей */}
      <div className="search-section">
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Найти друзей по имени..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <div className="search-icon">🔍</div>
        </div>
      </div>

      {/* Список друзей */}
      <div className="friends-section">
        <h2>Ваши друзья ({friends.length})</h2>
        
        {filteredFriends.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <h3>
              {friends.length === 0 
                ? 'У вас пока нет друзей' 
                : 'Друзья не найдены'
              }
            </h3>
            <p>
              {friends.length === 0 
                ? 'Пригласите друзей и начните делиться мистическими открытиями!' 
                : 'Попробуйте изменить запрос поиска'
              }
            </p>
          </div>
        ) : (
          <div className="friends-grid">
            {filteredFriends.map(friend => (
              <div key={friend.id} className="friend-card">
                <div className="friend-avatar">
                  {friend.avatar ? (
                    <img src={friend.avatar} alt={friend.firstName} />
                  ) : (
                    <div className="avatar-placeholder">
                      {(friend.firstName?.[0] || friend.username?.[0] || '?').toUpperCase()}
                    </div>
                  )}
                  <div className={`status-indicator ${friend.isOnline ? 'online' : 'offline'}`} />
                </div>
                
                <div className="friend-info">
                  <h4>{friend.firstName || friend.username}</h4>
                  <p className="friend-status">
                    {friend.isOnline ? 'В сети' : `Был(а) ${friend.lastSeen}`}
                  </p>
                  <p className="friend-stats">
                    Гаданий: {friend.readingsCount || 0}
                  </p>
                </div>
                
                <div className="friend-actions">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedReading(friend.lastReading);
                      setShareModalOpen(true);
                    }}
                    disabled={!friend.lastReading}
                  >
                    Поделиться
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Рекомендации */}
      <div className="recommendations-section">
        <h2>Возможно, вы знаете</h2>
        <div className="recommendations-grid">
          {/* Здесь будут рекомендации друзей */}
          <div className="recommendation-card">
            <div className="recommendation-content">
              <div className="recommendation-icon">✨</div>
              <h4>Найдите друзей</h4>
              <p>Ищите друзей среди пользователей Telegram</p>
              <Button variant="outline" size="sm">
                Найти
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно для шаринга */}
      <Modal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title="Поделиться гаданием"
      >
        <div className="share-modal-content">
          <p>Вы хотите поделиться своим последним гаданием?</p>
          {selectedReading && (
            <div className="reading-preview">
              <h4>{selectedReading.name}</h4>
              <p>Дата: {new Date(selectedReading.createdAt).toLocaleDateString()}</p>
            </div>
          )}
          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={() => setShareModalOpen(false)}
            >
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={() => handleShareReading(selectedReading?.id)}
            >
              Поделиться
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Friends;