import React, { useState, useEffect } from 'react';
import { Languages, Globe2, Play, Settings, RefreshCw, Check, X, GamepadIcon, Trophy, Flame, Medal } from 'lucide-react';
import { LANGUAGES, type LanguageCode } from './languages';
import { translateText } from './translateAPI';
import { useLeaderboardStore } from './store';

interface Translation {
  language: string;
  text: string;
}

interface GameState {
  originalText: string;
  translatedText: string;
  correctLanguage: LanguageCode;
  options: LanguageCode[];
  hasGuessed: boolean;
  isCorrect: boolean;
}

const MAX_LANGUAGES = 15;
const POINTS_PER_CORRECT = 100;
const STREAK_MULTIPLIER = 0.5;
const TOP_PLAYERS_LIMIT = 5;

function App() {
  const [activeTab, setActiveTab] = useState<'translate' | 'game'>('translate');
  const [inputText, setInputText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>('en');
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>('en');
  const [numLanguages, setNumLanguages] = useState(5);
  const [selectedLanguages, setSelectedLanguages] = useState<LanguageCode[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [manualSelection, setManualSelection] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestTranslation, setLatestTranslation] = useState<Translation | null>(null);

  // Game state
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Leaderboard store
  const { currentPlayer, setCurrentPlayer, updateScore, getTopPlayers } = useLeaderboardStore();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setCurrentPlayer(username.trim());
      setIsLoggedIn(true);
    }
  };

  // Initialize or update selected languages
  useEffect(() => {
    if (!manualSelection) {
      const languageCodes = Object.keys(LANGUAGES) as LanguageCode[];
      const randomLanguages = [...languageCodes]
        .sort(() => Math.random() - 0.5)
        .slice(0, numLanguages);
      setSelectedLanguages(randomLanguages);
    }
  }, [numLanguages, manualSelection]);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setError(null);
    setIsTranslating(true);
    setTranslations([{ language: sourceLanguage, text: inputText }]);
    setLatestTranslation(null);

    try {
      let currentText = inputText;
      const newTranslations: Translation[] = [{ language: sourceLanguage, text: inputText }];

      for (const lang of selectedLanguages) {
        try {
          const translatedText = await translateText(currentText, lang);
          currentText = translatedText;
          
          newTranslations.push({
            language: lang,
            text: translatedText
          });
          
          setTranslations([...newTranslations]);
        } catch (err) {
          if (err instanceof Error && err.message.includes('Rate limit exceeded')) {
            setError(err.message);
            break;
          }
          throw err;
        }
      }

      if (!error) {
        const finalText = await translateText(currentText, targetLanguage);
        const finalTranslation = {
          language: targetLanguage,
          text: finalText
        };
        newTranslations.push(finalTranslation);
        setTranslations(newTranslations);
        setLatestTranslation(finalTranslation);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Translation failed. Please try again later.');
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const calculateScore = (isCorrect: boolean) => {
    if (isCorrect) {
      const streakBonus = Math.floor(currentStreak * STREAK_MULTIPLIER * POINTS_PER_CORRECT);
      return POINTS_PER_CORRECT + streakBonus;
    }
    return 0;
  };

  const startGame = async () => {
    if (!inputText.trim() || !isLoggedIn) return;
    setError(null);
    setIsTranslating(true);

    try {
      // Get random target language (excluding source language)
      const availableLanguages = Object.keys(LANGUAGES).filter(lang => lang !== sourceLanguage) as LanguageCode[];
      const randomIndex = Math.floor(Math.random() * availableLanguages.length);
      const targetLang = availableLanguages[randomIndex];

      // Get 3 random wrong options
      const wrongOptions = availableLanguages
        .filter(lang => lang !== targetLang)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3) as LanguageCode[];

      // Translate the text
      const translatedText = await translateText(inputText, targetLang);

      // Set game state
      setGameState({
        originalText: inputText,
        translatedText,
        correctLanguage: targetLang,
        options: [...wrongOptions, targetLang].sort(() => Math.random() - 0.5),
        hasGuessed: false,
        isCorrect: false
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Translation failed. Please try again later.');
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const handleGuess = (language: LanguageCode) => {
    if (!gameState || gameState.hasGuessed) return;

    const isCorrect = language === gameState.correctLanguage;
    const newStreak = isCorrect ? currentStreak + 1 : 0;
    const pointsEarned = calculateScore(isCorrect);
    const newScore = isCorrect ? currentScore + pointsEarned : 0;

    setGameState({
      ...gameState,
      hasGuessed: true,
      isCorrect
    });
    setCurrentStreak(newStreak);
    setCurrentScore(newScore);

    if (!isCorrect) {
      // Update leaderboard with the previous score before resetting
      updateScore(currentScore);
    }
  };

  const shuffleLanguages = () => {
    const languageCodes = Object.keys(LANGUAGES) as LanguageCode[];
    const randomLanguages = [...languageCodes]
      .sort(() => Math.random() - 0.5)
      .slice(0, numLanguages);
    setSelectedLanguages(randomLanguages);
  };

  const toggleLanguage = (lang: LanguageCode) => {
    if (selectedLanguages.includes(lang)) {
      setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
    } else if (selectedLanguages.length < MAX_LANGUAGES) {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const startNewGame = () => {
    setGameState(null);
    setInputText('');
    setCurrentScore(0);
    setCurrentStreak(0);
    // Update leaderboard with final score before resetting
    if (currentScore > 0) {
      updateScore(currentScore);
    }
  };

  const continueGame = () => {
    setGameState(null);
    setInputText('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-800 mb-4 flex items-center justify-center gap-2">
            <Languages className="w-8 h-8" />
            Lost in Translation
          </h1>
          <p className="text-gray-600">Watch your text journey through different languages!</p>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('translate')}
            className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 ${
              activeTab === 'translate'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-blue-600 hover:bg-blue-50'
            }`}
          >
            <Globe2 className="w-5 h-5" />
            Translation Journey
          </button>
          <button
            onClick={() => setActiveTab('game')}
            className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 ${
              activeTab === 'game'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-blue-600 hover:bg-blue-50'
            }`}
          >
            <GamepadIcon className="w-5 h-5" />
            Language Guessing Game
          </button>
        </div>

        {activeTab === 'game' && !isLoggedIn ? (
          <div className="bg-white rounded-lg p-8 shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              Welcome to the Language Game
            </h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Enter your username to start playing:
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Username"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700"
              >
                Start Playing
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 shadow-lg mb-8">
            {activeTab === 'translate' && (
              <>
                <div className="flex justify-between mb-6">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
                  >
                    <Settings className="w-5 h-5" />
                    Settings
                  </button>
                  {!manualSelection && (
                    <button
                      onClick={shuffleLanguages}
                      className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Shuffle Languages
                    </button>
                  )}
                </div>

                {showSettings && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Source Language
                        </label>
                        <select
                          value={sourceLanguage}
                          onChange={(e) => setSourceLanguage(e.target.value as LanguageCode)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          {Object.entries(LANGUAGES).map(([code, name]) => (
                            <option key={code} value={code}>{name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Target Language
                        </label>
                        <select
                          value={targetLanguage}
                          onChange={(e) => setTargetLanguage(e.target.value as LanguageCode)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          {Object.entries(LANGUAGES).map(([code, name]) => (
                            <option key={code} value={code}>{name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="manualSelection"
                        checked={manualSelection}
                        onChange={(e) => setManualSelection(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="manualSelection" className="text-sm text-gray-700">
                        Manually select languages
                      </label>
                    </div>

                    {!manualSelection && (
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Number of Languages (max {MAX_LANGUAGES})
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={MAX_LANGUAGES}
                          value={numLanguages}
                          onChange={(e) => setNumLanguages(Math.min(parseInt(e.target.value), MAX_LANGUAGES))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    )}

                    {manualSelection && (
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Select Languages ({selectedLanguages.length}/{MAX_LANGUAGES})
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                          {Object.entries(LANGUAGES).map(([code, name]) => (
                            <button
                              key={code}
                              onClick={() => toggleLanguage(code as LanguageCode)}
                              className={`p-2 text-sm rounded-md flex items-center justify-between ${
                                selectedLanguages.includes(code as LanguageCode)
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                              disabled={!selectedLanguages.includes(code as LanguageCode) && selectedLanguages.length >= MAX_LANGUAGES}
                            >
                              <span>{name}</span>
                              {selectedLanguages.includes(code as LanguageCode) ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <X className="w-4 h-4 opacity-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === 'game' && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <span className="font-bold">{currentScore}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <span className="font-bold">{currentStreak}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLeaderboard(!showLeaderboard)}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                  >
                    <Medal className="w-5 h-5" />
                    Leaderboard
                  </button>
                </div>

                {showLeaderboard && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">Top Players</h3>
                    <div className="space-y-2">
                      {getTopPlayers(TOP_PLAYERS_LIMIT).map((player, index) => (
                        <div
                          key={player.username}
                          className="flex items-center justify-between p-2 bg-white rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-500">#{index + 1}</span>
                            <span className="text-blue-800">{player.username}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-600">Games: {player.gamesPlayed}</span>
                            <span className="font-bold text-blue-600">{player.highScore}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Enter your text:
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md h-32"
                placeholder={activeTab === 'translate' 
                  ? "Type your text here..."
                  : "Enter text to translate and guess the language!"
                }
              />
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <button
              onClick={activeTab === 'translate' ? handleTranslate : startGame}
              disabled={!inputText.trim() || isTranslating || (activeTab === 'translate' && selectedLanguages.length === 0)}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              {isTranslating 
                ? 'Processing...' 
                : activeTab === 'translate' 
                  ? 'Start Translation Journey' 
                  : 'Start Language Game'
              }
            </button>

            {/* Latest Translation Result (for Translation Journey) */}
            {activeTab === 'translate' && latestTranslation && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Final Translation</h3>
                <p className="text-green-700">{latestTranslation.text}</p>
              </div>
            )}

            {/* Game Interface */}
            {activeTab === 'game' && gameState && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Translated Text</h3>
                  <p className="text-blue-700">{gameState.translatedText}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {gameState.options.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleGuess(lang)}
                      disabled={gameState.hasGuessed}
                      className={`p-4 rounded-lg text-center transition-colors ${
                        gameState.hasGuessed
                          ? lang === gameState.correctLanguage
                            ? 'bg-green-100 text-green-800 border-2 border-green-300'
                            : gameState.isCorrect
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-red-100 text-red-800 border-2 border-red-300'
                          : 'bg-white hover:bg-blue-50 text-blue-600 border-2 border-blue-200'
                      }`}
                    >
                      {LANGUAGES[lang]}
                    </button>
                  ))}
                </div>
                
                {gameState.hasGuessed && (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg text-center ${
                      gameState.isCorrect 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {gameState.isCorrect 
                        ? `Correct! +${calculateScore(true)} points (${currentStreak}x streak)` 
                        : `Wrong! The correct language was ${LANGUAGES[gameState.correctLanguage]}`
                      }
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={startNewGame}
                        className="flex-1 bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700"
                      >
                        Start New Game
                      </button>
                      <button
                        onClick={continueGame}
                        className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700"
                      >
                        Continue Playing
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Translation Journey Log */}
        {activeTab === 'translate' && translations.length > 1 && (
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-2">
              <Globe2 className="w-6 h-6" />
              Translation Journey Log
            </h2>
            <div className="space-y-4">
              {translations.map((translation, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-md border-l-4 border-blue-500"
                >
                  <p className="font-semibold text-blue-800">
                    {LANGUAGES[translation.language as LanguageCode]}
                  </p>
                  <p className="text-gray-700 mt-2">{translation.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;