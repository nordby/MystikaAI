import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useCardsStore from '../../../store/cardsStore';
import useUserStore from '../../../store/userStore';
import useSettingsStore from '../../../store/settingsStore';
import CardSpread from '../../cards/CardSpread/CardSpread';
import Card from '../../cards/Card/Card';
import './ThreeCardSpread.css';

const ThreeCardSpread = ({ 
  question = '', 
  onComplete, 
  autoStart = false,
  className = '' 
}) => {
  const { 
    selectedCards, 
    currentSpread, 
    isDrawing, 
    drawCards, 
    selectSpread, 
    createReading, 
    saveReading 
  } = useCardsStore();
  
  const { incrementReadingCount } = useUserStore();
  const { readingSettings } = useSettingsStore();
  
  const [step, setStep] = useState('intro'); // intro, drawing, reading, complete
  const [userQuestion, setUserQuestion] = useState(question);
  const [reading, setReading] = useState(null);
  const [cardRevealed, setCardRevealed] = useState([false, false, false]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [interpretation, setInterpretation] = useState('');

  const positions = ['Past', 'Present', 'Future'];
  const positionDescriptions = {
    'Past': 'What influences from your past are affecting this situation?',
    'Present': 'What is your current situation and state of mind?',
    'Future': 'What potential outcomes or energies lie ahead?'
  };

  useEffect(() => {
    // Initialize the three-card spread
    selectSpread('threeCard');
  }, []);

  useEffect(() => {
    if (autoStart && step === 'intro') {
      handleStartReading();
    }
  }, [autoStart]);

  useEffect(() => {
    if (selectedCards.length === 3 && step === 'drawing') {
      setStep('reading');
      if (readingSettings.guidedMode) {
        startGuidedReading();
      }
    }
  }, [selectedCards]);

  const handleStartReading = () => {
    if (!userQuestion.trim()) {
      alert('Please enter a question for your reading.');
      return;
    }
    
    setStep('drawing');
    drawCards(3);
  };

  const startGuidedReading = () => {
    setCurrentCardIndex(0);
    setTimeout(() => {
      revealCard(0);
    }, 1000);
  };

  const revealCard = (index) => {
    setCardRevealed(prev => {
      const newRevealed = [...prev];
      newRevealed[index] = true;
      return newRevealed;
    });
  };

  const handleCardClick = (card, index) => {
    if (readingSettings.guidedMode) {
      if (index === currentCardIndex) {
        revealCard(index);
        if (index < 2) {
          setTimeout(() => {
            setCurrentCardIndex(index + 1);
          }, 2000);
        } else {
          setTimeout(() => {
            completeReading();
          }, 3000);
        }
      }
    } else {
      revealCard(index);
      if (cardRevealed.filter(Boolean).length === 2) {
        setTimeout(() => {
          completeReading();
        }, 1000);
      }
    }
  };

  const completeReading = () => {
    const newReading = createReading(userQuestion);
    setReading(newReading);
    generateInterpretation(newReading);
    setStep('complete');
    incrementReadingCount();
  };

  const generateInterpretation = (readingData) => {
    if (!readingData || !readingData.cards) return;

    const cards = readingData.cards;
    let interpretation = `Your Three-Card Reading for: "${readingData.question}"\n\n`;

    cards.forEach((card, index) => {
      const position = positions[index];
      const meaning = card.reversed ? card.meaning.reversed : card.meaning.upright;
      
      interpretation += `**${position}** - ${card.name}${card.reversed ? ' (Reversed)' : ''}:\n`;
      interpretation += `${meaning}\n\n`;
    });

    interpretation += `**Overall Message:**\n`;
    interpretation += generateOverallMessage(cards);

    setInterpretation(interpretation);
  };

  const generateOverallMessage = (cards) => {
    // Simple interpretation logic - in a real app, this would be more sophisticated
    const themes = {
      major: 'significant life changes and spiritual growth',
      cups: 'emotions, relationships, and intuition',
      pentacles: 'material matters, career, and practical concerns',
      swords: 'mental challenges, communication, and conflict',
      wands: 'creativity, passion, and new beginnings'
    };

    const cardTypes = cards.map(card => card.suit === 'major' ? 'major' : card.suit);
    const dominantTheme = cardTypes.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {});

    const mostCommonType = Object.keys(dominantTheme).reduce((a, b) => 
      dominantTheme[a] > dominantTheme[b] ? a : b
    );

    return `The cards suggest a strong focus on ${themes[mostCommonType]}. The journey from past to future shows a clear path of growth and transformation. Pay attention to how past experiences are shaping your present choices and future possibilities.`;
  };

  const handleSaveReading = async () => {
    if (!reading) return;

    try {
      await saveReading(reading);
      alert('Reading saved successfully!');
    } catch (error) {
      alert('Failed to save reading. Please try again.');
    }
  };

  const resetReading = () => {
    setStep('intro');
    setCardRevealed([false, false, false]);
    setCurrentCardIndex(0);
    setReading(null);
    setInterpretation('');
    setUserQuestion('');
  };

  return (
    <div className={`three-card-spread ${className}`}>
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            className="spread-intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="intro-content">
              <h2>Three-Card Spread</h2>
              <p className="spread-description">
                The Three-Card Spread is a simple yet powerful divination tool that provides 
                insight into your past, present, and future. Each card represents a different 
                aspect of your journey and the energies surrounding your question.
              </p>
              
              <div className="positions-preview">
                {positions.map((position, index) => (
                  <div key={position} className="position-preview">
                    <div className="position-card-placeholder">
                      <span className="position-number">{index + 1}</span>
                    </div>
                    <h4>{position}</h4>
                    <p>{positionDescriptions[position]}</p>
                  </div>
                ))}
              </div>

              <div className="question-input">
                <label htmlFor="reading-question">Ask your question:</label>
                <textarea
                  id="reading-question"
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  placeholder="What would you like guidance on? Be specific and open to the wisdom the cards will share..."
                  rows={3}
                />
              </div>

              <button 
                className="start-reading-btn"
                onClick={handleStartReading}
                disabled={!userQuestion.trim()}
              >
                Begin Reading
              </button>
            </div>
          </motion.div>
        )}

        {step === 'drawing' && (
          <motion.div
            key="drawing"
            className="drawing-phase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="drawing-content">
              <h3>Drawing your cards...</h3>
              <p>The universe is selecting the perfect cards for your reading.</p>
              <div className="drawing-animation">
                <div className="spinner"></div>
              </div>
            </div>
          </motion.div>
        )}

        {(step === 'reading' || step === 'complete') && selectedCards.length === 3 && (
          <motion.div
            key="reading"
            className="reading-phase"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="reading-header">
              <h3>Your Three-Card Reading</h3>
              <p className="reading-question">Question: "{userQuestion}"</p>
            </div>

            <div className="cards-container">
              {selectedCards.map((card, index) => (
                <motion.div
                  key={`reading-card-${index}`}
                  className={`reading-card-wrapper ${cardRevealed[index] ? 'revealed' : ''} ${
                    readingSettings.guidedMode && currentCardIndex === index ? 'active' : ''
                  }`}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <div className="position-info">
                    <h4>{positions[index]}</h4>
                    <p>{positionDescriptions[positions[index]]}</p>
                  </div>

                  <div 
                    className="card-container"
                    onClick={() => !cardRevealed[index] && handleCardClick(card, index)}
                  >
                    <Card
                      card={card}
                      size="large"
                      interactive={!cardRevealed[index]}
                      showRevealed={cardRevealed[index]}
                      showBack={!cardRevealed[index]}
                    />
                    
                    {!cardRevealed[index] && (
                      <div className="card-overlay">
                        <span>Click to reveal</span>
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {cardRevealed[index] && (
                      <motion.div
                        className="card-meaning"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h5>{card.name}{card.reversed ? ' (Reversed)' : ''}</h5>
                        <p>
                          {card.reversed ? card.meaning?.reversed : card.meaning?.upright}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {step === 'complete' && (
              <motion.div
                className="reading-complete"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="interpretation-section">
                  <h4>Reading Interpretation</h4>
                  <div className="interpretation-content">
                    <pre>{interpretation}</pre>
                  </div>
                </div>

                <div className="reading-actions">
                  <button className="save-btn" onClick={handleSaveReading}>
                    Save Reading
                  </button>
                  <button className="new-reading-btn" onClick={resetReading}>
                    New Reading
                  </button>
                  <button className="share-btn" onClick={() => onComplete?.(reading)}>
                    Share Reading
                  </button>
                </div>
              </motion.div>
            )}

            {readingSettings.guidedMode && step === 'reading' && currentCardIndex < 3 && (
              <div className="guided-instructions">
                <p>Click on the {positions[currentCardIndex]} card to reveal its meaning.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThreeCardSpread;