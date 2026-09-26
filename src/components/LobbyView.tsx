import React, { useState } from 'react';
import {
  PublicGameState,
  PRESET_DECKS,
  AVATAR_OPTIONS,
  ROLES,
  RoleId,
} from '../types/game';
import {
  Users,
  Bot,
  Crown,
  Trash2,
  Play,
  Clock,
  Sparkles,
  Share2,
  Copy,
  Check,
  Plus,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface LobbyViewProps {
  gameState: PublicGameState;
  myPlayerId: string;
  onUpdateSettings: (settings: any) => void;
  onAddBot: () => void;
  onRemovePlayer: (id: string) => void;
  onStartGame: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  gameState,
  myPlayerId,
  onUpdateSettings,
  onAddBot,
  onRemovePlayer,
  onStartGame,
}) => {
  const { players, me, settings, roomId } = gameState;
  const isHost = me.isHost;
  const playerCount = players.length;
  const requiredCards = playerCount + 2;

  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    sound.playClick();
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ワンナイト人狼 Online',
          text: `ワンナイト人狼で一緒に遊ぼう！部屋番号: ${roomId}`,
          url: shareUrl,
        });
      } catch {
        // ignore
      }
    }
  };

  const handleApplyPreset = (presetKey: string) => {
    const preset = PRESET_DECKS[presetKey];
    if (preset) {
      onUpdateSettings({ deck: [...preset.deck] });
    }
  };

  const handleAddRole = (role: RoleId) => {
    onUpdateSettings({ deck: [...settings.deck, role] });
  };

  const handleRemoveRoleAt = (index: number) => {
    const newDeck = [...settings.deck];
    newDeck.splice(index, 1);
    onUpdateSettings({ deck: newDeck });
  };

  const timerOptions = [
    { label: '2分', seconds: 120 },
    { label: '3分 (標準)', seconds: 180 },
    { label: '5分', seconds: 300 },
    { label: '7分', seconds: 420 },
  ];

  const canStart = playerCount >= 3 && settings.deck.length === requiredCards;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Room Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/20 p-5 sm:p-6 shadow-2xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>待機ロビー (LOBBY)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>合言葉:</span>
              <span className="font-mono text-amber-300 tracking-wider bg-slate-950/80 px-3 py-1 rounded-xl border border-amber-500/30">
                {roomId}
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-1.5">
              URLや合言葉を友達にシェアして招待できます。スマホでもそのまま遊べます！
            </p>
          </div>

          {/* Share Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>リンクをコピーしました！</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>友達を招待（リンク共有）</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Players Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-base text-slate-100">
              参加プレイヤー ({playerCount}人)
            </h3>
            <span className="text-xs text-slate-400">
              ※最低3人からプレイ可能
            </span>
          </div>

          {isHost && (
            <button
              onClick={onAddBot}
              disabled={playerCount >= 8}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors disabled:opacity-50"
            >
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>BOTを追加 (一人でテスト可能)</span>
            </button>
          )}
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {players.map((p) => {
            const isMe = p.id === myPlayerId;
            return (
              <div
                key={p.id}
                className={`relative flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isMe
                    ? 'bg-sky-950/30 border-sky-500/50 ring-1 ring-sky-500/30'
                    : 'bg-slate-950/50 border-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                    {p.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-100 truncate">
                        {p.name}
                      </span>
                      {p.isHost && (
                        <span title="ホスト">
                          <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                      {isMe && <span className="text-sky-400 font-medium">あなた</span>}
                      {p.isBot && (
                        <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-1 rounded text-[10px]">
                          BOT
                        </span>
                      )}
                      {!p.isConnected && !p.isBot && (
                        <span className="text-red-400">切断中</span>
                      )}
                    </div>
                  </div>
                </div>

                {isHost && !isMe && (
                  <button
                    onClick={() => onRemovePlayer(p.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    title="キックする"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Deck & Role Setup Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg backdrop-blur-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <span>使用する役職カード</span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                  settings.deck.length === requiredCards
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                    : 'bg-red-950/60 text-red-400 border border-red-800/40'
                }`}
              >
                {settings.deck.length} / {requiredCards} 枚 (プレイヤー{playerCount}人 + 墓地2枚)
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              ワンナイト人狼では「参加人数 + 2枚」のカードを用意し、余った2枚は中央の墓地に置かれます。
            </p>
          </div>

          {/* Quick Presets for Host */}
          {isHost && (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(PRESET_DECKS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handleApplyPreset(key)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Current Deck Display */}
        <div>
          <div className="text-xs font-semibold text-slate-300 mb-2">
            現在のデッキ一覧（{isHost ? 'タップで削除できます' : 'ホストが設定中'}）:
          </div>
          <div className="flex flex-wrap gap-2">
            {settings.deck.map((roleId, idx) => {
              const role = ROLES[roleId];
              return (
                <div
                  key={idx}
                  onClick={() => isHost && handleRemoveRoleAt(idx)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                    isHost ? 'cursor-pointer hover:opacity-80 active:scale-95' : ''
                  }`}
                  style={{
                    backgroundColor: role.bgColor,
                    borderColor: role.color,
                    color: role.color,
                  }}
                  title={isHost ? 'クリックして削除' : undefined}
                >
                  <span>{role.name}</span>
                  {isHost && <span className="text-[10px] opacity-70">✕</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Role buttons for Host */}
        {isHost && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-xs font-semibold text-slate-300 mb-2">
              役職カードを追加:
            </div>
            <div className="flex flex-wrap gap-2">
              {(['werewolf', 'seer', 'robber', 'villager', 'minion', 'tanner'] as RoleId[]).map(
                (roleId) => {
                  const role = ROLES[roleId];
                  return (
                    <button
                      key={roleId}
                      onClick={() => handleAddRole(roleId)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-400" />
                      <span>{role.name}</span>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        )}
      </div>

      {/* Discussion Timer Setup */}
      {isHost && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg backdrop-blur-sm space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-slate-100">
              昼の議論時間設定
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {timerOptions.map((opt) => (
              <button
                key={opt.seconds}
                onClick={() => onUpdateSettings({ discussionSeconds: opt.seconds })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  settings.discussionSeconds === opt.seconds
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Start Game Action */}
      <div className="pt-2">
        {isHost ? (
          <div className="space-y-2">
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className={`w-full py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-all shadow-xl ${
                canStart
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-600/30 cursor-pointer active:scale-[0.99]'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
              }`}
            >
              <Play className="w-6 h-6 fill-current" />
              <span>ゲームを開始する</span>
            </button>
            {!canStart && (
              <p className="text-center text-xs text-amber-400/90 font-medium">
                {playerCount < 3
                  ? '※ゲーム開始には3人以上のプレイヤーが必要です（BOTを追加できます）。'
                  : `※カード枚数（現在${settings.deck.length}枚）をプレイヤー数+2枚（${requiredCards}枚）に合わせてください。`}
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center text-slate-300 text-xs sm:text-sm font-medium">
            ホストがゲームを開始するのをお待ちください...
          </div>
        )}
      </div>
    </div>
  );
};
