import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shuffle, Sparkles } from 'lucide-react';
import TarotCard from '../../cards/TarotCard/TarotCard';
import VoiceInput from '../../features/VoiceInput/VoiceInput';
import { useCards } from '../../../hooks/useCards';
import { useTelegram } from '../../../hooks/useTelegram';
import Button from '../../common/Button/Button';

const OneCardSpread = ({ onComplete, question: initialQuestion = '' }) => {
    const [step, setStep] = useState('question'); // question, shuffling, drawing, result
    const [question, setQuestion] = useState(initialQuestion);
    const [drawnCard, setDrawnCard] = useState(null);
    const [isReversed, setIsReversed] = useState(false);
    const [interpretation, setInterpretation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { performReading, isLoadingReading } = useCards();
    const { hapticFeedback } = useTelegram();

    const handleQuestionSubmit = () => {
        if (!question.trim()) return;
        setStep('shuffling');
        hapticFeedback('medium');
        
        // Имитация перемешивания карт
        setTimeout(() => {
            setStep('drawing');
        }, 2000);
    };

    const handleCardDraw = async () => {
        setIsLoading(true);
        hapticFeedback('heavy');
        
        try {
            const result = await performReading({
                spreadType: 'one_card',
                question: question,
                cardsCount: 1
            });

            setDrawnCard(result.cards[0]);
            setIsReversed(result.cards[0].isReversed);
            setInterpretation(result.interpretation);
            setStep('result');

            if (onComplete) {
                onComplete(result);
            }
        } catch (error) {
            console.error('Ошибка при гадании:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 'question':
                return (
                    <motion.div
                        className="text-center space-y-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-purple-100">
                                Задайте ваш вопрос
                            </h2>
                            <p className="text-purple-300">
                                Сформулируйте четко то, что волнует ваше сердце
                            </p>
                        </div>

                        <div className="space-y-4">
                            <textarea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Введите ваш вопрос..."
                                className="w-full h-24 p-4 bg-purple-900/30 border border-purple-600 rounded-lg text-white placeholder-purple-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                                maxLength={500}
                            />
                            
                            <VoiceInput 
                                onTranscript={(text) => setQuestion(text)}
                                placeholder="Или задайте вопрос голосом"
                            />
                        </div>

                        <Button
                            onClick={handleQuestionSubmit}
                            disabled={!question.trim()}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                            <Sparkles className="mr-2" size={20} />
                            Перемешать карты
                        </Button>
                    </motion.div>
                );

            case 'shuffling':
                return (
                    <motion.div
                        className="text-center space-y-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                        >
                            <Shuffle size={64} className="mx-auto text-purple-400" />
                        </motion.div>
                        
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-purple-100">
                                Карты перемешиваются...
                            </h3>
                            <p className="text-purple-300">
                                Вселенная настраивается на ваш вопрос
                            </p>
                        </div>

                        <motion.div
                            className="w-full bg-purple-900/30 rounded-full h-2"
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2 }}
                        >
                            <motion.div
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2 }}
                            />
                        </motion.div>
                    </motion.div>
                );

            case 'drawing':
                return (
                    <motion.div
                        className="text-center space-y-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <h3 className="text-xl font-bold text-purple-100">
                            Выберите карту
                        </h3>
                        <p className="text-purple-300">
                            Доверьтесь интуиции
                        </p>

                        <div className="flex justify-center">
                            <TarotCard
                                card={{ card_name: 'Карта судьбы' }}
                                size="large"
                                onFlip={handleCardDraw}
                                animated={true}
                            />
                        </div>

                        {isLoading && (
                            <div className="mt-4">
                                <div className="animate-pulse text-purple-300">
                                    Карта раскрывает свои тайны...
                                </div>
                            </div>
                        )}
                    </motion.div>
                );

            case 'result':
                return (
                    <motion.div
                        className="space-y-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-purple-100 mb-2">
                                Ваша карта
                            </h3>
                            <p className="text-purple-300 italic">
                                "{question}"
                            </p>
                        </div>

                        <div className="flex justify-center">
                            <TarotCard
                                card={drawnCard}
                                isReversed={isReversed}
                                isFlipped={true}
                                size="large"
                                showMeaning={false}
                                animated={true}
                            />
                        </div>

                        <motion.div
                            className="bg-purple-900/30 border border-purple-600 rounded-lg p-6"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <h4 className="text-lg font-semibold text-purple-100 mb-3 flex items-center">
                                <Sparkles className="mr-2" size={20} />
                                Толкование
                            </h4>
                            <p className="text-purple-200 leading-relaxed">
                                {interpretation}
                            </p>
                        </motion.div>
                    </motion.div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="max-w-md mx-auto p-6">
            {renderStep()}
        </div>
    );
};

export default OneCardSpread;