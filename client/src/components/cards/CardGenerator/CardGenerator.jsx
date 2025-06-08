// client/src/components/cards/CardGenerator/CardGenerator.jsx
import React, { useState, useEffect } from 'react';
import { useCards } from '../../../hooks/useCards';
import { TarotCard } from '../TarotCard';
import { Button } from '../../common/Button';
import './CardGenerator.css';

const CardGenerator = ({ 
    onCardGenerated, 
    type = 'random', 
    allowRegenerate = true,
    showAnimation = true 
}) => {
    const { generateCard, generatePersonalCard, isLoading } = useCards();
    const [generatedCard, setGeneratedCard] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleGenerateCard = async () => {
        try {
            setIsAnimating(true);
            
            let cardData;
            if (type === 'personal') {
                cardData = await generatePersonalCard();
            } else {
                cardData = await generateCard();
            }

            // Добавляем задержку для анимации
            setTimeout(() => {
                setGeneratedCard(cardData);
                setIsAnimating(false);
                onCardGenerated && onCardGenerated(cardData);
            }, showAnimation ? 1500 : 0);

        } catch (error) {
            console.error('Ошибка генерации карты:', error);
            setIsAnimating(false);
        }
    };

    const handleRegenerate = () => {
        setGeneratedCard(null);
        handleGenerateCard();
    };

    return (
        <div className="card-generator">
            <div className="card-generator__content">
                {!generatedCard && !isAnimating && (
                    <div className="card-generator__initial">
                        <div className="card-back-placeholder">
                            <div className="card-back-design">
                                <div className="mystical-pattern"></div>
                                <div className="mystical-symbols">✦ ✧ ✦</div>
                            </div>
                        </div>
                        <Button 
                            onClick={handleGenerateCard}
                            disabled={isLoading}
                            size="large"
                            variant="primary"
                            className="generate-button"
                        >
                            {isLoading ? 'Генерирую...' : 'Вытянуть карту'}
                        </Button>
                        <p className="card-generator__hint">
                            {type === 'personal' 
                                ? 'Карта будет создана специально для вас на основе ваших данных'
                                : 'Сосредоточьтесь на своем вопросе и нажмите кнопку'
                            }
                        </p>
                    </div>
                )}

                {isAnimating && (
                    <div className="card-generator__animation">
                        <div className="cards-shuffle">
                            <div className="card-stack">
                                <div className="card-back card-1"></div>
                                <div className="card-back card-2"></div>
                                <div className="card-back card-3"></div>
                            </div>
                        </div>
                        <p className="animation-text">Перемешиваю карты...</p>
                    </div>
                )}

                {generatedCard && !isAnimating && (
                    <div className="card-generator__result">
                        <div className="card-reveal-animation">
                            <TarotCard 
                                card={generatedCard.card}
                                isReversed={generatedCard.isReversed}
                                showInterpretation={true}
                                interpretation={generatedCard.interpretation}
                                size="large"
                            />
                        </div>
                        
                        {allowRegenerate && (
                            <div className="card-generator__actions">
                                <Button 
                                    onClick={handleRegenerate}
                                    variant="outline"
                                    disabled={isLoading}
                                >
                                    🔄 Вытянуть другую карту
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CardGenerator;