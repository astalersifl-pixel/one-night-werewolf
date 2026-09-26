import React from 'react';
import { X, Moon, Eye, Shuffle, Shield, Flame, Smile, BookOpen, AlertTriangle } from 'lucide-react';
import { ROLES, RoleId } from '../types/game';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const roleList: RoleId[] = ['werewolf', 'seer', 'robber', 'villager', 'minion', 'tanner'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[88vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base sm:text-lg text-slate-100">
              ワンナイト人狼の遊び方 & ルール
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {/* Quick Overview */}
          <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
            <h3 className="font-bold text-amber-400 text-xs tracking-wider uppercase">
              ゲームの流れ（一晩で決着！）
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300">
              <li>
                <span className="font-semibold text-slate-100">夜の行動:</span> 各自役職の確認と能力（占い・怪盗等）を発動。中央に2枚のカードが余ります。
              </li>
              <li>
                <span className="font-semibold text-slate-100">昼の議論:</span> 怪盗が入れ替えた可能性も踏まえながら、誰が人狼か（あるいは平和村か）を推理してトーク！
              </li>
              <li>
                <span className="font-semibold text-slate-100">投票・処刑:</span> 最多得票者が処刑されます。
              </li>
            </ol>
          </div>

          {/* Victory Conditions */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>勝敗判定の基準</span>
            </h3>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-yellow-950/20 border border-yellow-700/40">
                <span className="font-bold text-yellow-400">1. てるてる最優先判定:</span>
                <p className="text-slate-300 mt-0.5">
                  「てるてる」が処刑された場合、人狼や村人に関係なく<span className="text-yellow-300 font-semibold">てるてるの単独勝利</span>となります！
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-700/40">
                <span className="font-bold text-emerald-400">2. 村人陣営の勝利条件:</span>
                <p className="text-slate-300 mt-0.5">
                  最終役職の<span className="text-emerald-300 font-semibold">人狼を1匹以上処刑</span>できれば勝利！また、人狼が最初から2匹とも墓地にあった（平和村）場合、<span className="text-emerald-300 font-semibold">全員が1票ずつ等で誰も処刑されなければ</span>村人陣営の勝利です。
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-700/40">
                <span className="font-bold text-red-400">3. 人狼・狂人陣営の勝利条件:</span>
                <p className="text-slate-300 mt-0.5">
                  <span className="text-red-300 font-semibold">人狼が1匹も処刑されずに生き残った</span>場合、人狼陣営の勝利です。狂人は人狼が勝てば一緒に勝利！
                </p>
              </div>
            </div>
          </div>

          {/* Roles Breakdown */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wider">
              登場役職一覧
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {roleList.map((id) => {
                const r = ROLES[id];
                return (
                  <div
                    key={id}
                    className="p-2.5 rounded-xl border flex items-start gap-3 bg-slate-950/40"
                    style={{ borderColor: `${r.color}40` }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: r.bgColor,
                        borderColor: r.color,
                        color: r.color,
                      }}
                    >
                      {id === 'werewolf' && <Moon className="w-5 h-5" />}
                      {id === 'seer' && <Eye className="w-5 h-5" />}
                      {id === 'robber' && <Shuffle className="w-5 h-5" />}
                      {id === 'villager' && <Shield className="w-5 h-5" />}
                      {id === 'minion' && <Flame className="w-5 h-5" />}
                      {id === 'tanner' && <Smile className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm" style={{ color: r.color }}>
                          {r.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {r.teamName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-snug">
                        {r.description}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        <strong className="text-slate-200">夜の行動: </strong>
                        {r.nightActionDesc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
