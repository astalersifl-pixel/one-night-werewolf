import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types/game';
import { Send, MessageSquare, Smile } from 'lucide-react';

interface ChatAndStampsProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, stamp?: string) => void;
  myPlayerId: string;
}

const QUICK_STAMPS = [
  { label: '占い師CO！🔮', text: '【CO】私は占い師です！' },
  { label: '怪盗CO！🎭', text: '【CO】私は怪盗です！' },
  { label: '村人です！🛡️', text: '【CO】私は村人です！' },
  { label: '怪しい…🐺', text: '怪しい…！人狼では？' },
  { label: '信じる！🤝', text: '信じます！' },
  { label: '平和村？🕊️', text: '人狼いないかも（平和村）？' },
  { label: '誰に投票？🗳️', text: '誰に投票する？' },
  { label: '時間ない！⏰', text: 'もう時間がない！' },
];

export const ChatAndStamps: React.FC<ChatAndStampsProps> = ({
  messages,
  onSendMessage,
  myPlayerId,
}) => {
  const [inputText, setInputText] = useState('');
  const [showStamps, setShowStamps] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleSelectStamp = (text: string) => {
    onSendMessage(text);
    setShowStamps(false);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg backdrop-blur-sm flex flex-col h-64 sm:h-72">
      {/* Chat Header */}
      <div className="px-3.5 py-2 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
          <span>チャット & スタンプ</span>
        </div>
        <button
          onClick={() => setShowStamps(!showStamps)}
          className={`text-[11px] px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
            showStamps
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <Smile className="w-3 h-3" />
          <span>クイック発言</span>
        </button>
      </div>

      {/* Quick Stamps Drawer */}
      {showStamps && (
        <div className="p-2 bg-slate-950/90 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-1.5 animate-fade-in text-xs">
          {QUICK_STAMPS.map((stamp, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectStamp(stamp.text)}
              className="p-1.5 text-left rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 transition-colors truncate active:scale-95"
            >
              {stamp.label}
            </button>
          ))}
        </div>
      )}

      {/* Message List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 text-xs"
      >
        {messages.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            まだ発言はありません。スタンプや文字で議論しましょう！
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === myPlayerId;
            const isSys = m.isSystem;

            if (isSys) {
              return (
                <div
                  key={m.id}
                  className="py-1 px-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 text-[11px] leading-relaxed text-center my-1"
                >
                  <span className="mr-1">{m.senderAvatar}</span>
                  {m.text}
                </div>
              );
            }

            return (
              <div
                key={m.id}
                className={`flex items-start gap-1.5 ${
                  isMe ? 'flex-row-reverse' : ''
                }`}
              >
                <div className="text-base shrink-0 select-none">
                  {m.senderAvatar}
                </div>
                <div
                  className={`max-w-[78%] flex flex-col ${
                    isMe ? 'items-end' : 'items-start'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 mb-0.5">
                    {m.senderName}
                  </span>
                  <div
                    className={`px-3 py-1.5 rounded-xl text-xs break-words shadow-sm leading-relaxed ${
                      isMe
                        ? 'bg-sky-600 text-white rounded-tr-none'
                        : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/60'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-2 bg-slate-950/80 border-t border-slate-800 flex items-center gap-1.5"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="発言を入力..."
          maxLength={80}
          className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 text-white transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
