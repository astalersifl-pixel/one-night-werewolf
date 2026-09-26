import React, { useState } from 'react';
import { PlayerPublic, RoleId, ROLES } from '../types/game';
import { StickyNote, ChevronRight, Check } from 'lucide-react';

interface DeductionMemoProps {
  players: PlayerPublic[];
  myPlayerId: string;
}

type GuessOption = 'unknown' | 'werewolf' | 'seer' | 'robber' | 'villager' | 'minion' | 'tanner';

const GUESS_CYCLE: GuessOption[] = [
  'unknown',
  'villager',
  'seer',
  'robber',
  'werewolf',
  'minion',
  'tanner',
];

const GUESS_LABELS: Record<GuessOption, { label: string; color: string; bg: string }> = {
  unknown: { label: '未定', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' },
  villager: { label: '村人', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.2)' },
  seer: { label: '占い', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.2)' },
  robber: { label: '怪盗', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.2)' },
  werewolf: { label: '人狼', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' },
  minion: { label: '狂人', color: '#f97316', bg: 'rgba(249, 115, 22, 0.2)' },
  tanner: { label: 'てるてる', color: '#eab308', bg: 'rgba(234, 179, 8, 0.2)' },
};

export const DeductionMemo: React.FC<DeductionMemoProps> = ({ players, myPlayerId }) => {
  const [memoState, setMemoState] = useState<Record<string, { guess: GuessOption; note: string }>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCycleRole = (playerId: string) => {
    const current = memoState[playerId]?.guess || 'unknown';
    const currentIndex = GUESS_CYCLE.indexOf(current);
    const nextGuess = GUESS_CYCLE[(currentIndex + 1) % GUESS_CYCLE.length];

    setMemoState((prev) => ({
      ...prev,
      [playerId]: {
        guess: nextGuess,
        note: prev[playerId]?.note || '',
      },
    }));
  };

  const handleUpdateNote = (playerId: string, note: string) => {
    setMemoState((prev) => ({
      ...prev,
      [playerId]: {
        guess: prev[playerId]?.guess || 'unknown',
        note,
      },
    }));
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg backdrop-blur-sm">
      {/* Memo Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2.5 flex items-center justify-between bg-slate-950/60 hover:bg-slate-950/90 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-200">
            推理メモ帳（タップで予想役職をメモ）
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>{isExpanded ? 'たたむ' : 'メモを開く'}</span>
          <ChevronRight
            className={`w-4 h-4 transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
        </div>
      </button>

      {/* Expanded Table */}
      {isExpanded && (
        <div className="p-3 space-y-2 border-t border-slate-800 animate-fade-in">
          <div className="text-[11px] text-slate-400">
            役職バッジをタップすると役職予想が切り替わります（村→占→盗→狼→狂→吊）。
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {players.map((p) => {
              const isMe = p.id === myPlayerId;
              const currentGuess = memoState[p.id]?.guess || 'unknown';
              const guessInfo = GUESS_LABELS[currentGuess];
              const note = memoState[p.id]?.note || '';

              return (
                <div
                  key={p.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/50 border border-slate-800/80"
                >
                  <div className="text-lg shrink-0">{p.avatar}</div>
                  <div className="w-24 shrink-0 truncate text-xs font-semibold text-slate-200">
                    {p.name} {isMe && <span className="text-[10px] text-sky-400 font-normal">(自分)</span>}
                  </div>

                  {/* Guess Tag Toggle Button */}
                  <button
                    onClick={() => handleCycleRole(p.id)}
                    className="shrink-0 px-2.5 py-1 rounded-md text-xs font-bold transition-all border border-slate-700/60 active:scale-95"
                    style={{
                      color: guessInfo.color,
                      backgroundColor: guessInfo.bg,
                    }}
                  >
                    {guessInfo.label}
                  </button>

                  {/* Note Input */}
                  <input
                    type="text"
                    placeholder="メモ（占いCOなど）"
                    value={note}
                    onChange={(e) => handleUpdateNote(p.id, e.target.value)}
                    className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
