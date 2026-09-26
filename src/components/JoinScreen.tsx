import React, { useState, useEffect } from 'react';
import { AVATAR_OPTIONS } from '../types/game';
import { Users, Plus, ArrowRight, ShieldCheck, Sparkles, Moon } from 'lucide-react';
import { sound } from '../utils/audio';

interface JoinScreenProps {
  playerName: string;
  playerAvatar: string;
  setPlayerName: (name: string) => void;
  setPlayerAvatar: (avatar: string) => void;
  onJoinRoom: (roomId?: string) => void;
  errorMsg: string | null;
}

export const JoinScreen: React.FC<JoinScreenProps> = ({
  playerName,
  playerAvatar,
  setPlayerName,
  setPlayerAvatar,
  onJoinRoom,
  errorMsg,
}) => {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setRoomCodeInput(roomParam.toUpperCase());
    }
  }, []);

  const handleCreateRoom = () => {
    sound.playClick();
    onJoinRoom(); // Server will generate new room code
  };

  const handleJoinWithCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!roomCodeInput.trim()) return;
    sound.playClick();
    onJoinRoom(roomCodeInput.trim().toUpperCase());
  };

  return (
    <div className="max-w-md mx-auto space-y-6 py-6 px-4 animate-fade-in">
      {/* Title & Moon Logo */}
      <div className="text-center space-y-3">
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-red-950 via-slate-900 to-indigo-950 border border-red-500/40 flex items-center justify-center text-4xl shadow-2xl shadow-red-950/50 animate-moon-glow">
            🐺
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 border-2 border-slate-950 flex items-center justify-center text-xs">
            🌙
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-slate-100">
            ワンナイト人狼
          </h1>
          <p className="text-xs font-mono text-red-400 font-bold tracking-widest mt-0.5">
            ONE NIGHT WEREWOLF ONLINE
          </p>
          <p className="text-xs text-slate-400 mt-2">
            スマホ・PCで手軽にサクサク遊べるリアルタイム人狼
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-200 text-center animate-shake">
          {errorMsg}
        </div>
      )}

      {/* Profile Card Setup */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          プレイヤー設定
        </h2>

        <div className="flex items-center gap-3">
          {/* Avatar selector button */}
          <button
            type="button"
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex flex-col items-center justify-center text-2xl transition-all shadow-inner active:scale-95 shrink-0"
            title="アイコンを変更"
          >
            <span>{playerAvatar}</span>
            <span className="text-[9px] text-slate-400 font-semibold">変更</span>
          </button>

          {/* Name input */}
          <div className="flex-1">
            <label className="block text-[11px] text-slate-400 font-medium mb-1">
              名前（ニックネーム）
            </label>
            <input
              type="text"
              value={playerName}
              maxLength={12}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="あなたの名前"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-bold focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
        </div>

        {/* Avatar Grid Picker */}
        {showAvatarPicker && (
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 grid grid-cols-6 gap-2 animate-fade-in">
            {AVATAR_OPTIONS.map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setPlayerAvatar(av);
                  setShowAvatarPicker(false);
                }}
                className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                  playerAvatar === av
                    ? 'bg-red-950 border border-red-500 scale-110 shadow-md'
                    : 'bg-slate-900 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions: Create Room or Join Room */}
      <div className="space-y-3">
        {/* Create Room Button */}
        <button
          onClick={handleCreateRoom}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-700 via-rose-600 to-red-700 hover:from-red-600 hover:to-rose-500 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-red-700/30 transition-all active:scale-[0.99] cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>新しい部屋を作る（ホスト）</span>
        </button>

        {/* Join With Code Form */}
        <form
          onSubmit={handleJoinWithCode}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3"
        >
          <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-sky-400" />
            <span>合言葉（部屋番号）で参加する</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              placeholder="例: WOLF"
              maxLength={8}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-center font-mono font-black tracking-widest text-amber-300 placeholder-slate-600 focus:outline-none focus:border-sky-500 uppercase"
            />
            <button
              type="submit"
              disabled={!roomCodeInput.trim()}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
            >
              <span>入室</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Feature Highlights Footer */}
      <div className="pt-4 text-center space-y-2">
        <div className="inline-flex items-center gap-1 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>リアルタイム通信対応・BOT追加で1人でもテスト可能</span>
        </div>
        <p className="text-[10px] text-slate-500">
          ワンナイト人狼 Online · 役職: 人狼 / 占い師 / 怪盗 / 村人 / 狂人 / てるてる
        </p>
      </div>
    </div>
  );
};
