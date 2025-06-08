import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUserStore = create(
  persist(
    (set, get) => ({
      // State
      profile: null,
      preferences: {
        theme: 'dark',
        language: 'en',
        notifications: true,
        autoSave: true,
        cardBack: 'default',
        spreadAnimation: true
      },
      readings: [],
      favorites: [],
      subscription: {
        type: 'free',
        expiresAt: null,
        features: ['basic-readings', 'three-card-spread']
      },
      stats: {
        totalReadings: 0,
        readingsThisMonth: 0,
        favoriteSpread: null,
        joinedDate: null
      },
      isLoading: false,
      error: null,

      // Actions
      fetchProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/users/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch profile');
          }

          const profile = await response.json();
          set({ profile, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileData)
          });

          if (!response.ok) {
            throw new Error('Failed to update profile');
          }

          const updatedProfile = await response.json();
          set({ profile: updatedProfile, isLoading: false });
          return { success: true };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      updatePreferences: (newPreferences) => {
        set(state => ({
          preferences: { ...state.preferences, ...newPreferences }
        }));
        
        // Save to backend
        get().savePreferences();
      },

      savePreferences: async () => {
        try {
          const token = localStorage.getItem('token');
          const { preferences } = get();
          
          await fetch('/api/users/preferences', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(preferences)
          });
        } catch (error) {
          console.error('Failed to save preferences:', error);
        }
      },

      fetchReadings: async (page = 1, limit = 10) => {
        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/readings?page=${page}&limit=${limit}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch readings');
          }

          const data = await response.json();
          set({ 
            readings: page === 1 ? data.readings : [...get().readings, ...data.readings],
            isLoading: false 
          });
          
          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      addToFavorites: async (readingId) => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/readings/${readingId}/favorite`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to add to favorites');
          }

          set(state => ({
            favorites: [...state.favorites, readingId]
          }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      removeFromFavorites: async (readingId) => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/readings/${readingId}/favorite`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to remove from favorites');
          }

          set(state => ({
            favorites: state.favorites.filter(id => id !== readingId)
          }));
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      updateSubscription: (subscriptionData) => {
        set({ subscription: subscriptionData });
      },

      incrementReadingCount: () => {
        set(state => ({
          stats: {
            ...state.stats,
            totalReadings: state.stats.totalReadings + 1,
            readingsThisMonth: state.stats.readingsThisMonth + 1
          }
        }));
      },

      fetchStats: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/users/stats', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch stats');
          }

          const stats = await response.json();
          set({ stats });
        } catch (error) {
          console.error('Failed to fetch stats:', error);
        }
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          profile: null,
          readings: [],
          favorites: [],
          error: null,
          isLoading: false
        });
      }
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        preferences: state.preferences,
        subscription: state.subscription,
        favorites: state.favorites
      })
    }
  )
);

export default useUserStore;