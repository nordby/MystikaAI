import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useCardsStore from '../../../store/cardsStore';
import useSettingsStore from '../../../store/settingsStore';
import Card from '../Card/Card';
import './CardSpread.css';

const CardSpread = ({ 
  spread, 
  cards = [], 
  onCardClick, 
  interactive = true,
  showPositions = true,
  className = '' 
}) => {
  const { animations } = useSettingsStore();
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [hoveredPosition, setHoveredPosition] = useState(null);

  // Animation variants for different spread types
  const getSpreadLayout = (spreadType, cardCount) => {
    switch (spreadType) {
      case 'threeCard':
        return getThreeCardLayout(cardCount);
      case 'celtic':
        return getCelticCrossLayout(cardCount);
      case 'relationship':
        return getRelationshipLayout(cardCount);
      default:
        return getLinearLayout(cardCount);
    }
  };

  const getThreeCardLayout = (cardCount) => {
    const positions = [];
    const spacing = 120;
    const startX = -(spacing * (Math.min(cardCount, 3) - 1)) / 2;
    
    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      positions.push({
        x: startX + (i * spacing),
        y: 0,
        rotation: 0,
        scale: 1
      });
    }
    return positions;
  };

  const getCelticCrossLayout = (cardCount) => {
    const positions = [
      { x: 0, y: 0, rotation: 0, scale: 1 },      // Present
      { x: 0, y: 0, rotation: 90, scale: 0.9 },   // Challenge (cross)
      { x: -100, y: 0, rotation: 0, scale: 0.9 }, // Distant Past
      { x: 0, y: -80, rotation: 0, scale: 0.9 },  // Recent Past
      { x: 100, y: 0, rotation: 0, scale: 0.9 },  // Possible Future
      { x: 0, y: 80, rotation: 0, scale: 0.9 },   // Immediate Future
      { x: 200, y: -120, rotation: 0, scale: 0.8 }, // Your Approach
      { x: 200, y: -40, rotation: 0, scale: 0.8 },  // External Influences
      { x: 200, y: 40, rotation: 0, scale: 0.8 },   // Hopes and Fears
      { x: 200, y: 120, rotation: 0, scale: 0.8 }   // Final Outcome
    ];
    return positions.slice(0, cardCount);
  };

  const getRelationshipLayout = (cardCount) => {
    const positions = [
      { x: -80, y: -60, rotation: -10, scale: 1 },   // You
      { x: 80, y: -60, rotation: 10, scale: 1 },     // Partner
      { x: 0, y: 0, rotation: 0, scale: 1.1 },       // Relationship
      { x: 0, y: 80, rotation: 0, scale: 0.9 },      // Challenge
      { x: 0, y: 160, rotation: 0, scale: 1 }        // Outcome
    ];
    return positions.slice(0, cardCount);
  };

  const getLinearLayout = (cardCount) => {
    const positions = [];
    const spacing = 100;
    const startX = -(spacing * (cardCount - 1)) / 2;
    
    for (let i = 0; i < cardCount; i++) {
      positions.push({
        x: startX + (i * spacing),
        y: 0,
        rotation: 0,
        scale: 1
      });
    }
    return positions;
  };

  const spreadPositions = getSpreadLayout(spread?.name?.toLowerCase().replace(' ', ''), cards.length);

  const handleCardClick = (card, index) => {
    if (!interactive) return;
    
    setSelectedCardIndex(index === selectedCardIndex ? null : index);
    onCardClick?.(card, index);
  };

  const getPositionName = (index) => {
    if (spread?.positions && spread.positions[index]) {
      return spread.positions[index];
    }
    return `Position ${index + 1}`;
  };

  return (
    <div className={`card-spread ${className}`}>
      <div className="spread-container">
        <AnimatePresence>
          {cards.map((card, index) => {
            const position = spreadPositions[index] || { x: 0, y: 0, rotation: 0, scale: 1 };
            const isSelected = selectedCardIndex === index;
            const isHovered = hoveredPosition === index;

            return (
              <motion.div
                key={`${card.id}-${index}`}
                className={`spread-card-container ${isSelected ? 'selected' : ''}`}
                initial={{ 
                  opacity: 0, 
                  scale: 0.8,
                  x: 0,
                  y: 0
                }}
                animate={{ 
                  opacity: 1, 
                  scale: position.scale * (isSelected ? 1.1 : 1),
                  x: position.x,
                  y: position.y,
                  rotate: position.rotation + (isSelected ? 0 : 0)
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.8 
                }}
                transition={{ 
                  duration: animations.enabled ? animations.duration / 1000 : 0,
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={interactive ? { 
                  scale: position.scale * 1.05,
                  zIndex: 10
                } : {}}
                style={{
                  position: 'absolute',
                  cursor: interactive ? 'pointer' : 'default'
                }}
                onMouseEnter={() => setHoveredPosition(index)}
                onMouseLeave={() => setHoveredPosition(null)}
                onClick={() => handleCardClick(card, index)}
              >
                <Card
                  card={card}
                  size="medium"
                  interactive={interactive}
                  showRevealed={true}
                />
                
                {showPositions && (
                  <motion.div
                    className={`position-label ${isHovered ? 'visible' : ''}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ 
                      opacity: isHovered || isSelected ? 1 : 0,
                      y: isHovered || isSelected ? 0 : 10
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {getPositionName(index)}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Spread layout guide */}
        {spread && cards.length === 0 && (
          <div className="spread-guide">
            {spread.positions?.map((position, index) => {
              const guidePosition = spreadPositions[index] || { x: 0, y: 0 };
              return (
                <motion.div
                  key={index}
                  className="position-placeholder"
                  style={{
                    position: 'absolute',
                    transform: `translate(${guidePosition.x}px, ${guidePosition.y}px)`
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="placeholder-card">
                    <span className="position-number">{index + 1}</span>
                  </div>
                  <div className="position-name">{position}</div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected card details */}
      <AnimatePresence>
        {selectedCardIndex !== null && cards[selectedCardIndex] && (
          <motion.div
            className="card-details-panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="card-details">
              <h3>{cards[selectedCardIndex].name}</h3>
              <p className="position-context">
                <strong>{getPositionName(selectedCardIndex)}</strong>
              </p>
              <div className="card-meaning">
                <p>
                  {cards[selectedCardIndex].reversed 
                    ? cards[selectedCardIndex].meaning?.reversed 
                    : cards[selectedCardIndex].meaning?.upright
                  }
                </p>
              </div>
              {cards[selectedCardIndex].interpretation && (
                <div className="card-interpretation">
                  <h4>Interpretation</h4>
                  <p>{cards[selectedCardIndex].interpretation}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CardSpread;