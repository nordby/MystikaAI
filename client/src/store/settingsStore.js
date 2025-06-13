import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSettingsStore = create(
  persist(
    (set, get) => ({
      // Application Settings
      theme: 'dark',
      language: 'en',
      
      // UI Settings
      animations: {
        enabled: true,
        duration: 300,
        cardFlip: true,
        shuffle: true,
        draw: true
      },
      
      // Card Settings
      cardSettings: {
        backDesign: 'celestial',
        autoReverse: true,
        reverseChance: 0.3,
        showReversed: true
      },
      
      // Audio Settings
      audio: {
        enabled: true,
        volume: 0.7,
        cardShuffle: true,
        cardDraw: true,
        notifications: true
      },
      
      // Reading Settings
      readingSettings: {
        autoSave: true,
        confirmBeforeExit: true,
        showInterpretations: true,
        defaultSpread: 'threeCard',
        guidedMode: false
      },
      
      // Privacy Settings
      privacy: {
        shareReadings: false,
        publicProfile: false,
        dataCollection: true,
        analytics: true
      },
      
      // Notification Settings
      notifications: {
        email: true,
        browser: true,
        dailyReading: false,
        weeklyInsight: true,
        newFeatures: true,
        marketing: false
      },
      
      // Advanced Settings
      advanced: {
        developerMode: false,
        experimentalFeatures: false,
        debugMode: false,
        performanceMode: false
      },

      // Card Generation Settings
      cardGeneration: {
        defaultStyle: 'mystic',
        autoGenerate: true,
        highQuality: false,
        parallelGeneration: true,
        fallbackEnabled: true
      },

      // Available themes
      availableThemes: [
        { id: 'light', name: 'Light', description: 'Clean and bright interface' },
        { id: 'dark', name: 'Dark', description: 'Easy on the eyes in low light' },
        { id: 'mystic', name: 'Mystic', description: 'Purple and gold mystical theme' },
        { id: 'celestial', name: 'Celestial', description: 'Star-filled cosmic theme' }
      ],

      // Available languages
      availableLanguages: [
        { id: 'en', name: 'English', flag: '🇺🇸' },
        { id: 'es', name: 'Español', flag: '🇪🇸' },
        { id: 'fr', name: 'Français', flag: '🇫🇷' },
        { id: 'de', name: 'Deutsch', flag: '🇩🇪' },
        { id: 'it', name: 'Italiano', flag: '🇮🇹' },
        { id: 'ru', name: 'Русский', flag: '🇷🇺' }
      ],

      // Available card backs
      availableCardBacks: [
        { id: 'celestial', name: 'Celestial', preview: '/images/card-backs/celestial.jpg' },
        { id: 'classic', name: 'Classic', preview: '/images/card-backs/classic.jpg' },
        { id: 'mystic', name: 'Mystic', preview: '/images/card-backs/mystic.jpg' },
        { id: 'geometric', name: 'Geometric', preview: '/images/card-backs/geometric.jpg' }
      ],

      // Actions
      updateTheme: (theme) => {
        set({ theme });
        document.documentElement.setAttribute('data-theme', theme);
        get().saveSettings();
      },

      updateLanguage: (language) => {
        set({ language });
        get().saveSettings();
      },

      updateAnimations: (animations) => {
        set(state => ({
          animations: { ...state.animations, ...animations }
        }));
        get().saveSettings();
      },

      updateCardSettings: (cardSettings) => {
        set(state => ({
          cardSettings: { ...state.cardSettings, ...cardSettings }
        }));
        get().saveSettings();
      },

      updateAudio: (audio) => {
        set(state => ({
          audio: { ...state.audio, ...audio }
        }));
        get().saveSettings();
      },

      updateReadingSettings: (readingSettings) => {
        set(state => ({
          readingSettings: { ...state.readingSettings, ...readingSettings }
        }));
        get().saveSettings();
      },

      updatePrivacy: (privacy) => {
        set(state => ({
          privacy: { ...state.privacy, ...privacy }
        }));
        get().saveSettings();
      },

      updateNotifications: (notifications) => {
        set(state => ({
          notifications: { ...state.notifications, ...notifications }
        }));
        get().saveSettings();
      },

      updateAdvanced: (advanced) => {
        set(state => ({
          advanced: { ...state.advanced, ...advanced }
        }));
        get().saveSettings();
      },

      updateCardGeneration: (cardGeneration) => {
        console.log('🏪 Store: updating cardGeneration:', cardGeneration);
        set(state => {
          const newState = {
            cardGeneration: { ...state.cardGeneration, ...cardGeneration }
          };
          console.log('🏪 Store: new cardGeneration state:', newState.cardGeneration);
          return newState;
        });
        // НЕ вызываем saveSettings() здесь - настройки генерации карт сохраняются через профиль
      },

      // Save settings to backend
      saveSettings: async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;

          const settings = get();
          const settingsData = {
            theme: settings.theme,
            language: settings.language,
            animations: settings.animations,
            cardSettings: settings.cardSettings,
            audio: settings.audio,
            readingSettings: settings.readingSettings,
            privacy: settings.privacy,
            notifications: settings.notifications,
            advanced: settings.advanced,
            cardGeneration: settings.cardGeneration
          };

          await fetch('/api/users/settings', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(settingsData)
          });
        } catch (error) {
          console.error('Failed to save settings:', error);
        }
      },

      // Load settings from backend
      loadSettings: async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;

          const response = await fetch('/api/users/settings', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) return;

          const settings = await response.json();
          set(settings);
          
          // Apply theme
          document.documentElement.setAttribute('data-theme', settings.theme);
        } catch (error) {
          console.error('Failed to load settings:', error);
        }
      },

      // Reset to defaults
      resetToDefaults: () => {
        set({
          theme: 'dark',
          language: 'en',
          animations: {
            enabled: true,
            duration: 300,
            cardFlip: true,
            shuffle: true,
            draw: true
          },
          cardSettings: {
            backDesign: 'celestial',
            autoReverse: true,
            reverseChance: 0.3,
            showReversed: true
          },
          audio: {
            enabled: true,
            volume: 0.7,
            cardShuffle: true,
            cardDraw: true,
            notifications: true
          },
          readingSettings: {
            autoSave: true,
            confirmBeforeExit: true,
            showInterpretations: true,
            defaultSpread: 'threeCard',
            guidedMode: false
          },
          privacy: {
            shareReadings: false,
            publicProfile: false,
            dataCollection: true,
            analytics: true
          },
          notifications: {
            email: true,
            browser: true,
            dailyReading: false,
            weeklyInsight: true,
            newFeatures: true,
            marketing: false
          },
          advanced: {
            developerMode: false,
            experimentalFeatures: false,
            debugMode: false,
            performanceMode: false
          },
          cardGeneration: {
            defaultStyle: 'mystic',
            autoGenerate: true,
            highQuality: false,
            parallelGeneration: true,
            fallbackEnabled: true
          }
        });
        get().saveSettings();
      },

      // Export settings
      exportSettings: () => {
        const settings = get();
        const exportData = {
          theme: settings.theme,
          language: settings.language,
          animations: settings.animations,
          cardSettings: settings.cardSettings,
          audio: settings.audio,
          readingSettings: settings.readingSettings,
          privacy: settings.privacy,
          notifications: settings.notifications,
          advanced: settings.advanced,
          cardGeneration: settings.cardGeneration,
          exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mistika-settings.json';
        link.click();
        
        URL.revokeObjectURL(url);
      },

      // Import settings
      importSettings: (settingsData) => {
        try {
          const validatedSettings = validateSettings(settingsData);
          set(validatedSettings);
          get().saveSettings();
          document.documentElement.setAttribute('data-theme', validatedSettings.theme);
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    }),
    {
      name: 'settings-storage',
      version: 1
    }
  )
);

