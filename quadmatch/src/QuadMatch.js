import React, { useState, useEffect, useRef } from 'react';

/**
 * PUBLIC_INTERFACE
 * QuadMatch - Main container for 4x4 grid matching pairs game.
 * Features:
 * - Responsive 4x4 grid with card flip animations
 * - Score (moves) and timer
 * - Restart button
 * - Visual cues for matched cards
 * - Clean, minimal, light theme using provided palette
 */
const COLOR = {
  primary: '#4CAF50',
  secondary: '#FFC107',
  accent: '#2196F3',
};

const CARD_CONTENTS = [
  '🍎', '🍌', '🍇', '🍉',
  '🍒', '🥝', '🍋', '🍊',
];

function generateShuffledDeck() {
  // Duplicate and shuffle the card contents
  const doubleContents = [...CARD_CONTENTS, ...CARD_CONTENTS];
  for (let i = doubleContents.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [doubleContents[i], doubleContents[j]] = [doubleContents[j], doubleContents[i]];
  }
  // Assign unique ids
  return doubleContents.map((content, idx) => ({
    id: idx,
    value: content,
    isFlipped: false,
    isMatched: false,
  }));
}

/**
 * Card component
 * Now accepts playFlipSound and playMatchSound for sound triggering
 */
function Card({ card, onClick, disabled, playFlipSound }) {
  // Avoid playing flip sound on initialization/rehydrate
  const hasInitialized = useRef(false);
  useEffect(() => { hasInitialized.current = true; }, []);

  return (
    <button
      className={`qm-card${card.isFlipped || card.isMatched ? ' flipped' : ''}${card.isMatched ? ' matched' : ''}`}
      onClick={() => {
        if (!card.isFlipped && !card.isMatched && !disabled) {
          if (hasInitialized.current && typeof playFlipSound === 'function') playFlipSound();
          onClick(card);
        }
      }}
      disabled={card.isFlipped || card.isMatched || disabled}
      aria-label={card.isMatched ? 'Matched' : 'Hidden card'}
      tabIndex={card.isMatched ? -1 : 0}
    >
      <div className="qm-card-inner">
        <div className="qm-card-front" />
        <div className="qm-card-back colorful-card-back">{card.value}</div>
      </div>
    </button>
  );
}

// Victory Modal
function VictoryModal({ moves, time, onRestart }) {
  return (
    <div className="qm-modal-overlay">
      <div className="qm-modal">
        <h2 className="qm-modal-title">🎉 You won!</h2>
        <div className="qm-modal-stats">
          <span><b>Moves:</b> {moves}</span>
          <span><b>Time:</b> {formatTime(time)}</span>
        </div>
        <button className="qm-btn qm-btn-accent" onClick={onRestart}>Play Again</button>
      </div>
    </div>
  );
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * PUBLIC_INTERFACE
 * QuadMatch with sound effects and enhanced card backs
 */
function QuadMatch() {
  // State
  const [cards, setCards] = useState(generateShuffledDeck());
  const [firstFlipped, setFirstFlipped] = useState(null);
  const [secondFlipped, setSecondFlipped] = useState(null);
  const [isBoardLocked, setIsBoardLocked] = useState(false);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameActive, setGameActive] = useState(true);
  const [showVictory, setShowVictory] = useState(false);
  const timerRef = useRef(null);

  // --- Audio hooks/refs ---
  // Placeholder - replace these with your real sound files if available.
  const flipSoundRef = useRef();
  const matchSoundRef = useRef();
  const winSoundRef = useRef();

  // Initialize audio only once
  useEffect(() => {
    // If you add real audio files, replace the base64 with `new Audio(require('./assets/flip.wav'))`
    flipSoundRef.current = new window.Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YYQAAACAgICAgICAgICAgI=");
    matchSoundRef.current = new window.Audio("data:audio/wav;base64,UklGRhwAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YfQAAADAwMDAwICAgICAgAAAA");
    winSoundRef.current = new window.Audio("data:audio/wav;base64,UklGRiwAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YYwAAICEhISEhISEhISEhISEhA==");
  }, []);

  // Helper handlers
  const playFlipSound = () => { 
    if (flipSoundRef.current && flipSoundRef.current.currentTime !== undefined) {
      flipSoundRef.current.currentTime = 0;
      flipSoundRef.current.play();
    }
  };
  const playMatchSound = () => { 
    if (matchSoundRef.current && matchSoundRef.current.currentTime !== undefined) {
      matchSoundRef.current.currentTime = 0;
      matchSoundRef.current.play();
    }
  };
  const playWinSound = () => { 
    if (winSoundRef.current && winSoundRef.current.currentTime !== undefined) {
      winSoundRef.current.currentTime = 0;
      winSoundRef.current.play();
    }
  };

  // Start/stop timer
  useEffect(() => {
    if (gameActive && !showVictory) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameActive, showVictory]);

  // Check win
  useEffect(() => {
    if (cards.every(card => card.isMatched)) {
      setGameActive(false);
      setShowVictory(true);
      playWinSound();
    }
    // eslint-disable-next-line
  }, [cards]);

  // Card click handler
  function handleCardClick(clicked) {
    if (isBoardLocked) return;

    let newCards = cards.map(card =>
      card.id === clicked.id ? { ...card, isFlipped: true } : card
    );

    if (!firstFlipped) {
      setCards(newCards);
      setFirstFlipped(clicked);
    } else if (!secondFlipped && clicked.id !== firstFlipped.id) {
      setMoves(m => m + 1);
      setCards(newCards);
      setSecondFlipped(clicked);
      setIsBoardLocked(true);

      setTimeout(() => {
        const firstCard = cards.find(card => card.id === firstFlipped.id);
        const secondCard = clicked;

        if (firstCard.value === secondCard.value) {
          // Match found
          playMatchSound();
          newCards = newCards.map(card =>
            (card.value === firstCard.value)
              ? { ...card, isMatched: true }
              : card
          );
        } else {
          // Flip back both
          newCards = newCards.map(card =>
            card.id === firstFlipped.id || card.id === secondCard.id
              ? { ...card, isFlipped: false }
              : card
          );
        }
        setCards(newCards);
        setFirstFlipped(null);
        setSecondFlipped(null);
        setIsBoardLocked(false);
      }, 900);
    }
  }

  // Restart game handler
  function handleRestart() {
    setCards(generateShuffledDeck());
    setFirstFlipped(null);
    setSecondFlipped(null);
    setIsBoardLocked(false);
    setMoves(0);
    setTimer(0);
    setGameActive(true);
    setShowVictory(false);
  }

  return (
    <div className="qm-root" style={{ background: '#f8fafb', minHeight: '100vh' }}>
      <div className="qm-container">
        <div className="qm-header">
          <h1 style={{ color: COLOR.primary, letterSpacing: 1 }}>QuadMatch</h1>
          <div className="qm-header-details">
            <span className="qm-score-label" style={{ color: COLOR.secondary }}>Moves: <b>{moves}</b></span>
            <span className="qm-timer-label" style={{ color: COLOR.accent }}>Time: <b>{formatTime(timer)}</b></span>
            <button className="qm-btn qm-btn-primary" onClick={handleRestart}>Restart</button>
          </div>
        </div>
        <div className="qm-grid">
          {cards.map(card =>
            <Card
              key={card.id}
              card={card}
              onClick={handleCardClick}
              disabled={isBoardLocked || card.isMatched}
              playFlipSound={playFlipSound} // new prop!
            />
          )}
        </div>
        <div className="qm-footer">
          <span style={{ color: '#979797', fontSize: 13 }}>Find all matching pairs in as few moves and time as possible.</span>
        </div>
        {showVictory &&
          <VictoryModal moves={moves} time={timer} onRestart={handleRestart} />
        }
      </div>
    </div>
  );
}

export default QuadMatch;
