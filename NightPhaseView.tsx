import React, { useState } from 'react';
import { PublicGameState, ROLES, RoleId } from '../types/game';
import { RoleCard } from './RoleCard';
import { Moon, Eye, Shuffle, Shield, CheckCircle, Users } from 'lucide-react';
import { sound } from '../utils/audio';

interface NightPhaseViewProps {
  gameState: PublicGameState;
  myPlayerId: string;
  onSubmitNightAction: (payload: any) => void;
}

export const NightPhaseView: React.FC<NightPhaseViewProps> = ({
  gameState,
  myPlayerId,
  onSubmitNightAction,
}) => {
  const { me, players } = gameState;
  const initialRole = me.initialRole;
  const nightInfo = me.nightInfo || {};
  const hasActed = Boolean(me.hasActedNight);

  const [seerChoice, setSeerChoice] = useState<'none' | 'player' | 'center'>('none');
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  const otherPlayers = players.filter((p) => p.id !== myPlayerId);
  const actedCount = players.filter((p) => p.hasActedNight).length;

  // Handle Seer target selection
  const handleSelectSeerTarget = (targetId: string) => {
    sound.playCardFlip();
    setSelectedTargetId(targetId);
    onSubmitNightAction({ actionType: 'PEEK_PLAYER', targetPlayerId: targetId });
  };

  const handleSelectSeerCenter = () => {
    sound.playCardFlip();
    setSeerChoice('center');
    onSubmitNightAction({ actionType: 'PEEK_CENTER' });
  };

  // Handle Robber target selection
  const handleSelectRobberTarget = (targetId: string) => {
    sound.playCardFlip();
    setSelectedTargetId(targetId);
    onSubmitNightAction({ actionType: 'SWAP_PLAYER', targetPlayerId: targetId });
  };

  // Handle Solitary Werewolf center peek
  const handleSelectWolfCenter = (idx: number) => {
    sound.playCardFlip();
    onSubmitNightAction({ actionType: 'PEEK_CENTER_WOLF', centerCardIndex: idx });
  };

  // Handle Finish Action
  const handleCompleteAction = () => {
    sound.playClick();
    onSubmitNightAction({ done: true });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Night Sky Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          <Moon className="w-3.5 h-3.5 text-indigo-400" />
          <span>夜のフェーズ (NIGHT PHASE)</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-wide">
          村人たちが眠りにつく夜...
        </h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          あなたの役職を確認し、能力がある場合は行動を行ってください。
        </p>
      </div>

      {/* Main Assigned Card */}
      <div className="flex flex-col items-center">
        <div className="text-xs font-bold text-slate-400 mb-2">
          あなたの配属役職
        </div>
        <RoleCard
          role={initialRole}
          isFlipped={true}
          size="lg"
          showDetails={true}
        />
      </div>

      {/* Role Action Interactive Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-sm space-y-4">
        {/* Werewolf Action */}
        {initialRole === 'werewolf' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm border-b border-slate-800 pb-2">
              <Moon className="w-4 h-4" />
              <span>人狼の夜の確認</span>
            </div>

            {nightInfo.partnerWerewolves && nightInfo.partnerWerewolves.length > 0 ? (
              <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-800/40 text-xs space-y-1">
                <span className="font-bold text-red-300">仲間の人狼:</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {nightInfo.partnerWerewolves.map((p) => (
                    <div
                      key={p.id}
                      className="px-3 py-1 rounded-lg bg-red-900/40 border border-red-700/60 text-red-200 font-bold flex items-center gap-1.5"
                    >
                      <span>🐺</span>
                      <span>{p.name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  互いに人狼であることを確認しました。昼の議論で協力し合いましょう。
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
                <div className="text-red-400 font-bold">
                  仲間の人狼はいません（一匹狼です）
                </div>
                <p className="text-slate-400 text-[11px]">
                  中央の墓地カードを1枚だけ選んで確認できます。
                </p>

                {nightInfo.solitaryWolfCenterCard ? (
                  <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/40 text-center">
                    <span className="text-[11px] text-slate-400 block mb-1">
                      墓地カード（{nightInfo.solitaryWolfCenterCard.index === 0 ? '左側' : '右側'}）の中身:
                    </span>
                    <span
                      className="text-sm font-black"
                      style={{ color: ROLES[nightInfo.solitaryWolfCenterCard.role].color }}
                    >
                      【{ROLES[nightInfo.solitaryWolfCenterCard.role].name}】
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleSelectWolfCenter(0)}
                      className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors"
                    >
                      墓地カード（左）を見る
                    </button>
                    <button
                      onClick={() => handleSelectWolfCenter(1)}
                      className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors"
                    >
                      墓地カード（右）を見る
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Seer Action */}
        {initialRole === 'seer' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-sm border-b border-slate-800 pb-2">
              <Eye className="w-4 h-4" />
              <span>占い師の透視</span>
            </div>

            {/* Display Peek Results */}
            {nightInfo.seerTargetPlayer ? (
              <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-600/40 text-center space-y-1">
                <span className="text-xs text-sky-300">
                  {nightInfo.seerTargetPlayer.name} さんの初期カードは...
                </span>
                <div
                  className="text-lg font-black"
                  style={{ color: ROLES[nightInfo.seerTargetPlayer.role].color }}
                >
                  【{ROLES[nightInfo.seerTargetPlayer.role].name}】
                </div>
              </div>
            ) : nightInfo.seerCenterCards ? (
              <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-600/40 text-center space-y-2">
                <span className="text-xs text-sky-300">
                  墓地（中央に残された2枚）のカードは...
                </span>
                <div className="flex justify-center gap-4">
                  {nightInfo.seerCenterCards.map((c, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 font-bold text-xs"
                      style={{ color: ROLES[c.role].color }}
                    >
                      {ROLES[c.role].name}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Choose mode */
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  どちらか一方を透視できます。選んでください:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => setSeerChoice('player')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                      seerChoice === 'player'
                        ? 'bg-sky-600/20 border-sky-500 text-sky-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>他プレイヤー1人の役職を見る</span>
                    <Users className="w-4 h-4 text-sky-400" />
                  </button>
                  <button
                    onClick={handleSelectSeerCenter}
                    className="p-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all text-left flex items-center justify-between"
                  >
                    <span>中央のカード2枚を見る</span>
                    <Eye className="w-4 h-4 text-sky-400" />
                  </button>
                </div>

                {seerChoice === 'player' && (
                  <div className="pt-2 space-y-2 animate-fade-in">
                    <span className="text-[11px] text-slate-400">
                      占うプレイヤーをタップしてください:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {otherPlayers.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleSelectSeerTarget(p.id)}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-sky-900/50 border border-slate-700 hover:border-sky-500 text-xs font-bold text-slate-200 flex items-center gap-2 transition-all active:scale-95"
                        >
                          <span className="text-base">{p.avatar}</span>
                          <span className="truncate">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Robber Action */}
        {initialRole === 'robber' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm border-b border-slate-800 pb-2">
              <Shuffle className="w-4 h-4" />
              <span>怪盗のカード交換</span>
            </div>

            {nightInfo.robberTargetPlayer ? (
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-600/40 text-center space-y-2">
                <span className="text-xs text-purple-300">
                  {nightInfo.robberTargetPlayer.name} さんのカードと交換しました！
                </span>
                <div className="text-xs text-slate-400">新しく手に入れた役職:</div>
                <div
                  className="text-xl font-black"
                  style={{ color: ROLES[nightInfo.robberTargetPlayer.stolenRole].color }}
                >
                  【{ROLES[nightInfo.robberTargetPlayer.stolenRole].name}】
                </div>
                <p className="text-[11px] text-slate-400 pt-1">
                  ※昼の議論からは、この新しい役職の陣営として振る舞います。相手には交換されたことは通知されません。
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-300">
                  カードを交換するプレイヤーを1人選んでください:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {otherPlayers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectRobberTarget(p.id)}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-purple-900/50 border border-slate-700 hover:border-purple-500 text-xs font-bold text-slate-200 flex items-center gap-2 transition-all active:scale-95"
                    >
                      <span className="text-base">{p.avatar}</span>
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Normal sleeper roles: Villager, Minion, Tanner */}
        {(initialRole === 'villager' || initialRole === 'minion' || initialRole === 'tanner') && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
            <div className="text-2xl animate-pulse">💤</div>
            <h4 className="text-sm font-bold text-slate-200">
              静かな夜を過ごしています...
            </h4>
            <p className="text-xs text-slate-400">
              あなたに夜の特殊能力はありません。朝が来たら皆と議論して推理を巡らせましょう。
            </p>
          </div>
        )}

        {/* Action Completion Button */}
        <div className="pt-3 border-t border-slate-800">
          {!hasActed ? (
            <button
              onClick={handleCompleteAction}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              <span>夜の行動を完了する（確認OK）</span>
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold">
                <CheckCircle className="w-4 h-4" />
                <span>あなたの行動は完了しました</span>
              </div>
              <p className="text-[11px] text-slate-400">
                他のプレイヤーの行動待ち... ({actedCount} / {players.length}人完了)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
