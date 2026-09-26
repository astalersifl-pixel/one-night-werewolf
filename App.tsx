/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import { Header } from './components/Header';
import { JoinScreen } from './components/JoinScreen';
import { LobbyView } from './components/LobbyView';
import { NightPhaseView } from './components/NightPhaseView';
import { DayPhaseView } from './components/DayPhaseView';
import { VotingPhaseView } from './components/VotingPhaseView';
import { ResultPhaseView } from './components/ResultPhaseView';
import { RulesModal } from './components/RulesModal';

export default function App() {
  const {
    isConnected,
    gameState,
    playerId,
    playerName,
    playerAvatar,
    setPlayerName,
    setPlayerAvatar,
    errorMsg,
    clearError,
    joinRoom,
    updateSettings,
    addBot,
    removePlayer,
    startGame,
    submitNightAction,
    controlDayTimer,
    castVote,
    playAgain,
    sendChat,
  } = useGameSocket();

  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans selection:bg-red-900 selection:text-white relative">
      {/* Background Starry Atmosphere */}
      <div className="fixed inset-0 bg-stars opacity-35 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-indigo-950/20 via-transparent to-red-950/20 pointer-events-none" />

      {/* Rules Modal */}
      <RulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
      />

      {/* Top Header if in room */}
      {gameState ? (
        <Header
          roomId={gameState.roomId}
          onOpenRules={() => setRulesModalOpen(true)}
        />
      ) : (
        <header className="w-full py-3 px-4 flex justify-end max-w-md mx-auto">
          <button
            onClick={() => setRulesModalOpen(true)}
            className="text-xs text-slate-400 hover:text-amber-400 font-semibold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
          >
            遊び方・ルール
          </button>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full p-3 sm:p-6 z-10">
        {!gameState ? (
          <JoinScreen
            playerName={playerName}
            playerAvatar={playerAvatar}
            setPlayerName={setPlayerName}
            setPlayerAvatar={setPlayerAvatar}
            onJoinRoom={joinRoom}
            errorMsg={errorMsg}
          />
        ) : (
          <>
            {/* Error Alert Banner */}
            {errorMsg && (
              <div className="max-w-2xl mx-auto mb-4 p-3 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-200 flex items-center justify-between">
                <span>{errorMsg}</span>
                <button
                  onClick={clearError}
                  className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Dynamic Phase Render */}
            {gameState.phase === 'lobby' && (
              <LobbyView
                gameState={gameState}
                myPlayerId={playerId}
                onUpdateSettings={updateSettings}
                onAddBot={addBot}
                onRemovePlayer={removePlayer}
                onStartGame={startGame}
              />
            )}

            {gameState.phase === 'night' && (
              <NightPhaseView
                gameState={gameState}
                myPlayerId={playerId}
                onSubmitNightAction={submitNightAction}
              />
            )}

            {gameState.phase === 'day' && (
              <DayPhaseView
                gameState={gameState}
                myPlayerId={playerId}
                onControlTimer={controlDayTimer}
                onSendMessage={sendChat}
              />
            )}

            {gameState.phase === 'voting' && (
              <VotingPhaseView
                gameState={gameState}
                myPlayerId={playerId}
                onCastVote={castVote}
              />
            )}

            {gameState.phase === 'result' && (
              <ResultPhaseView
                gameState={gameState}
                myPlayerId={playerId}
                onPlayAgain={playAgain}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-3 text-center text-[10px] text-slate-500 border-t border-slate-900 z-10">
        ワンナイト人狼 Online · リアルタイム対戦ブラウザゲーム
      </footer>
    </div>
  );
}
