import React, { useState } from 'react';
import { Volume2, VolumeX, HelpCircle, Share2, Check, Copy } from 'lucide-react';
import { sound } from '../utils/audio';

interface HeaderProps {
  roomId: string;
  onOpenRules: () => void;
}

export const Header: React.FC<HeaderProps> = ({ roomId, onOpenRules }) => {
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(() => sound.getMuted());

  const handleToggleMute = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
  };

  const handleCopyLink = async () => {
    sound.playClick();
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    // Also trigger mobile native share if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ワンナイト人狼 Online',
          text: `ワンナイト人狼で一緒に遊ぼう！部屋番号: ${roomId}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled share, ignore
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-3 py-2.5 sm:px-6">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Logo / App Name */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-950/80 border border-red-500/40 flex items-center justify-center text-lg shadow-sm">
            🐺
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-wider text-slate-100 flex items-center gap-1.5">
              <span>ワンナイト人狼</span>
              <span className="text-[10px] font-mono text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/50">
                ONLINE
              </span>
            </h1>
          </div>
        </div>

        {/* Room Code & Share button */}
        {roomId && (
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-slate-400 text-[11px]">合言葉:</span>
            <span className="font-mono font-bold tracking-wider text-amber-300">
              {roomId}
            </span>
            <button
              onClick={handleCopyLink}
              title="招待リンクをコピー"
              className="ml-1 p-1 hover:bg-slate-800 rounded transition-colors text-slate-300 hover:text-white"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={handleCopyLink}
              title="シェアする"
              className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-300 hover:text-white"
            >
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleMute}
            aria-label="ミュート切替"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onOpenRules();
            }}
            aria-label="遊び方・役職説明"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
