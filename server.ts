import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import {
  RoleId,
  Team,
  GamePhase,
  GameSettings,
  PlayerPublic,
  PlayerPrivateView,
  ChatMessage,
  GameResultSummary,
  PublicGameState,
  PRESET_DECKS,
  AVATAR_OPTIONS,
} from './src/types/game.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

interface ServerPlayer {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isBot: boolean;
  isConnected: boolean;
  ws?: WebSocket;
  initialRole?: RoleId;
  currentRole?: RoleId;
  hasActedNight: boolean;
  nightInfo?: PlayerPrivateView['nightInfo'];
  hasVoted: boolean;
  votedTargetId?: string;
}

interface ServerRoom {
  roomId: string;
  phase: GamePhase;
  players: Map<string, ServerPlayer>;
  settings: GameSettings;
  centerCards: [RoleId, RoleId];
  timerSecondsRemaining: number;
  timerIsRunning: boolean;
  timerInterval?: NodeJS.Timeout;
  chatMessages: ChatMessage[];
  result?: GameResultSummary;
  createdAt: number;
}

const rooms = new Map<string, ServerRoom>();

// Generate short readable room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Bot random names
const BOT_NAMES = ['タロウ', 'ハナコ', 'シロ', 'クロ', 'ポチ', 'ミケ', 'モモ', 'コタロウ'];

function getCleanPlayerPublic(p: ServerPlayer): PlayerPublic {
  return {
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    isHost: p.isHost,
    isBot: p.isBot,
    isConnected: p.isConnected,
    hasActedNight: p.hasActedNight,
    hasVoted: p.hasVoted,
  };
}

function getSanitizedGameStateForPlayer(room: ServerRoom, playerId: string): PublicGameState {
  const player = room.players.get(playerId);
  const meView: PlayerPrivateView = player
    ? {
        ...getCleanPlayerPublic(player),
        initialRole: player.initialRole,
        // Only reveal currentRole if phase is result, or during night if robber swapped
        currentRole: room.phase === 'result' ? player.currentRole : (player.nightInfo?.robberTargetPlayer ? player.currentRole : undefined),
        nightInfo: player.nightInfo,
      }
    : {
        id: playerId,
        name: '観戦者',
        avatar: '👀',
        isHost: false,
        isBot: false,
        isConnected: true,
      };

  return {
    roomId: room.roomId,
    phase: room.phase,
    players: Array.from(room.players.values()).map(getCleanPlayerPublic),
    me: meView,
    settings: room.settings,
    timerSecondsRemaining: room.timerSecondsRemaining,
    timerIsRunning: room.timerIsRunning,
    chatMessages: room.chatMessages.slice(-50),
    result: room.result,
  };
}

function broadcastRoomState(room: ServerRoom) {
  for (const player of room.players.values()) {
    if (player.ws && player.ws.readyState === WebSocket.OPEN) {
      const state = getSanitizedGameStateForPlayer(room, player.id);
      player.ws.send(JSON.stringify({ type: 'SYNC_STATE', payload: state }));
    }
  }
}

function broadcastSystemMessage(room: ServerRoom, text: string) {
  const msg: ChatMessage = {
    id: 'sys_' + Math.random().toString(36).substring(2, 9),
    senderId: 'system',
    senderName: '天の声',
    senderAvatar: '🌙',
    text,
    timestamp: Date.now(),
    isSystem: true,
  };
  room.chatMessages.push(msg);
  for (const player of room.players.values()) {
    if (player.ws && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify({ type: 'CHAT_MESSAGE', payload: msg }));
    }
  }
}

function stopTimer(room: ServerRoom) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = undefined;
  }
  room.timerIsRunning = false;
}

function startDayTimer(room: ServerRoom) {
  stopTimer(room);
  room.timerIsRunning = true;

  room.timerInterval = setInterval(() => {
    if (!room.timerIsRunning) return;

    room.timerSecondsRemaining--;

    // Broadcast tick every second
    for (const player of room.players.values()) {
      if (player.ws && player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(
          JSON.stringify({
            type: 'TIMER_TICK',
            payload: {
              secondsRemaining: room.timerSecondsRemaining,
              isRunning: room.timerIsRunning,
            },
          })
        );
      }
    }

    if (room.timerSecondsRemaining <= 0) {
      stopTimer(room);
      transitionToVoting(room);
    }
  }, 1000);
}

