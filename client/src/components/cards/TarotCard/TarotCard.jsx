import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RotateCcw } from 'lucide-react';
import { useTelegram } from '../../../hooks/useTelegram';
import './TarotCard.css';

const TarotCard = ({ 
    card, 
    isReversed = false, 
    isFlipped = false, 
    onFlip,
    size = 'medium',
    showMeaning = false,
    animated = true 
}) => {
    const { hapticFeedback } = useTelegram();
    const [isHovered, setIsHovered] = useState(false);

    const handleCardClick = () => {
        hapticFeedback('light');
        if (onFlip) {
            onFlip(card.id);
        }
    };

    const cardVariants = {
        hidden: { rotateY: 0, scale: 0.8, opacity: 0 },
        visible: { 
            rotateY: isFlipped ? 180 : 0, 
            scale: 1, 
            opacity: 1,
            transition: { duration: 0.6, ease: "easeInOut" }
        },
        hover: { 
            scale: 1.05, 
            y: -10,
            boxShadow: "0 20px 40px rgba(139, 69, 19, 0.3)",
            transition: { duration: 0.2 }
        }
    };

    const sizeClasses = {
        small: 'w-20 h-32',
        medium: 'w-32 h-48',
        large: 'w-40 h-60'
    };

    return (
        <motion.div 
            className={`tarot-card ${sizeClasses[size]} ${isReversed ? 'reversed' : ''}`}
            variants={animated ? cardVariants : {}}
            initial={animated ? "hidden" : "visible"}
            animate="visible"
            whileHover={animated ? "hover" : {}}
            onClick={handleCardClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="card-container relative w-full h-full cursor-pointer">
                {/* Рубашка карты */}
                <motion.div 
                    className="card-back absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 rounded-lg border-2 border-gold-500"
                    style={{ 
                        backfaceVisibility: 'hidden',
                        rotateY: isFlipped ? '180deg' : '0deg'
                    }}
                >
                    <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-2 border border-gold-400 rounded opacity-60"></div>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="text-gold-400"
                        >
                            <Sparkles size={size === 'large' ? 32 : 24} />
                        </motion.div>
                        
                        {/* Мистические узоры */}
                        <div className="absolute inset-0 opacity-20">
                            <div className="w-full h-full bg-gradient-radial from-transparent via-purple-500 to-transparent"></div>
                        </div>
                    </div>
                </motion.div>

                {/* Лицевая сторона карты */}
                <motion.div 
                    className="card-front absolute inset-0 rounded-lg border-2 border-gold-500 overflow-hidden"
                    style={{ 
                        backfaceVisibility: 'hidden',
                        rotateY: isFlipped ? '0deg' : '180deg'
                    }}
                >
                    {card?.image_url ? (
                        <div className="relative w-full h-full">
                            <img 
                                src={card.image_url} 
                                alt={card.card_name}
                                className={`w-full h-full object-cover ${isReversed ? 'rotate-180' : ''}`}
                            />
                            
                            {/* Градиент для текста */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2">
                                <h3 className="text-white font-bold text-sm text-center">
                                    {card.card_name}
                                </h3>
                                {isReversed && (
                                    <div className="flex items-center justify-center mt-1">
                                        <RotateCcw size={12} className="text-red-400 mr-1" />
                                        <span className="text-red-400 text-xs">Перевернутая</span>
                                    </div>
                                )}
                            </div>

                            {/* Мистическое свечение при ховере */}
                            {isHovered && (
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                />
                            )}
                        </div>
                    ) : (
                        // Заглушка если нет изображения
                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                            <div className="text-center text-white p-4">
                                <Sparkles className="mx-auto mb-2 text-gold-400" size={24} />
                                <h3 className="font-bold text-sm">{card?.card_name || 'Загрузка...'}</h3>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Значение карты (если показывать) */}
            {showMeaning && card && (
                <motion.div 
                    className="mt-4 p-3 bg-purple-900/50 rounded-lg border border-purple-600"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <p className="text-sm text-purple-100">
                        {isReversed ? card.reversed_meaning : card.card_meaning}
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
};

export default TarotCard;