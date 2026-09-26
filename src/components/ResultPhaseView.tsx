import React from 'react';
import { PublicGameState, ROLES } from '../types/game';
import { RoleCard } from './RoleCard';
import { Trophy, Skull, ArrowRight, RotateCcw, Crown, HeartHandshake } from 'lucide-react';
import { sound } from '../utils/audio';

interface ResultPhaseViewProps {
  gameState: PublicGameState;
  myPlayerId: string;
  onPlayAgain: () => void;
}

export const ResultPhaseView: React.FC<ResultPhaseViewProps> = ({
  gameState,
  myPlayerId,
  onPlayAgain,
}) => {
  const { result, players, me } = gameState;
  const isHost = me.isHost;

  if (!result) {
    return <div className="text-center py-12 text-slate-400">結果を集計中...</div>;
  }

  const isVillageWin = result.winningTeam === 'village';
  const isWerewolfWin = result.winningTeam === 'werewolf';
  const isTannerWin = result.winningTeam === 'tanner';

  const isMeWinner = result.winnerPlayerIds.includes(myPlayerId);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 animate-fade-in">
      {/* Victory Climax Banner */}
      <div
        className={`relative rounded-3xl p-6 sm:p-8 text-center border overflow-hidden shadow-2xl ${
          isVillageWin
            ? 'bg-gradient-to-b from-emerald-950/80 via-slate-900 to-slate-950 border-emerald-500/50 shadow-emerald-500/10'
            : isWerewolfWin
            ? 'bg-gradient-to-b from-red-950/80 via-slate-900 to-slate-950 border-red-500/50 shadow-red-500/10'
            : 'bg-gradient-to-b from-amber-950/80 via-slate-900 to-slate-950 border-amber-500/50 shadow-amber-500/10'
        }`}
      >
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/70 border border-white/10 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>結末発表 (GAME RESULT)</span>
          </div>

          <h2
            className={`text-2xl sm:text-4xl font-black tracking-tight ${
              isVillageWin
                ? 'text-emerald-400'
                : isWerewolfWin
                ? 'text-red-400'
                : 'text-amber-400'
            }`}
          >
            {result.winningTeamName} の勝利！
          </h2>

          <p className="text-xs sm:text-sm text-slate-200 max-w-lg mx-auto leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5">
            {result.reason}
          </p>

          <div className="pt-2">
            <span
              className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                isMeWinner
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {isMeWinner ? '🎉 あなたは勝利しました！' : '💀 あなたは敗北しました'}
            </span>
          </div>
        </div>
      </div>

      {/* Execution Results Spotlight */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
          <Skull className="w-4 h-4 text-red-400" />
          <span>処刑結果</span>
        </h3>

        {result.executedPlayerIds.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {result.executedPlayerIds.map((id) => {
              const p = players.find((x) => x.id === id);
              const finalRole = result.allPlayersFinalRoles[id];
              const roleDef = finalRole ? ROLES[finalRole] : null;

              return (
                <div
                  key={id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-red-950/30 border border-red-800/60"
                >
                  <div className="text-2xl">{p?.avatar || '👤'}</div>
                  <div>
                    <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      <span>{p?.name}</span>
                      <span className="text-[10px] text-red-400 font-bold bg-red-950 px-1.5 py-0.5 rounded border border-red-800">
                        処刑
                      </span>
                    </div>
                    {roleDef && (
                      <div className="text-xs font-semibold mt-0.5" style={{ color: roleDef.color }}>
                        役職: {roleDef.name} ({roleDef.teamName})
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>最多得票が1票以下で同数だったため、誰も処刑されませんでした（平和村判定）。</span>
          </div>
        )}
      </div>

      {/* Voting Breakdown */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
          投票の内訳
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {players.map((target) => {
            const voterIds = result.votes[target.id] || [];
            const voterNames = voterIds.map((vid) => players.find((p) => p.id === vid)?.name || '誰か');

            return (
              <div
                key={target.id}
                className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">{target.avatar}</span>
                  <span className="font-bold text-slate-200 truncate">{target.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-amber-400 mr-1.5">
                    {voterIds.length} 票
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({voterNames.join(', ') || '0票'})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role Reveal (Initial -> Final) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
          全プレイヤーの役職公開（夜の行動後）
        </h3>
        <div className="space-y-3">
          {players.map((p) => {
            const initRole = result.allPlayersInitialRoles[p.id];
            const finalRole = result.allPlayersFinalRoles[p.id];
            const wasSwapped = initRole !== finalRole;

            const initDef = initRole ? ROLES[initRole] : null;
            const finalDef = finalRole ? ROLES[finalRole] : null;

            return (
              <div
                key={p.id}
                className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  wasSwapped
                    ? 'bg-purple-950/20 border-purple-800/50'
                    : 'bg-slate-950/50 border-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="text-xl">{p.avatar}</div>
                  <div>
                    <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      <span>{p.name}</span>
                      {wasSwapped && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-900/80 text-purple-300 border border-purple-700/60">
                          怪盗入替
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {initDef && (
                    <span
                      className="px-2.5 py-1 rounded-lg font-bold"
                      style={{
                        backgroundColor: initDef.bgColor,
                        color: initDef.color,
                        borderColor: `${initDef.borderColor}40`,
                      }}
                    >
                      初期: {initDef.name}
                    </span>
                  )}

                  {wasSwapped && finalDef && (
                    <>
                      <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                      <span
                        className="px-2.5 py-1 rounded-lg font-bold ring-1"
                        style={{
                          backgroundColor: finalDef.bgColor,
                          color: finalDef.color,
                          borderColor: finalDef.borderColor,
                        }}
                      >
                        最終: {finalDef.name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Graveyard / Center Cards Reveal */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
          墓地（中央に残されていた2枚のカード）
        </h3>
        <div className="flex justify-center gap-4 py-2">
          {result.centerRoles.map((roleId, idx) => (
            <RoleCard
              key={idx}
              role={roleId}
              isFlipped={true}
              size="sm"
              badge={`墓地 ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Play Again Host Action */}
      <div className="pt-2">
        {isHost ? (
          <button
            onClick={onPlayAgain}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all active:scale-[0.99] cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>同じメンバーでもう一度遊ぶ</span>
          </button>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center text-slate-300 text-xs sm:text-sm font-medium">
            ホストが「もう一度遊ぶ」を押すとロビーに戻ります...
          </div>
        )}
      </div>
    </div>
  );
};