function transitionToNight(room: ServerRoom) {
  room.phase = 'night';
  room.result = undefined;

  // Prepare deck
  let deckToUse = [...room.settings.deck];
  const requiredCount = room.players.size + 2;

  // Auto fallback to preset if deck length does not match
  if (deckToUse.length !== requiredCount) {
    const matchingPreset = Object.values(PRESET_DECKS).find((p) => p.count === room.players.size);
    if (matchingPreset) {
      deckToUse = [...matchingPreset.deck];
      room.settings.deck = deckToUse;
    } else {
      // Generate default deck
      deckToUse = ['werewolf', 'werewolf', 'seer', 'robber'];
      while (deckToUse.length < requiredCount) {
        deckToUse.push('villager');
      }
      room.settings.deck = deckToUse;
    }
  }

  const shuffled = shuffle(deckToUse);
  const playerList = Array.from(room.players.values());

  // Deal cards to players
  playerList.forEach((p, idx) => {
    p.initialRole = shuffled[idx];
    p.currentRole = shuffled[idx];
    p.hasActedNight = false;
    p.hasVoted = false;
    p.votedTargetId = undefined;
    p.nightInfo = {};
  });

  // Last 2 cards are center cards
  room.centerCards = [shuffled[playerList.length], shuffled[playerList.length + 1]];

  // Pre-calculate Werewolf night info (know other werewolves)
  const werewolves = playerList.filter((p) => p.initialRole === 'werewolf');
  werewolves.forEach((w) => {
    const partners = werewolves.filter((p) => p.id !== w.id).map((p) => ({ id: p.id, name: p.name }));
    w.nightInfo = {
      ...w.nightInfo,
      partnerWerewolves: partners,
    };
  });

  broadcastSystemMessage(room, '夜が訪れました... 村人たちは深い眠りにつきます。役職の者たちは行動してください。');
  broadcastRoomState(room);

  // Trigger bots night actions with random delay
  simulateBotsNight(room);
}

function simulateBotsNight(room: ServerRoom) {
  const bots = Array.from(room.players.values()).filter((p) => p.isBot);
  const humans = Array.from(room.players.values()).filter((p) => !p.isBot);
  const allPlayers = Array.from(room.players.values());

  bots.forEach((bot) => {
    const delay = 1500 + Math.random() * 2500;
    setTimeout(() => {
      if (room.phase !== 'night') return;

      if (bot.initialRole === 'seer') {
        const otherPlayers = allPlayers.filter((p) => p.id !== bot.id);
        if (Math.random() > 0.5 && otherPlayers.length > 0) {
          const target = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
          bot.nightInfo = {
            seerTargetPlayer: {
              id: target.id,
              name: target.name,
              role: target.initialRole!,
            },
          };
        } else {
          bot.nightInfo = {
            seerCenterCards: [
              { index: 0, role: room.centerCards[0] },
              { index: 1, role: room.centerCards[1] },
            ],
          };
        }
      } else if (bot.initialRole === 'robber') {
        const otherPlayers = allPlayers.filter((p) => p.id !== bot.id);
        if (otherPlayers.length > 0) {
          const target = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
          const stolenRole = target.currentRole!;
          target.currentRole = bot.currentRole!;
          bot.currentRole = stolenRole;
          bot.nightInfo = {
            robberTargetPlayer: {
              id: target.id,
              name: target.name,
              stolenRole,
            },
          };
        }
      }

      bot.hasActedNight = true;
      checkAllNightActionsDone(room);
    }, delay);
  });
}

function checkAllNightActionsDone(room: ServerRoom) {
  if (room.phase !== 'night') return;
  const allPlayers = Array.from(room.players.values());
  const allDone = allPlayers.every((p) => p.hasActedNight);

  if (allDone) {
    transitionToDay(room);
  } else {
    broadcastRoomState(room);
  }
}

