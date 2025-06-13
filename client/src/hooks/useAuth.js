import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useTelegram } from './useTelegram';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { webApp, user: tgUser } = useTelegram();

  // Проверка аутентификации при загрузке
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Проверяем токен в localStorage
      const token = localStorage.getItem('auth_token');
      if (!token) {
        // Если нет токена, пытаемся аутентифицироваться через Telegram
        if (tgUser && webApp?.initData) {
          await authenticateWithTelegram();
        } else {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
      } else {
        // Проверяем валидность токена
        const response = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          // Токен недействителен, удаляем его
          localStorage.removeItem('auth_token');
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Ошибка проверки аутентификации:', error);
      setError(error.response?.data?.message || 'Ошибка аутентификации');
      localStorage.removeItem('auth_token');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [tgUser, webApp]);

  const authenticateWithTelegram = useCallback(async () => {
    try {
      setError(null);
      
      if (!webApp?.initData) {
        throw new Error('Данные Telegram недоступны');
      }

      const response = await api.post('/auth/telegram', {
        initData: webApp.initData,
        user: tgUser
      });

      if (response.data.success) {
        const { token, user: userData } = response.data;
        
        // Сохраняем токен
        localStorage.setItem('auth_token', token);
        
        // Устанавливаем пользователя
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true, user: userData };
      } else {
        throw new Error(response.data.message || 'Ошибка аутентификации');
      }
    } catch (error) {
      console.error('Ошибка аутентификации через Telegram:', error);
      setError(error.message);
      throw error;
    }
  }, [webApp, tgUser]);

  const logout = useCallback(async () => {
    try {
      // Уведомляем сервер о выходе
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      // Очищаем локальные данные
      localStorage.removeItem('auth_token');
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates) => {
    try {
      setError(null);
      
      console.log('📡 Updating profile with data:', updates);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No auth token found');
      }
      
      const response = await api.put('/auth/profile', updates, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('📡 Profile update response:', response.data);

      if (response.data.success) {
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      } else {
        throw new Error(response.data.message || 'Ошибка обновления профиля');
      }
    } catch (error) {
      console.error('❌ Ошибка обновления профиля:', error);
      setError(error.response?.data?.message || error.message);
      throw error;
    }
  }, []);

  return {
    user,
    isAuthenticated,
    loading,
    isLoading: loading,
    error,
    authenticateWithTelegram,
    login: authenticateWithTelegram,
    logout,
    updateProfile,
    checkAuth
  };
};

export default useAuth;