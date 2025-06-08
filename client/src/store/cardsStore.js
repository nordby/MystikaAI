import { create } from 'zustand';

const useCardsStore = create((set, get) => ({
  // State
  deck: [],
  selectedCards: [],
  currentSpread: null,
  spreads: {
    threeCard: {
      name: 'Three Card Spread',
      positions: ['Past', 'Present', 'Future'],
      description: 'A simple spread for understanding past influences, current situation, and future possibilities.'
    },
    celtic: {
      name: 'Celtic Cross',
      positions: [
        'Present Situation',
        'Challenge',
        'Distant Past',
        'Recent Past',
        'Possible Future',
        'Immediate Future',
        'Your Approach',
        'External Influences',
        'Hopes and Fears',
        'Final Outcome'
      ],
      description: 'A comprehensive spread for deep insight into any situation.'
    },
    relationship: {
      name: 'Relationship Spread',
      positions: ['You', 'Partner', 'Relationship', 'Challenge', 'Outcome'],
      description: 'Explore the dynamics of any relationship.'
    }
  },
  reading: null,
  isShuffling: false,
  isDrawing: false,

  // Actions
  initializeDeck: () => {
    const suits = ['cups', 'pentacles', 'swords', 'wands'];
    const ranks = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'page', 'knight', 'queen', 'king'];
    const majorArcana = [
      'fool', 'magician', 'high-priestess', 'empress', 'emperor', 'hierophant',
      'lovers', 'chariot', 'strength', 'hermit', 'wheel-of-fortune', 'justice',
      'hanged-man', 'death', 'temperance', 'devil', 'tower', 'star', 'moon', 'sun',
      'judgement', 'world'
    ];

    const deck = [];

    // Add Major Arcana
    majorArcana.forEach((card, index) => {
      deck.push({
        id: `major-${index}`,
        name: card.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        suit: 'major',
        rank: index,
        type: 'major',
        image: `/images/cards/major/${card}.jpg`,
        reversed: false,
        meaning: {
          upright: `Upright meaning for ${card}`,
          reversed: `Reversed meaning for ${card}`
        }
      });
    });

    // Add Minor Arcana
    suits.forEach(suit => {
      ranks.forEach((rank, index) => {
        deck.push({
          id: `${suit}-${rank}`,
          name: `${rank.replace(/\b\w/g, l => l.toUpperCase())} of ${suit.replace(/\b\w/g, l => l.toUpperCase())}`,
          suit,
          rank: index + 1,
          type: 'minor',
          image: `/images/cards/minor/${suit}/${rank}.jpg`,
          reversed: false,
          meaning: {
            upright: `Upright meaning for ${rank} of ${suit}`,
            reversed: `Reversed meaning for ${rank} of ${suit}`
          }
        });
      });
    });

    set({ deck });
  },

  shuffleDeck: () => {
    set({ isShuffling: true });
    
    setTimeout(() => {
      const { deck } = get();
      const shuffled = [...deck];
      
      // Fisher-Yates shuffle
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        
        // Random reversal (30% chance)
        if (Math.random() < 0.3) {
          shuffled[i] = { ...shuffled[i], reversed: !shuffled[i].reversed };
        }
      }
      
      set({ deck: shuffled, isShuffling: false });
    }, 2000);
  },

  drawCards: (count) => {
    const { deck } = get();
    if (deck.length < count) return [];

    set({ isDrawing: true });

    setTimeout(() => {
      const drawnCards = deck.slice(0, count);
      const remainingDeck = deck.slice(count);
      
      set({
        selectedCards: drawnCards,
        deck: remainingDeck,
        isDrawing: false
      });
    }, 1000);
  },

  selectSpread: (spreadType) => {
    const { spreads } = get();
    set({ currentSpread: spreads[spreadType] });
  },

  createReading: (question = '') => {
    const { selectedCards, currentSpread } = get();
    
    if (!selectedCards.length || !currentSpread) return;

    const reading = {
      id: Date.now().toString(),
      question,
      spread: currentSpread,
      cards: selectedCards.map((card, index) => ({
        ...card,
        position: currentSpread.positions[index] || `Position ${index + 1}`,
        interpretation: generateInterpretation(card, currentSpread.positions[index])
      })),
      createdAt: new Date().toISOString(),
    };

    set({ reading });
    return reading;
  },

  saveReading: async (reading) => {
    try {
      const response = await fetch('/api/readings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reading)
      });

      if (!response.ok) {
        throw new Error('Failed to save reading');
      }

      const savedReading = await response.json();
      return savedReading;
    } catch (error) {
      console.error('Error saving reading:', error);
      throw error;
    }
  },

  resetReading: () => {
    set({
      selectedCards: [],
      currentSpread: null,
      reading: null
    });
  },

  clearCards: () => {
    set({ selectedCards: [] });
  }
}));

// Helper function for generating card interpretations
const generateInterpretation = (card, position) => {
  const baseInterpretation = card.reversed ? card.meaning.reversed : card.meaning.upright;
  return `In the ${position} position: ${baseInterpretation}`;
};

export default useCardsStore;