function transitionToDay(room: ServerRoom) {
  room.phase = 'day';
  room.timerSecondsRemaining = room.settings.discussionSeconds;
  broadcastSystemMessage(room, '朝が来ました！昨夜何者かの怪しい動きがありました。議論を開始してください。');
  broadcastRoomState(room);
  startDayTimer(room);

  // Bots occasional flavor stamps in day chat
  const bots = Array.from(room.players.values()).filter((p) => p.isBot);
  if (bots.length > 0) {
    setTimeout(() => {
      if (room.phase !== 'day') return;
      const bot = bots[Math.floor(Math.random() * bots.length)];
      const botLines = [
        'おはようございます！怪しい人は誰だ…？',
        '占い師や怪盗は名乗り出てくれますか？',
        '静かな夜でしたね…',
        'みんなを信じたいけど…人狼が潜んでる！',
      ];
      const text = botLines[Math.floor(Math.random() * botLines.length)];
      const msg: ChatMessage = {
        id: 'bot_' + Math.random().toString(36).substring(2, 9),
        senderId: bot.id,
        senderName: bot.name,
        senderAvatar: bot.avatar,
        text,
        timestamp: Date.now(),
      };
      room.chatMessages.push(msg);
      for (const player of room.players.values()) {
        if (player.ws && player.ws.readyState === WebSocket.OPEN) {
          player.ws.send(JSON.stringify({ type: 'CHAT_MESSAGE', payload: msg }));
        }
      }
    }, 4000);
  }
}

function transitionToVoting(room: ServerRoom) {
  stopTimer(room);
  room.phase = 'voting';
  Array.from(room.players.values()).forEach((p) => {
    p.hasVoted = false;
    p.votedTargetId = undefined;
  });
  broadcastSystemMessage(room, '議論終了！投票の時間です。人狼だと思うプレイヤーに投票してください。');
  broadcastRoomState(room);

  // Bots vote after random delay
  const bots = Array.from(room.players.values()).filter((p) => p.isBot);
  const allPlayers = Array.from(room.players.values());

  bots.forEach((bot) => {
    const delay = 1000 + Math.random() * 3000;
    setTimeout(() => {
      if (room.phase !== 'voting') return;
      const candidates = allPlayers.filter((p) => p.id !== bot.id);
      if (candidates.length > 0) {
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        bot.hasVoted = true;
        bot.votedTargetId = target.id;
        checkAllVotesDone(room);
      }
    }, delay);
  });
}

function checkAllVotesDone(room: ServerRoom) {
  if (room.phase !== 'voting') return;
  const allPlayers = Array.from(room.players.values());
  const allVoted = allPlayers.every((p) => p.hasVoted);

  if (allVoted) {
    calculateGameResult(room);
  } else {
    broadcastRoomState(room);
  }
}

