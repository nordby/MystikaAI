import { useState, useCallback } from 'react';
import apiService from '../services/api';
import toast from 'react-hot-toast';

export const useAI = () => {
    const [isLoading, setIsLoading] = useState(false);

    const speechToText = useCallback(async (audioBlob) => {
        setIsLoading(true);
        try {
            const response = await apiService.speechToText(audioBlob);
            return response.transcript;
        } catch (error) {
            toast.error(error.message || 'Ошибка распознавания речи');
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const analyzePhoto = useCallback(async (photoBlob) => {
        setIsLoading(true);
        try {
            const response = await apiService.analyzePhoto(photoBlob);
            toast.success('Фото проанализировано!');
            return response.analysis;
        } catch (error) {
            toast.error(error.message || 'Ошибка анализа фото');
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getPersonalRecommendations = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await apiService.getPersonalRecommendations();
            return response.recommendations;
        } catch (error) {
            toast.error(error.message || 'Ошибка получения рекомендаций');
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        speechToText,
        analyzePhoto,
        getPersonalRecommendations
    };
};