// Helper function to validate imported settings
const validateSettings = (settings) => {
  const defaults = {
    theme: 'dark',
    language: 'en',
    animations: { enabled: true, duration: 300, cardFlip: true, shuffle: true, draw: true },
    cardSettings: { backDesign: 'celestial', autoReverse: true, reverseChance: 0.3, showReversed: true },
    audio: { enabled: true, volume: 0.7, cardShuffle: true, cardDraw: true, notifications: true },
    readingSettings: { autoSave: true, confirmBeforeExit: true, showInterpretations: true, defaultSpread: 'threeCard', guidedMode: false },
    privacy: { shareReadings: false, publicProfile: false, dataCollection: true, analytics: true },
    notifications: { email: true, browser: true, dailyReading: false, weeklyInsight: true, newFeatures: true, marketing: false },
    advanced: { developerMode: false, experimentalFeatures: false, debugMode: false, performanceMode: false },
    cardGeneration: { defaultStyle: 'mystic', autoGenerate: true, highQuality: false, parallelGeneration: true, fallbackEnabled: true }
  };

  return {
    ...defaults,
    ...settings,
    animations: { ...defaults.animations, ...(settings.animations || {}) },
    cardSettings: { ...defaults.cardSettings, ...(settings.cardSettings || {}) },
    audio: { ...defaults.audio, ...(settings.audio || {}) },
    readingSettings: { ...defaults.readingSettings, ...(settings.readingSettings || {}) },
    privacy: { ...defaults.privacy, ...(settings.privacy || {}) },
    notifications: { ...defaults.notifications, ...(settings.notifications || {}) },
    advanced: { ...defaults.advanced, ...(settings.advanced || {}) },
    cardGeneration: { ...defaults.cardGeneration, ...(settings.cardGeneration || {}) }
  };
};

export default useSettingsStore;