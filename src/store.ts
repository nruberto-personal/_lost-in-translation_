import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Player {
  username: string;
  highScore: number;
  gamesPlayed: number;
}

interface LeaderboardStore {
  players: Player[];
  currentPlayer: Player | null;
  setCurrentPlayer: (username: string) => void;
  updateScore: (score: number) => void;
  getTopPlayers: (limit: number) => Player[];
}

export const useLeaderboardStore = create<LeaderboardStore>()(
  persist(
    (set, get) => ({
      players: [],
      currentPlayer: null,
      setCurrentPlayer: (username: string) => {
        const players = get().players;
        let player = players.find(p => p.username === username);
        
        if (!player) {
          player = {
            username,
            highScore: 0,
            gamesPlayed: 0
          };
          set({ players: [...players, player] });
        }
        
        set({ currentPlayer: player });
      },
      updateScore: (score: number) => {
        const { players, currentPlayer } = get();
        if (!currentPlayer) return;

        const updatedPlayers = players.map(player => {
          if (player.username === currentPlayer.username) {
            return {
              ...player,
              highScore: Math.max(player.highScore, score),
              gamesPlayed: player.gamesPlayed + 1
            };
          }
          return player;
        });

        set({ 
          players: updatedPlayers,
          currentPlayer: {
            ...currentPlayer,
            highScore: Math.max(currentPlayer.highScore, score),
            gamesPlayed: currentPlayer.gamesPlayed + 1
          }
        });
      },
      getTopPlayers: (limit: number) => {
        return [...get().players]
          .sort((a, b) => b.highScore - a.highScore)
          .slice(0, limit);
      }
    }),
    {
      name: 'language-game-storage'
    }
  )
);