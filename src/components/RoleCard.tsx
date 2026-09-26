import React from 'react';
import { RoleId, ROLES } from '../types/game';
import { Moon, Eye, Shuffle, Shield, Flame, Smile, Lock } from 'lucide-react';

interface RoleCardProps {
  role?: RoleId;
  isFlipped?: boolean; // true = show role, false = show card back
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  selected?: boolean;
  onClick?: () => void;
  badge?: string;
  subtext?: string;
}

const ROLE_ICONS: Record<RoleId, React.ReactNode> = {
  werewolf: <Moon className="w-8 h-8 text-red-400" />,
  seer: <Eye className="w-8 h-8 text-sky-400" />,
  robber: <Shuffle className="w-8 h-8 text-purple-400" />,
  villager: <Shield className="w-8 h-8 text-emerald-400" />,
  minion: <Flame className="w-8 h-8 text-orange-400" />,
  tanner: <Smile className="w-8 h-8 text-amber-400" />,
};

export const RoleCard: React.FC<RoleCardProps> = ({
  role,
  isFlipped = true,
  size = 'md',
  showDetails = false,
  selected = false,
  onClick,
  badge,
  subtext,
}) => {
  const roleDef = role ? ROLES[role] : null;

  const sizeClasses = {
    sm: 'w-24 h-36 text-xs',
    md: 'w-36 h-52 text-sm',
    lg: 'w-48 h-72 text-base',
  };

  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl select-none transition-all duration-300 ${sizeClasses[size]} ${
        isClickable ? 'cursor-pointer hover:scale-[1.03] active:scale-[0.98]' : ''
      } ${
        selected ? 'ring-4 ring-amber-400 shadow-lg shadow-amber-500/20' : ''
      }`}
    >
      {badge && (
        <div className="absolute -top-2.5 -right-2.5 z-20 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-slate-950 shadow-md">
          {badge}
        </div>
      )}

      {/* Card Back (Hidden Role) */}
      {!isFlipped || !roleDef ? (
        <div className="w-full h-full rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 border border-slate-700/80 p-3 flex flex-col items-center justify-between shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-stars opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

          {/* Card Back Crest */}
          <div className="relative z-10 w-full flex justify-between items-center text-slate-500 text-[10px] tracking-wider uppercase font-semibold">
            <span>ONE NIGHT</span>
            <Lock className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="relative z-10 flex flex-col items-center my-auto">
            <div className="w-14 h-14 rounded-full border border-indigo-500/30 flex items-center justify-center bg-indigo-950/40 shadow-inner group-hover:border-indigo-400/50 transition-colors">
              <span className="text-2xl filter drop-shadow">🐺</span>
            </div>
            <span className="mt-2 text-xs font-serif tracking-widest text-slate-400 font-bold">
              JINROU
            </span>
          </div>

          <div className="relative z-10 text-[10px] text-slate-500 text-center">
            {subtext || 'タップして確認'}
          </div>
        </div>
      ) : (
        /* Card Front (Revealed Role) */
        <div
          className="w-full h-full rounded-2xl p-3 flex flex-col justify-between shadow-2xl relative overflow-hidden border transition-all"
          style={{
            borderColor: roleDef.borderColor,
            background: `linear-gradient(145deg, rgba(15, 23, 42, 0.95), ${roleDef.bgColor})`,
          }}
        >
          {/* Subtle Glow */}
          <div
            className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-30"
            style={{ backgroundColor: roleDef.color }}
          />

          {/* Top header: Role & Team */}
          <div className="relative z-10 flex items-center justify-between">
            <span
              className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
              style={{
                color: roleDef.color,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
              }}
            >
              {roleDef.teamName}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {roleDef.nameEn}
            </span>
          </div>

          {/* Center: Icon & Title */}
          <div className="relative z-10 flex flex-col items-center my-auto text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2 shadow-inner border border-white/10"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)' }}
            >
              {ROLE_ICONS[roleDef.id]}
            </div>
            <h3
              className="text-lg font-black tracking-tight drop-shadow"
              style={{ color: roleDef.color }}
            >
              {roleDef.name}
            </h3>
          </div>

          {/* Bottom details or flavor */}
          <div className="relative z-10 text-center">
            {showDetails ? (
              <p className="text-[10px] text-slate-300 leading-tight bg-black/40 p-1.5 rounded-lg border border-white/5">
                {roleDef.nightActionDesc}
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 truncate">
                {roleDef.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
