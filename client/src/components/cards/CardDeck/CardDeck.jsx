import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useCardsStore from '../../../store/cardsStore';
import useSettingsStore from '../../../store/settingsStore';
import Card from '../Card/Card';
import './CardDeck.css';

const CardDeck = ({ 
  onCardDraw, 
  onShuffle, 
  interactive = true,
  maxCards = 10,
  className = '' 
}) => {
  const { 
    deck, 
    isShuffling, 
    isDrawing, 
    shuffleDeck, 
    drawCards, 
    initializeDeck 
  } = useCardsStore();
  
  const { animations, audio, cardSettings } = useSettingsStore();
  const [drawCount, setDrawCount] = useState(1);
  const [draggedCard, setDraggedCard] = useState(null);
  const [deckPosition, setDeckPosition] = useState({ x: 0, y: 0 });
  const deckRef = useRef(null);

  useEffect(() => {
    if (deck.length === 0) {
      initializeDeck();
    }
  }, []);

  const handleShuffle = () => {
    if (!interactive || isShuffling) return;
    
    if (audio.enabled && audio.cardShuffle) {
      playShuffleSound();
    }
    
    shuffleDeck();
    onShuffle?.();
  };

  const handleDraw = (count = drawCount) => {
    if (!interactive || isDrawing || deck.length < count) return;
    
    if (audio.enabled && audio.cardDraw) {
      playDrawSound();
    }
    
    drawCards(count);
    onCardDraw?.(count);
  };

  const handleCardClick = (index) => {
    if (!interactive || isDrawing) return;
    handleDraw(1);
  };

  const handleDragStart = (e, cardIndex) => {
    if (!interactive) return;
    setDraggedCard(cardIndex);
  };

  const handleDragEnd = () => {
    setDraggedCard(null);
  };

  const playShuffleSound = () => {
    // Audio implementation would go here
    console.log('Playing shuffle sound');
  };

  const playDrawSound = () => {
    // Audio implementation would go here
    console.log('Playing draw sound');
  };

  const getCardStackPosition = (index, total) => {
    const maxOffset = Math.min(total, 10);
    const offsetX = (index % maxOffset) * 0.5;
    const offsetY = (index % maxOffset) * -0.3;
    const rotation = (Math.random() - 0.5) * 2; // Small random rotation
    
    return {
      x: offsetX,
      y: offsetY,
      rotation: rotation,
      zIndex: total - index
    };
  };

  const deckAnimations = {
    idle: {
      scale: 1,
      rotate: 0
    },
    shuffling: {
      scale: [1, 1.05, 1],
      rotate: [0, 2, -2, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    drawing: {
      scale: [1, 0.95, 1],
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <div className={`card-deck ${className}`}>
      {/* Deck Info */}
      <div className="deck-info">
        <h3>Tarot Deck</h3>
        <p>{deck.length} cards remaining</p>
        {cardSettings.backDesign && (
          <p className="deck-design">Design: {cardSettings.backDesign}</p>
        )}
      </div>

      {/* Main Deck */}
      <div className="deck-container" ref={deckRef}>
        <motion.div
          className="deck-stack"
          animate={isShuffling ? "shuffling" : isDrawing ? "drawing" : "idle"}
          variants={deckAnimations}
        >
          <AnimatePresence>
            {deck.slice(0, maxCards).map((card, index) => {
              const position = getCardStackPosition(index, Math.min(deck.length, maxCards));
              const isTopCard = index === 0;
              
              return (
                <motion.div
                  key={`deck-${card.id}-${index}`}
                  className={`deck-card ${isTopCard ? 'top-card' : ''} ${draggedCard === index ? 'dragging' : ''}`}
                  initial={{ 
                    opacity: 0, 
                    scale: 0.8,
                    x: 0,
                    y: -100
                  }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    x: position.x,
                    y: position.y,
                    rotate: position.rotation
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.8,
                    x: 100,
                    y: -50,
                    rotate: 45
                  }}
                  transition={{ 
                    duration: animations.enabled ? 0.3 : 0,
                    delay: index * 0.02
                  }}
                  style={{
                    zIndex: position.zIndex,
                    cursor: interactive && isTopCard ? 'pointer' : 'default'
                  }}
                  whileHover={interactive && isTopCard ? { 
                    scale: 1.05,
                    y: position.y - 5,
                    transition: { duration: 0.2 }
                  } : {}}
                  drag={interactive && isTopCard}
                  dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onTap={() => isTopCard && handleCardClick(index)}
                >
                  <Card
                    card={{
                      ...card,
                      name: 'Card Back',
                      image: `/images/card-backs/${cardSettings.backDesign}.jpg`
                    }}
                    size="medium"
                    interactive={false}
                    showBack={true}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Empty deck placeholder */}
          {deck.length === 0 && (
            <motion.div
              className="empty-deck"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="empty-deck-content">
                <span className="empty-icon">🔮</span>
                <p>Deck is empty</p>
                <button 
                  className="reset-deck-btn"
                  onClick={() => initializeDeck()}
                >
                  Reset Deck
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Deck Controls */}
      <div className="deck-controls">
        <div className="draw-controls">
          <label htmlFor="draw-count">Draw Cards:</label>
          <select
            id="draw-count"
            value={drawCount}
            onChange={(e) => setDrawCount(Number(e.target.value))}
            disabled={!interactive || isDrawing || isShuffling}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <option key={num} value={num} disabled={deck.length < num}>
                {num} card{num > 1 ? 's' : ''}
              </option>
            ))}
          </select>
          <button
            className="draw-btn"
            onClick={() => handleDraw()}
            disabled={!interactive || isDrawing || isShuffling || deck.length < drawCount}
          >
            {isDrawing ? 'Drawing...' : 'Draw'}
          </button>
        </div>

        <div className="deck-actions">
          <button
            className="shuffle-btn"
            onClick={handleShuffle}
            disabled={!interactive || isShuffling || deck.length === 0}
          >
            {isShuffling ? 'Shuffling...' : 'Shuffle'}
          </button>
          
          <button
            className="reset-btn"
            onClick={() => initializeDeck()}
            disabled={!interactive || isShuffling || isDrawing}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Deck Stats */}
      <div className="deck-stats">
        <div className="stat">
          <span className="stat-label">Major Arcana:</span>
          <span className="stat-value">
            {deck.filter(card => card.type === 'major').length}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Minor Arcana:</span>
          <span className="stat-value">
            {deck.filter(card => card.type === 'minor').length}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Reversed:</span>
          <span className="stat-value">
            {deck.filter(card => card.reversed).length}
          </span>
        </div>
      </div>

      {/* Shuffle Animation Overlay */}
      <AnimatePresence>
        {isShuffling && (
          <motion.div
            className="shuffle-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="shuffle-effect">
              <div className="shuffle-particles">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="particle"
                    animate={{
                      x: [0, (Math.random() - 0.5) * 200],
                      y: [0, (Math.random() - 0.5) * 200],
                      opacity: [1, 0],
                      scale: [1, 0]
                    }}
                    transition={{
                      duration: 1,
                      delay: i * 0.1,
                      repeat: Infinity
                    }}
                  />
                ))}
              </div>
              <p>Shuffling cards...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CardDeck;