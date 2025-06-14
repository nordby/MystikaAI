import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Square, Crown } from 'lucide-react';
import { useAI } from '../../../hooks/useAI';
import { useTelegram } from '../../../hooks/useTelegram';
import { useAuth } from '../../../hooks/useAuth';
import Button from '../../common/Button/Button';

const VoiceInput = ({ onTranscript, placeholder = "Нажмите и говорите..." }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    
    const mediaRecorderRef = useRef(null);
    const timerRef = useRef(null);
    const { speechToText } = useAI();
    const { hapticFeedback } = useTelegram();
    const { user } = useAuth();
    
    // Проверяем премиум статус
    const isPremium = user && (user.subscriptionType === 'premium' || user.subscriptionType === 'premium_plus');

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const startRecording = async () => {
        // Проверяем премиум статус перед началом записи
        if (!isPremium) {
            alert('Голосовой ввод доступен только в Premium версии. Обновитесь для получения этой функции!');
            return;
        }
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            const audioChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
            hapticFeedback('light');
            
            // Таймер записи
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 60) { // Максимум 60 секунд
                        stopRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
            
        } catch (error) {
            console.error('Ошибка доступа к микрофону:', error);
            alert('Не удалось получить доступ к микрофону');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            hapticFeedback('medium');
            
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const processAudio = async () => {
        if (!audioBlob) return;
        
        setIsProcessing(true);
        
        try {
            const transcript = await speechToText(audioBlob);
            if (transcript && onTranscript) {
                onTranscript(transcript);
            }
        } catch (error) {
            console.error('Ошибка распознавания речи:', error);
            alert('Не удалось распознать речь. Попробуйте еще раз.');
        } finally {
            setIsProcessing(false);
            setAudioBlob(null);
            setRecordingTime(0);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-4">
            <div className="text-center">
                <p className="text-purple-300 text-sm mb-4">
                    {isPremium ? placeholder : "Голосовой ввод доступен в Premium версии"}
                </p>
                
                {!isPremium && (
                    <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                        <div className="flex items-center justify-center space-x-2 text-yellow-300 text-sm">
                            <Crown size={16} />
                            <span>Обновитесь до Premium для голосового ввода</span>
                        </div>
                    </div>
                )}
                
                <div className="flex items-center justify-center space-x-4">
                    {!isRecording ? (
                        <div className="relative">
                            <Button
                                onClick={startRecording}
                                className={`${isPremium 
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                                    : 'bg-gray-600 hover:bg-gray-700'} rounded-full p-4`}
                                disabled={!isPremium}
                            >
                                <Mic size={24} />
                            </Button>
                            {!isPremium && (
                                <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                                    <Crown size={12} className="text-white" />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center space-x-4">
                            <motion.div
                                className="bg-red-600 rounded-full p-4 cursor-pointer"
                                onClick={stopRecording}
                                whileTap={{ scale: 0.9 }}
                            >
                                <Square size={24} className="text-white" />
                            </motion.div>
                            
                            <div className="text-white font-mono">
                                {formatTime(recordingTime)}
                            </div>
                            
                            <motion.div
                                className="w-3 h-3 bg-red-500 rounded-full"
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            />
                        </div>
                    )}
                </div>

                {/* Визуализация записи */}
                <AnimatePresence>
                    {isRecording && (
                        <motion.div
                            className="mt-6 flex items-center justify-center space-x-1"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                        >
                            {[...Array(5)].map((_, index) => (
                                <motion.div
                                    key={index}
                                    className="w-1 bg-purple-500 rounded-full"
                                    animate={{
                                        height: [4, 20, 4],
                                        opacity: [0.3, 1, 0.3]
                                    }}
                                    transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        delay: index * 0.1
                                    }}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Кнопка обработки */}
                <AnimatePresence>
                    {audioBlob && !isProcessing && (
                        <motion.div
                            className="mt-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <Button
                                onClick={processAudio}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <Volume2 className="mr-2" size={16} />
                                Распознать речь
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Индикатор обработки */}
                <AnimatePresence>
                    {isProcessing && (
                        <motion.div
                            className="mt-4 text-purple-300"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <motion.div
                                    className="w-2 h-2 bg-purple-500 rounded-full"
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                />
                                <span>Распознаем речь...</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default VoiceInput;