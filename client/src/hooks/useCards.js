import { useState, useCallback } from 'react';
import apiService from '../services/api';
import toast from 'react-hot-toast';

export const useCards = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingDeck, setIsLoadingDeck] = useState(false);
    const [personalDeck, setPersonalDeck] = useState(null);

    const getDailyCard = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await apiService.getDailyCard();
            return response;
        } catch (error) {
            toast.error(error.message || 'Ошибка получения дневной карты');
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const performReading = useCallback(async (spreadData) => {
        setIsLoading(true);
        try {
            const response = await apiService.performReading(spreadData);
            toast.success('Расклад готов!');
            return response.reading;
        } catch (error) {
            toast.error(error.message || 'Ошибка выполнения расклада');
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const generatePersonalDeck = useCallback(async () => {
        setIsLoadingDeck(true);
        try {
            const response = await apiService.generatePersonalDeck();
            setPersonalDeck(response.deck);
            toast.success('Персональная колода создается!');
            return response;
        } catch (error) {
            toast.error(error.message || 'Ошибка создания колоды');
            throw error;
        } finally {
            setIsLoadingDeck(false);
        }
    }, []);

    const getPersonalDeck = useCallback(async () => {
        setIsLoadingDeck(true);
        try {
            const response = await apiService.getPersonalDeck();
            setPersonalDeck(response.deck);
            return response.deck;
        } catch (error) {
            if (error.message.includes('не найдена')) {
                return null;
            }
            toast.error(error.message || 'Ошибка загрузки колоды');
            throw error;
        } finally {
            setIsLoadingDeck(false);
        }
    }, []);

    const rateReading = useCallback(async (readingId, rating) => {
        try {
            await apiService.rateReading(readingId, rating);
            toast.success('Оценка сохранена!');
        } catch (error) {
            toast.error(error.message || 'Ошибка сохранения оценки');
            throw error;
        }
    }, []);

    return {
        isLoading,
        isLoadingDeck,
        isLoadingReading: isLoading,
        personalDeck,
        getDailyCard,
        performReading,
        generatePersonalDeck,
        getPersonalDeck,
        rateReading
    };
};