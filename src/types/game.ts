/**
 * One Night Werewolf (ワンナイト人狼) Types & Constants
 */

export type RoleId = 'werewolf' | 'seer' | 'robber' | 'villager' | 'minion' | 'tanner';

export type Team = 'village' | 'werewolf' | 'tanner';

export interface RoleDefinition {
  id: RoleId;
  name: string;
  nameEn: string;
  team: Team;
  teamName: string;
  description: string;
  nightActionDesc: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

export const ROLES: Record<RoleId, RoleDefinition> = {
  werewolf: {
    id: 'werewolf',
    name: '人狼',
    nameEn: 'Werewolf',
    team: 'werewolf',
    teamName: '人狼陣営',
    description: '村人に化けて潜む恐ろしい狼。処刑を逃れれば勝利。仲間の人狼を確認できる。',
    nightActionDesc: '夜に目覚め、仲間の人狼を確認します。仲間の人狼がいない（1匹のみ）場合、中央のカード1枚を盗み見できます。',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
    icon: 'Moon',
  },
  seer: {
    id: 'seer',
    name: '占い師',
    nameEn: 'Seer',
    team: 'village',
    teamName: '村人陣営',
    description: '真実を見通す瞳を持つ者。夜に誰かの役職か、中央の2枚を透視できる。',
    nightActionDesc: '他のプレイヤー1人のカードを見るか、中央に残されたカード2枚を見ることができます。',
    color: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
    icon: 'Eye',
  },
  robber: {
    id: 'robber',
    name: '怪盗',
    nameEn: 'Robber',
    team: 'village',
    teamName: '村人陣営 (交換後依存)',
    description: '夜に誰か1人の役職を奪い去る怪盗。奪ったカードの役職・陣営になりきる。',
    nightActionDesc: '他のプレイヤー1人を選び、その人のカードと自分のカードをこっそり入れ替えます。新しく手に入れた役職を確認します。',
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: '#a855f7',
    icon: 'Shuffle',
  },
  villager: {
    id: 'villager',
    name: '村人',
    nameEn: 'Villager',
    team: 'village',
    teamName: '村人陣営',
    description: '特殊な能力を持たない一般市民。昼の議論と推理で人狼を吊るし上げろ！',
    nightActionDesc: '夜は何もせず静かに眠ります。翌朝の議論に備えましょう。',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
    icon: 'Shield',
  },
  minion: {
    id: 'minion',
    name: '狂人',
    nameEn: 'Minion',
    team: 'werewolf',
    teamName: '人狼陣営',
    description: '人狼を心から崇拝する信者。人狼が生き残れば自分が処刑されても勝利！',
    nightActionDesc: '夜は静かに祈りを捧げます（人狼が誰かは分かりません）。昼の議論で場を混乱させ、人狼を守りましょう。',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: '#f97316',
    icon: 'Flame',
  },
  tanner: {
    id: 'tanner',
    name: 'てるてる',
    nameEn: 'Tanner',
    team: 'tanner',
    teamName: '単独陣営',
    description: '自らの処刑を望む狂気の存在。自分が投票で処刑されれば単独勝利！',
    nightActionDesc: '夜は何もせず眠ります。昼の議論で怪しまれるように振る舞い、自らに投票を集めましょう。',
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: '#eab308',
    icon: 'Smile',
  },
};

export type GamePhase = 'lobby' | 'night' | 'day' | 'voting' | 'result';

export interface PlayerPublic {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isBot: boolean;
  isConnected: boolean;
  hasActedNight?: boolean;
  hasVoted?: boolean;
}

export interface PlayerPrivateView extends PlayerPublic {
  initialRole?: RoleId;
  currentRole?: RoleId;
  nightInfo?: {
    partnerWerewolves?: { id: string; name: string }[];
    solitaryWolfCenterCard?: { index: number; role: RoleId };
    seerTargetPlayer?: { id: string; name: string; role: RoleId };
    seerCenterCards?: { index: number; role: RoleId }[];
    robberTargetPlayer?: { id: string; name: string; stolenRole: RoleId };
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  stamp?: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface GameSettings {
  discussionSeconds: number; // e.g. 180 (3 min)
  deck: RoleId[]; // list of roles, must equal players.length + 2
  solitaryWolfCanSeeCenter: boolean;
}

export interface VoteResult {
  voterId: string;
  voterName: string;
  targetId: string;
  targetName: string;
}

export interface GameResultSummary {
  winningTeam: Team;
  winningTeamName: string;
  winnerPlayerIds: string[];
  executedPlayerIds: string[];
  executedPlayerNames: string[];
  votes: Record<string, string[]>; // targetId -> list of voterIds
  allPlayersInitialRoles: Record<string, RoleId>;
  allPlayersFinalRoles: Record<string, RoleId>;
  centerRoles: [RoleId, RoleId];
  reason: string;
}

export interface PublicGameState {
  roomId: string;
  phase: GamePhase;
  players: PlayerPublic[];
  me: PlayerPrivateView;
  settings: GameSettings;
  timerSecondsRemaining: number;
  timerIsRunning: boolean;
  chatMessages: ChatMessage[];
  result?: GameResultSummary;
}

export const AVATAR_OPTIONS = [
  '🐺', '🦊', '🐱', '🐶', '🦉', '🐻', '🐼', '🦁', '🐸', '🐰', '🦇', '🦅'
];

export const PRESET_DECKS: Record<string, { label: string; count: number; deck: RoleId[]; desc: string }> = {
  standard3: {
    label: '3人 定番セット (5枚)',
    count: 3,
    deck: ['werewolf', 'werewolf', 'seer', 'robber', 'villager'],
    desc: '人狼2・占い1・怪盗1・村人1。基本の駆け引きが楽しめる黄金バランス。',
  },
  standard4: {
    label: '4人 定番セット (6枚)',
    count: 4,
    deck: ['werewolf', 'werewolf', 'seer', 'robber', 'villager', 'villager'],
    desc: '人狼2・占い1・怪盗1・村人2。村人が2人になり推理の幅が広がります。',
  },
  chaos4: {
    label: '4人 狂人入りスリル (6枚)',
    count: 4,
    deck: ['werewolf', 'werewolf', 'seer', 'robber', 'villager', 'minion'],
    desc: '人狼2・占い1・怪盗1・村人1・狂人1。人狼味方の狂人が場をかき乱す！',
  },
  standard5: {
    label: '5人 バランスセット (7枚)',
    count: 5,
    deck: ['werewolf', 'werewolf', 'seer', 'robber', 'villager', 'villager', 'minion'],
    desc: '人狼2・占い1・怪盗1・村人2・狂人1。大人気構成。',
  },
  tanner5: {
    label: '5人 てるてる入り (7枚)',
    count: 5,
    deck: ['werewolf', 'werewolf', 'seer', 'robber', 'villager', 'minion', 'tanner'],
    desc: 'てるてるが加わり、怪しい言動が狂人かてるてるかの疑心暗鬼に！',
  },
  party6: {
    label: '6人 にぎやかセット (8枚)',
    count: 6,
    deck: ['werewolf', 'werewolf', 'seer', 'robber', 'villager', 'villager', 'minion', 'tanner'],
    desc: '全役職揃い踏み！大人数ならではの騙し合い。',
  },
};
