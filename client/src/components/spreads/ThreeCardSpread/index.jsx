import React, { useState } from 'react';
import TarotCard from '../../cards/TarotCard';
import Button from '../../common/Button';

const ThreeCardSpread = ({ onCardsDrawn, deck = [] }) => {
  const [drawnCards, setDrawnCards] = useState([]);
  const [revealedCards, setRevealedCards] = useState([]);

  const positions = [
    { name: 'Past', description: 'What brought you here' },
    { name: 'Present', description: 'Your current situation' },
    { name: 'Future', description: 'What lies ahead' }
  ];

  const drawCards = () => {
    if (deck.length < 3) return;
    
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);
    
    setDrawnCards(selected);
    setRevealedCards([]);
    
    // Reveal cards one by one
    selected.forEach((_, index) => {
      setTimeout(() => {
        setRevealedCards(prev => [...prev, index]);
      }, (index + 1) * 800);
    });

    setTimeout(() => {
      onCardsDrawn && onCardsDrawn(selected);
    }, 3000);
  };

  const reset = () => {
    setDrawnCards([]);
    setRevealedCards([]);
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Three Card Spread
        </h3>
        <p className="text-gray-600">
          Past • Present • Future
        </p>
      </div>

      {/* Cards area */}
      <div className="flex justify-center items-center space-x-6 min-h-48">
        {positions.map((position, index) => (
          <div key={position.name} className="text-center">
            <div className="mb-3">
              <h4 className="font-medium text-gray-900">{position.name}</h4>
              <p className="text-xs text-gray-600">{position.description}</p>
            </div>
            
            {drawnCards[index] ? (
              <TarotCard 
                card={drawnCards[index]}
                isRevealed={revealedCards.includes(index)}
                size="medium"
                showMeaning={revealedCards.includes(index)}
              />
            ) : (
              <div className="w-24 h-36 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 text-xs">Card {index + 1}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex space-x-4">
        {drawnCards.length === 0 ? (
          <Button 
            onClick={drawCards}
            disabled={deck.length < 3}
            size="large"
          >
            Draw Cards
          </Button>
        ) : (
          <Button 
            onClick={reset}
            variant="outline"
            size="large"
          >
            New Reading
          </Button>
        )}
      </div>

      {/* Interpretation */}
      {revealedCards.length === 3 && (
        <div className="max-w-2xl text-center space-y-4">
          <h4 className="font-medium text-gray-900 text-lg">
            Your Three Card Reading
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {drawnCards.map((card, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">
                  {positions[index].name}: {card.name}
                </h5>
                <p className="text-gray-700">
                  {card.meaning || `This card represents ${positions[index].description.toLowerCase()}.`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeCardSpread;