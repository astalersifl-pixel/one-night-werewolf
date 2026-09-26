import { useState, useEffect, useRef, useCallback } from 'react';
import {
  PublicGameState,
  ChatMessage,
  GameSettings,
  RoleId,
  AVATAR_OPTIONS,
} from '../types/game';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';

interface UseGameSocketReturn {
  isConnected: boolean;
  gameState: PublicGameState | null;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  setPlayerName: (name: string) => void;
  setPlayerAvatar: (avatar: string) => void;
  errorMsg: string | null;
  clearError: () => void;
  joinRoom: (roomId?: string) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  addBot: () => void;
  removePlayer: (playerId: string) => void;
  startGame: () => void;
  submitNightAction: (payload: {
    actionType?: 'PEEK_PLAYER' | 'PEEK_CENTER' | 'SWAP_PLAYER' | 'PEEK_CENTER_WOLF';
    targetPlayerId?: string;
    centerCardIndex?: number;
    done?: boolean;
  }) => void;
  controlDayTimer: (action: 'PAUSE' | 'RESUME' | 'ADD_60' | 'SKIP_TO_VOTE') => void;
  castVote: (targetId: string) => void;
  playAgain: () => void;
  sendChat: (text: string, stamp?: string) => void;
  lastTickedSecond: number;
}

export function useGameSocket(): UseGameSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<PublicGameState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastTickedSecond, setLastTickedSecond] = useState<number>(0);

  // Load or generate persistent playerId & profile
  const [playerId] = useState<string>(() => {
    const saved = localStorage.getItem('onw_player_id');
    if (saved) return saved;
    const generated = 'p_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('onw_player_id', generated);
    return generated;
  });

  const [playerName, setPlayerNameState] = useState<string>(() => {
    return localStorage.getItem('onw_player_name') || 'プレイヤー';
  });

  const [playerAvatar, setPlayerAvatarState] = useState<string>(() => {
    return localStorage.getItem('onw_player_avatar') || AVATAR_OPTIONS[0];
  });

  const setPlayerName = useCallback((name: string) => {
    const trimmed = name.trim().substring(0, 16) || 'プレイヤー';
    setPlayerNameState(trimmed);
    localStorage.setItem('onw_player_name', trimmed);
  }, []);

  const setPlayerAvatar = useCallback((avatar: string) => {
    setPlayerAvatarState(avatar);
    localStorage.setItem('onw_player_avatar', avatar);
  }, []);

  const wsRef = useRef<WebSocket | null>(null);
  const prevPhaseRef = useRef<string | null>(null);

  const sendMessage = useCallback((type: string, payload?: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const joinRoom = useCallback(
    (targetRoomId?: string) => {
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Determine websocket protocol & URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setErrorMsg(null);

        // Send JOIN_ROOM message
        ws.send(
          JSON.stringify({
            type: 'JOIN_ROOM',
            payload: {
              roomId: targetRoomId,
              playerId,
              playerName,
              avatar: playerAvatar,
            },
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'SYNC_STATE') {
            const newState: PublicGameState = msg.payload;
            setGameState(newState);

            // Trigger sound effects on phase change
            if (prevPhaseRef.current !== newState.phase) {
              if (newState.phase === 'night') {
                sound.playNightFall();
              } else if (newState.phase === 'day') {
                sound.playDaybreak();
              } else if (newState.phase === 'voting') {
                sound.playVoteCast();
              } else if (newState.phase === 'result') {
                sound.playVictory();
                // Victory confetti
                try {
                  confetti({
                    particleCount: 120,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#ef4444', '#38bdf8', '#fbbf24', '#a855f7'],
                  });
                } catch {
                  // ignore
                }
              }
              prevPhaseRef.current = newState.phase;
            }
          } else if (msg.type === 'CHAT_MESSAGE') {
            const newChat: ChatMessage = msg.payload;
            setGameState((prev) => {
              if (!prev) return prev;
              const exists = prev.chatMessages.some((c) => c.id === newChat.id);
              if (exists) return prev;
              return {
                ...prev,
                chatMessages: [...prev.chatMessages, newChat],
              };
            });
          } else if (msg.type === 'TIMER_TICK') {
            const { secondsRemaining, isRunning } = msg.payload;
            setGameState((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                timerSecondsRemaining: secondsRemaining,
                timerIsRunning: isRunning,
              };
            });
            setLastTickedSecond(secondsRemaining);

            // Tick sound during last 5 seconds of day
            if (secondsRemaining <= 5 && secondsRemaining > 0 && isRunning) {
              sound.playTimerTick();
            }
          } else if (msg.type === 'ERROR') {
            setErrorMsg(msg.payload);
          }
        } catch (err) {
          console.error('Failed to parse WS message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      ws.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        setErrorMsg('サーバーとの通信が切断されました。再接続を試みています...');
      };
    },
    [playerId, playerName, playerAvatar]
  );

  // Auto join room if roomId query param exists on initial load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      joinRoom(roomParam.toUpperCase());
    }
  }, [joinRoom]);

  // Clean up socket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const updateSettings = useCallback(
    (settings: Partial<GameSettings>) => {
      sound.playClick();
      sendMessage('UPDATE_SETTINGS', settings);
    },
    [sendMessage]
  );

  const addBot = useCallback(() => {
    sound.playClick();
    sendMessage('ADD_BOT');
  }, [sendMessage]);

  const removePlayer = useCallback(
    (targetId: string) => {
      sound.playClick();
      sendMessage('REMOVE_PLAYER', { playerId: targetId });
    },
    [sendMessage]
  );

  const startGame = useCallback(() => {
    sound.playClick();
    sendMessage('START_GAME');
  }, [sendMessage]);

  const submitNightAction = useCallback(
    (payload: {
      actionType?: 'PEEK_PLAYER' | 'PEEK_CENTER' | 'SWAP_PLAYER' | 'PEEK_CENTER_WOLF';
      targetPlayerId?: string;
      centerCardIndex?: number;
      done?: boolean;
    }) => {
      sound.playClick();
      sendMessage('NIGHT_ACTION', payload);
    },
    [sendMessage]
  );

  const controlDayTimer = useCallback(
    (action: 'PAUSE' | 'RESUME' | 'ADD_60' | 'SKIP_TO_VOTE') => {
      sound.playClick();
      sendMessage('DAY_TIMER_CONTROL', { action });
    },
    [sendMessage]
  );

  const castVote = useCallback(
    (targetId: string) => {
      sound.playVoteCast();
      sendMessage('CAST_VOTE', { targetId });
    },
    [sendMessage]
  );

  const playAgain = useCallback(() => {
    sound.playClick();
    sendMessage('PLAY_AGAIN');
  }, [sendMessage]);

  const sendChat = useCallback(
    (text: string, stamp?: string) => {
      sound.playClick();
      sendMessage('SEND_CHAT', { text, stamp });
    },
    [sendMessage]
  );

  const clearError = useCallback(() => {
    setErrorMsg(null);
  }, []);

  return {
    isConnected,
    gameState,
    playerId,
    playerName,
    playerAvatar,
    setPlayerName,
    setPlayerAvatar,
    errorMsg,
    clearError,
    joinRoom,
    updateSettings,
    addBot,
    removePlayer,
    startGame,
    submitNightAction,
    controlDayTimer,
    castVote,
    playAgain,
    sendChat,
    lastTickedSecond,
  };
}