function calculateGameResult(room: ServerRoom) {
  stopTimer(room);
  room.phase = 'result';

  const players = Array.from(room.players.values());
  const voteTallies: Record<string, string[]> = {}; // targetId -> [voterId, ...]
  players.forEach((p) => {
    voteTallies[p.id] = [];
  });

  players.forEach((p) => {
    if (p.votedTargetId) {
      if (!voteTallies[p.votedTargetId]) {
        voteTallies[p.votedTargetId] = [];
      }
      voteTallies[p.votedTargetId].push(p.id);
    }
  });

  // Calculate maximum votes
  let maxVotes = 0;
  Object.values(voteTallies).forEach((voters) => {
    if (voters.length > maxVotes) {
      maxVotes = voters.length;
    }
  });

  let executedPlayerIds: string[] = [];

  // Standard One Night Werewolf rules:
  // If everyone received only 1 vote (or maxVotes <= 1), nobody is executed (Peace Village / 平和村判定)
  if (maxVotes > 1) {
    executedPlayerIds = Object.entries(voteTallies)
      .filter(([_, voters]) => voters.length === maxVotes)
      .map(([id]) => id);
  } else {
    executedPlayerIds = [];
  }

  const executedPlayerNames = executedPlayerIds.map((id) => room.players.get(id)?.name || '誰か');

  const allPlayersInitialRoles: Record<string, RoleId> = {};
  const allPlayersFinalRoles: Record<string, RoleId> = {};
  players.forEach((p) => {
    allPlayersInitialRoles[p.id] = p.initialRole!;
    allPlayersFinalRoles[p.id] = p.currentRole!;
  });

  // Determine winner!
  let winningTeam: Team = 'village';
  let winningTeamName = '村人陣営';
  let winnerPlayerIds: string[] = [];
  let reason = '';

  // 1. Check if Tanner (てるてる) was executed
  const executedTanners = executedPlayerIds.filter((id) => allPlayersFinalRoles[id] === 'tanner');
  if (executedTanners.length > 0) {
    winningTeam = 'tanner';
    winningTeamName = 'てるてる単独勝利！';
    winnerPlayerIds = executedTanners;
    reason = `てるてる（${executedPlayerNames.join('、')}）が見事に処刑され、単独勝利を収めました！`;
  } else {
    // 2. Werewolves executed?
    const executedWerewolves = executedPlayerIds.filter((id) => allPlayersFinalRoles[id] === 'werewolf');
    const aliveWerewolves = players.filter((p) => allPlayersFinalRoles[p.id] === 'werewolf');

    if (executedWerewolves.length > 0) {
      // Village wins!
      winningTeam = 'village';
      winningTeamName = '村人陣営';
      winnerPlayerIds = players
        .filter((p) => allPlayersFinalRoles[p.id] !== 'werewolf' && allPlayersFinalRoles[p.id] !== 'minion')
        .map((p) => p.id);
      reason = `人狼（${executedWerewolves.map((id) => room.players.get(id)?.name).join('、')}）の処刑に成功！村に平穏が戻りました。`;
    } else {
      // No werewolf executed.
      if (aliveWerewolves.length === 0) {
        // Both werewolves were in the center! (Peace village)
        if (executedPlayerIds.length === 0) {
          // Nobody executed in peace village: Village wins!
          winningTeam = 'village';
          winningTeamName = '村人陣営';
          winnerPlayerIds = players
            .filter((p) => allPlayersFinalRoles[p.id] !== 'werewolf' && allPlayersFinalRoles[p.id] !== 'minion')
            .map((p) => p.id);
          reason = '人狼は墓地に2匹眠る【平和村】でした！誰も処刑せず、村人陣営の見事な勝利です！';
        } else {
          // Peaceful village, but an innocent was executed
          winningTeam = 'werewolf';
          winningTeamName = '人狼・狂人陣営';
          winnerPlayerIds = players
            .filter((p) => allPlayersFinalRoles[p.id] === 'minion')
            .map((p) => p.id);
          reason = `人狼が不在の平和村でしたが、無実の村人（${executedPlayerNames.join('、')}）が処刑されてしまいました...`;
        }
      } else {
        // Werewolf among players and survived! Werewolf team wins!
        winningTeam = 'werewolf';
        winningTeamName = '人狼陣営';
        winnerPlayerIds = players
          .filter((p) => allPlayersFinalRoles[p.id] === 'werewolf' || allPlayersFinalRoles[p.id] === 'minion')
          .map((p) => p.id);
        reason = `人狼（${aliveWerewolves.map((p) => p.name).join('、')}）は処刑を免れ、村人を欺き勝利しました！`;
      }
    }
  }

  room.result = {
    winningTeam,
    winningTeamName,
    winnerPlayerIds,
    executedPlayerIds,
    executedPlayerNames,
    votes: voteTallies,
    allPlayersInitialRoles,
    allPlayersFinalRoles,
    centerRoles: room.centerCards,
    reason,
  };

  broadcastSystemMessage(room, `【ゲーム終了】勝者: ${winningTeamName}！ ${reason}`);
  broadcastRoomState(room);
}

