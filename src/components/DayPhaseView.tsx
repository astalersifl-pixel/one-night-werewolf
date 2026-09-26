import React, { useState } from 'react';
import { PublicGameState, ROLES } from '../types/game';
import { DeductionMemo } from './DeductionMemo';
import { ChatAndStamps } from './ChatAndStamps';
import { RoleCard } from './RoleCard';
import {
  Sun,
  Clock,
  Play,
  Pause,
  PlusCircle,
  Vote,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface DayPhaseViewProps {
  gameState: PublicGameState;
  myPlayerId: string;
  onControlTimer: (action: 'PAUSE' | 'RESUME' | 'ADD_60' | 'SKIP_TO_VOTE') => void;
  onSendMessage: (text: string, stamp?: string) => void;
}

export const DayPhaseView: React.FC<DayPhaseViewProps> = ({
  gameState,
  myPlayerId,
  onControlTimer,
  onSendMessage,
}) => {
  const { players, me, timerSecondsRemaining, timerIsRunning, chatMessages } = gameState;
  const isHost = me.isHost;

  const [showMyCard, setShowMyCard] = useState(false);

  const minutes = Math.floor(timerSecondsRemaining / 60);
  const seconds = timerSecondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isUrgent = timerSecondsRemaining <= 30 && timerSecondsRemaining > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12 animate-fade-in">
      {/* Daybreak Header & Timer Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Title */}
          <div className="text-center sm:text-left space-y-1">
            <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>朝の議論フェーズ (DISCUSSION)</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-100">
              怪しい人物を見抜き、人狼を吊るせ！
            </h2>
            <p className="text-xs text-slate-400">
              怪盗による役職入れ替えも考慮して、全員で推理を深めましょう。
            </p>
          </div>

          {/* Big Countdown Timer */}
          <div className="flex flex-col items-center">
            <div
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border font-mono font-black text-3xl sm:text-4xl tracking-tight transition-all shadow-inner ${
                isUrgent
                  ? 'bg-red-950/80 border-red-500 text-red-400 animate-pulse ring-2 ring-red-500/50'
                  : 'bg-slate-950/80 border-slate-700 text-amber-400'
              }`}
            >
              <Clock className="w-6 h-6 shrink-0 opacity-80" />
              <span>{formattedTime}</span>
            </div>
            {!timerIsRunning && (
              <span className="text-[11px] text-amber-400 mt-1 font-semibold">
                （一時停止中）
              </span>
            )}
          </div>
        </div>

        {/* Host Timer Controls */}
        {isHost && (
          <div className="relative z-10 mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-slate-400 font-semibold">
              ホスト操作:
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onControlTimer('ADD_60')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>+60秒</span>
              </button>

              <button
                onClick={() => onControlTimer(timerIsRunning ? 'PAUSE' : 'RESUME')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                {timerIsRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-sky-400" />
                    <span>一時停止</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    <span>再開</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onControlTimer('SKIP_TO_VOTE')}
                className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-xs font-bold text-white shadow-md transition-colors flex items-center gap-1.5"
              >
                <Vote className="w-3.5 h-3.5" />
                <span>投票へ進む</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toggle My Card Details Drawer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <button
          onClick={() => setShowMyCard(!showMyCard)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white bg-slate-950/40 hover:bg-slate-950/70 transition-colors"
        >
          <span>自分の夜の行動・カード情報を再確認</span>
          {showMyCard ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showMyCard && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/30 flex flex-col sm:flex-row items-center gap-4 animate-fade-in">
            <RoleCard
              role={me.currentRole || me.initialRole}
              isFlipped={true}
              size="sm"
              badge={me.currentRole && me.currentRole !== me.initialRole ? '怪盗後' : undefined}
            />
            <div className="text-xs text-slate-300 space-y-1.5">
              <div>
                <strong className="text-slate-400">初期役職: </strong>
                {me.initialRole && (
                  <span style={{ color: ROLES[me.initialRole].color }} className="font-bold">
                    {ROLES[me.initialRole].name}
                  </span>
                )}
              </div>
              {me.currentRole && me.currentRole !== me.initialRole && (
                <div>
                  <strong className="text-slate-400">現在の役職（怪盗奪取後）: </strong>
                  <span style={{ color: ROLES[me.currentRole].color }} className="font-bold">
                    {ROLES[me.currentRole].name}
                  </span>
                </div>
              )}
              {me.nightInfo?.seerTargetPlayer && (
                <div className="p-2 rounded bg-sky-950/40 border border-sky-800/40 text-sky-200">
                  占い結果: {me.nightInfo.seerTargetPlayer.name} さんは 【{ROLES[me.nightInfo.seerTargetPlayer.role].name}】 でした。
                </div>
              )}
              {me.nightInfo?.seerCenterCards && (
                <div className="p-2 rounded bg-sky-950/40 border border-sky-800/40 text-sky-200">
                  占い結果: 墓地カードは 【{ROLES[me.nightInfo.seerCenterCards[0].role].name}】 と 【{ROLES[me.nightInfo.seerCenterCards[1].role].name}】 でした。
                </div>
              )}
              {me.nightInfo?.solitaryWolfCenterCard && (
                <div className="p-2 rounded bg-red-950/40 border border-red-800/40 text-red-200">
                  墓地確認: 墓地カードは 【{ROLES[me.nightInfo.solitaryWolfCenterCard.role].name}】 でした。
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Deduction Memo */}
      <DeductionMemo players={players} myPlayerId={myPlayerId} />

      {/* Chat and Stamps Section */}
      <ChatAndStamps
        messages={chatMessages}
        onSendMessage={onSendMessage}
        myPlayerId={myPlayerId}
      />
    </div>
  );
};
