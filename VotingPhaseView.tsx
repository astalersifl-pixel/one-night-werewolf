import React, { useState } from 'react';
import { PublicGameState } from '../types/game';
import { Vote, CheckCircle2, AlertCircle } from 'lucide-react';
import { sound } from '../utils/audio';

interface VotingPhaseViewProps {
  gameState: PublicGameState;
  myPlayerId: string;
  onCastVote: (targetId: string) => void;
}

export const VotingPhaseView: React.FC<VotingPhaseViewProps> = ({
  gameState,
  myPlayerId,
  onCastVote,
}) => {
  const { players, me } = gameState;
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  const hasVoted = Boolean(me.hasVoted);
  const votedCount = players.filter((p) => p.hasVoted).length;

  const handleConfirmVote = () => {
    if (!selectedTargetId) return;
    onCastVote(selectedTargetId);
  };

  const selectedTargetPlayer = players.find((p) => p.id === selectedTargetId);

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Voting Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-semibold">
          <Vote className="w-3.5 h-3.5 text-red-400" />
          <span>処刑投票 (VOTING TIME)</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-wide">
          人狼だと思う人物を指名せよ
        </h2>
        <p className="text-xs text-slate-400">
          最多得票者が処刑されます。平和村（人狼不在）と確信した場合は票を散らしましょう。
        </p>
      </div>

      {/* Voting Candidate Selection Cards */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
          <span>対象を選択してください</span>
          <span className="font-semibold text-slate-300">
            投票状況: {votedCount} / {players.length}人
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {players.map((p) => {
            const isMe = p.id === myPlayerId;
            const isSelected = selectedTargetId === p.id;

            return (
              <button
                key={p.id}
                disabled={hasVoted}
                onClick={() => {
                  sound.playClick();
                  setSelectedTargetId(p.id);
                }}
                className={`relative p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-red-950/50 border-red-500 ring-2 ring-red-500/40 shadow-lg'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                } ${hasVoted ? 'cursor-default opacity-85' : 'cursor-pointer active:scale-95'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                    {p.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-100 truncate">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {isMe ? '（自分自身）' : p.isBot ? 'BOT' : 'プレイヤー'}
                    </div>
                  </div>
                </div>

                {/* Voted check indicator */}
                {p.hasVoted && (
                  <div className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>投票済</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Confirmation Button */}
        <div className="pt-3 border-t border-slate-800">
          {!hasVoted ? (
            <div className="space-y-2">
              <button
                onClick={handleConfirmVote}
                disabled={!selectedTargetId}
                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                  selectedTargetId
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 active:scale-95 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                }`}
              >
                <Vote className="w-4 h-4" />
                <span>
                  {selectedTargetPlayer
                    ? `【${selectedTargetPlayer.name}】に投票する`
                    : '投票先を選択してください'}
                </span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>投票を完了しました！</span>
              </div>
              <p className="text-[11px] text-slate-400">
                全員の投票が集まり次第、処刑結果と勝敗が発表されます...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