// Setup Express app & Vite middleware
async function startServer() {
  const app = express();
  const server = http.createServer(app);

  app.use(express.json());

  // API route for room query / status
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', activeRooms: rooms.size });
  });

  // Setup Vite in Dev or Static files in Prod
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  // Setup WebSocket Server
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    let currentRoomId: string | null = null;
    let currentPlayerId: string | null = null;

    // Heartbeat ping
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 25000);

    ws.on('message', (data: string) => {
      try {
        const msg = JSON.parse(data.toString());
        const { type, payload } = msg;

        switch (type) {
          case 'JOIN_ROOM': {
            let { roomId, playerName, avatar, playerId } = payload;
            roomId = (roomId || generateRoomCode()).toUpperCase().trim();

            if (!rooms.has(roomId)) {
              // Create room
              const newRoom: ServerRoom = {
                roomId,
                phase: 'lobby',
                players: new Map(),
                settings: {
                  discussionSeconds: 180,
                  deck: [...PRESET_DECKS.standard3.deck],
                  solitaryWolfCanSeeCenter: true,
                },
                centerCards: ['villager', 'villager'],
                timerSecondsRemaining: 180,
                timerIsRunning: false,
                chatMessages: [],
                createdAt: Date.now(),
              };
              rooms.set(roomId, newRoom);
            }

            const room = rooms.get(roomId)!;
            currentRoomId = roomId;

            // Player reconnect or new player
            let player = playerId ? room.players.get(playerId) : undefined;

            if (player) {
              // Reconnect existing player
              player.ws = ws;
              player.isConnected = true;
              if (playerName) player.name = playerName;
              if (avatar) player.avatar = avatar;
              currentPlayerId = player.id;
              broadcastSystemMessage(room, `${player.name} が再接続しました。`);
            } else {
              // Create new player
              const newId = playerId || 'p_' + Math.random().toString(36).substring(2, 9);
              const isFirst = room.players.size === 0;

              player = {
                id: newId,
                name: (playerName || 'プレイヤー').trim().substring(0, 16),
                avatar: avatar || AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)],
                isHost: isFirst,
                isBot: false,
                isConnected: true,
                ws,
                hasActedNight: false,
                hasVoted: false,
              };

              room.players.set(newId, player);
              currentPlayerId = newId;

              // Automatically adjust preset deck to match player count if in lobby
              if (room.phase === 'lobby') {
                const count = room.players.size;
                const presetKey = count === 3 ? 'standard3' : count === 4 ? 'standard4' : count === 5 ? 'standard5' : count >= 6 ? 'party6' : null;
                if (presetKey && PRESET_DECKS[presetKey]) {
                  room.settings.deck = [...PRESET_DECKS[presetKey].deck];
                }
              }

              broadcastSystemMessage(room, `${player.name} が参加しました。`);
            }

            broadcastRoomState(room);
            break;
          }

          case 'UPDATE_SETTINGS': {
            if (!currentRoomId || !currentPlayerId) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;
            const player = room.players.get(currentPlayerId);
            if (!player || !player.isHost) return;

            if (payload.discussionSeconds) {
              room.settings.discussionSeconds = payload.discussionSeconds;
            }
            if (payload.deck && Array.isArray(payload.deck)) {
              room.settings.deck = payload.deck;
            }
            if (typeof payload.solitaryWolfCanSeeCenter === 'boolean') {
              room.settings.solitaryWolfCanSeeCenter = payload.solitaryWolfCanSeeCenter;
            }

            broadcastRoomState(room);
            break;
          }

          case 'ADD_BOT': {
            if (!currentRoomId || !currentPlayerId) return;
            const room = rooms.get(currentRoomId);
            if (!room || room.phase !== 'lobby') return;
            const player = room.players.get(currentPlayerId);
            if (!player || !player.isHost) return;

            if (room.players.size >= 8) return;

            const botId = 'bot_' + Math.random().toString(36).substring(2, 9);
            const botName = 'BOT ' + BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
            const botAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];

            room.players.set(botId, {
              id: botId,
              name: botName,
              avatar: botAvatar,
              isHost: false,
              isBot: true,
              isConnected: true,
              hasActedNight: false,
              hasVoted: false,
            });

            // Adjust deck
            const count = room.players.size;
            const presetKey = count === 3 ? 'standard3' : count === 4 ? 'standard4' : count === 5 ? 'standard5' : count >= 6 ? 'party6' : null;
            if (presetKey && PRESET_DECKS[presetKey]) {
              room.settings.deck = [...PRESET_DECKS[presetKey].deck];
            }

            broadcastSystemMessage(room, `${botName} (BOT) が参加しました。`);
            broadcastRoomState(room);
            break;
          }

          case 'REMOVE_PLAYER': {
            if (!currentRoomId || !currentPlayerId) return;
            const room = rooms.get(currentRoomId);
            if (!room || room.phase !== 'lobby') return;
            const player = room.players.get(currentPlayerId);
            if (!player || !player.isHost) return;

            const targetId = payload.playerId;
            if (targetId && targetId !== currentPlayerId) {
              const target = room.players.get(targetId);
              if (target) {
                room.players.delete(targetId);
                broadcastSystemMessage(room, `${target.name} が退出しました。`);
                broadcastRoomState(room);
              }
            }
            break;
          }

          case 'START_GAME': {
            if (!currentRoomId || !currentPlayerId) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;
            const player = room.players.get(currentPlayerId);
            if (!player || !player.isHost) return;

            if (room.players.size < 3) {
              // Needs at least 3 players
              ws.send(JSON.stringify({ type: 'ERROR', payload: 'ゲームを開始するには3人以上必要です（BOTを追加できます）。' }));
              return;
            }

            transitionToNight(room);
            break;
          }

          case 'NIGHT_ACTION': {
            if (!currentRoomId || !currentPlayerId) return;
            const room = rooms.get(currentRoomId);
            if (!room || room.phase !== 'night') return;
            const player = room.players.get(currentPlayerId);
            if (!player) return;

            const { actionType, targetPlayerId, centerCardIndex } = payload;

            // Seer action
            if (player.initialRole === 'seer') {
              if (actionType === 'PEEK_PLAYER' && targetPlayerId) {
                const target = room.players.get(targetPlayerId);
                if (target) {
                  player.nightInfo = {
                    ...player.nightInfo,
                    seerTargetPlayer: {
                      id: target.id,
                      name: target.name,
                      role: target.initialRole!,
                    },
                  };
                }
              } else if (actionType === 'PEEK_CENTER') {
                player.nightInfo = {
                  ...player.nightInfo,
                  seerCenterCards: [
                    { index: 0, role: room.centerCards[0] },
                    { index: 1, role: room.centerCards[1] },
                  ],
                };
              }
            }

            // Robber action
            if (player.initialRole === 'robber' && actionType === 'SWAP_PLAYER' && targetPlayerId) {
              const target = room.players.get(targetPlayerId);
              if (target && target.id !== player.id) {
                const targetCurrentRole = target.currentRole!;
                target.currentRole = player.currentRole!;
                player.currentRole = targetCurrentRole;

                player.nightInfo = {
                  ...player.nightInfo,
                  robberTargetPlayer: {
                    id: target.id,
                    name: target.name,
                    stolenRole: targetCurrentRole,
                  },
                };
              }
            }

            // Solitary Wolf center peek action
            if (player.initialRole === 'werewolf' && actionType === 'PEEK_CENTER_WOLF' && typeof centerCardIndex === 'number') {
              const idx = centerCardIndex === 1 ? 1 : 0;
              player.nightInfo = {
                ...player.nightInfo,
                solitaryWolfCenterCard: {
                  index: idx,
                  role: room.centerCards[idx],
                },
              };
            }

            // Mark player night action complete
            if (payload.done) {
              player.hasActedNight = true;
              checkAllNightActionsDone(room);
            } else {
              broadcastRoomState(room);
            }
            break;
          }

          case 'DAY_TIMER_CONTROL': {
            if (!currentRoomId || !currentPlayerId) return;
            const room = rooms.get(currentRoomId);
            if (!room || room.phase !== 'day') return;
            const player = room.players.get(currentPlayerId);
            if (!player || !player.isHost) return;

            if (payload.action === 'PAUSE') {
              room.timerIsRunning = false;
            } else if (payload.action === 'RESUME') {
              room.timerIsRunning = true;
            } else if (payload.action === 'ADD_60') {
              room.timerSecondsRemaining += 60;
            } else if (payload.action === 'SKIP_TO_VOTE') {
              stopTimer(room);
              transitionToVoting(room);
              return;
            }

            broadcastRoomState(room);
            break;
          }

          case 'CAST_VOTE': {
            if (!currentRoomId || !currentPlayerId) return;
            const room = rooms.get(currentRoomId);
            if (!room || room.phase !== 'voting') return;
            const player = room.players.get(currentPlayerId);
            if (!player) return;

            const { targetId } = payload;
            if (targetId && room.players.has(targetId)) {
              player.hasVoted = true;
              player.votedTargetId = targetId;
              checkAllVotesDone(room);
            }
            break;
          }

          case 'PLAY_AGAIN': {
            if (!currentRoomId || !currentPlayerId) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;
            const player = room.players.get(currentPlayerId);
            if (!player || !player.isHost) return;

            stopTimer(room);
            room.phase = 'lobby';
            room.result = undefined;
            for (const p of room.players.values()) {
              p.initialRole = undefined;
              p.currentRole = undefined;
              p.hasActedNight = false;
              p.hasVoted = false;
              p.votedTargetId = undefined;
              p.nightInfo = {};
            }

            broadcastSystemMessage(room, '新しいゲームの準備が整いました。');
            broadcastRoomState(room);
            break;
          }

          case 'SEND_CHAT': {
            if (!currentRoomId || !currentPlayerId) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;
            const player = room.players.get(currentPlayerId);
            if (!player) return;

            const text = (payload.text || '').trim().substring(0, 100);
            const stamp = payload.stamp;

            if (!text && !stamp) return;

            const chatMsg: ChatMessage = {
              id: 'chat_' + Math.random().toString(36).substring(2, 9),
              senderId: player.id,
              senderName: player.name,
              senderAvatar: player.avatar,
              text,
              stamp,
              timestamp: Date.now(),
            };

            room.chatMessages.push(chatMsg);
            if (room.chatMessages.length > 80) {
              room.chatMessages.shift();
            }

            for (const p of room.players.values()) {
              if (p.ws && p.ws.readyState === WebSocket.OPEN) {
                p.ws.send(JSON.stringify({ type: 'CHAT_MESSAGE', payload: chatMsg }));
              }
            }
            break;
          }
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('close', () => {
      clearInterval(pingInterval);
      if (currentRoomId && currentPlayerId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          const player = room.players.get(currentPlayerId);
          if (player) {
            player.isConnected = false;
            player.ws = undefined;

            // If in lobby and player is not a bot, or if all disconnected
            const activeHumans = Array.from(room.players.values()).filter((p) => !p.isBot && p.isConnected);

            if (player.isHost && activeHumans.length > 0) {
              activeHumans[0].isHost = true;
              broadcastSystemMessage(room, `${activeHumans[0].name} が新しいホストになりました。`);
            }

            broadcastRoomState(room);

            // Clean up empty room after 20 minutes if no active humans
            if (activeHumans.length === 0) {
              setTimeout(() => {
                const r = rooms.get(currentRoomId!);
                if (r) {
                  const humans = Array.from(r.players.values()).filter((p) => !p.isBot && p.isConnected);
                  if (humans.length === 0) {
                    stopTimer(r);
                    rooms.delete(currentRoomId!);
                  }
                }
              }, 20 * 60 * 1000);
            }
          }
        }
      }
    });
  });

  server.listen(PORT, () => {
    console.log(`One Night Werewolf server running on http://localhost:${PORT}`);
  });
}

startServer();
