import React, { useState } from 'react';
import { soundEffects } from '@/utils/audioEffects';

export default function SoundboardPage() {
  const [activeSound, setActiveSound] = useState(null);

  const sounds = [
    {
      id: 'click',
      name: '🫧 Primary Click / Bubble Pop',
      category: 'UI Interaction',
      description: '40ms upward frequency sweep (400Hz → 1200Hz). Used for all button clicks & option selections.',
      play: () => soundEffects.playClick(),
      color: 'bg-cyan-500 hover:bg-cyan-600',
    },
    {
      id: 'toggle',
      name: '🎛️ Switch Toggle',
      category: 'UI Interaction',
      description: '30ms triangle wave snap (800Hz → 400Hz). Mode toggle / switch flip.',
      play: () => soundEffects.playToggle(),
      color: 'bg-indigo-500 hover:bg-indigo-600',
    },
    {
      id: 'send',
      name: '🚀 Message Send Whoosh',
      category: 'Q&A Chat',
      description: '80ms upward pitch pop (350Hz → 900Hz). Plays when player sends a question.',
      play: () => soundEffects.playMessageSend(),
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      id: 'receive',
      name: '🔔 Message Receive Ding',
      category: 'Q&A Chat',
      description: 'Double-ding chime (F5 → A5). Plays when AI character responds.',
      play: () => soundEffects.playMessageReceive(),
      color: 'bg-fuchsia-500 hover:bg-fuchsia-600',
    },
    {
      id: 'success',
      name: '✨ Success Chime',
      category: 'Game Feedback',
      description: 'Major triad arpeggio (C5 → E5 → G5). Plays when unlocking clues or insights.',
      play: () => soundEffects.playSuccess(),
      color: 'bg-emerald-500 hover:bg-emerald-600',
    },
    {
      id: 'doubleTriumph',
      name: '🎺 Double Triumph Fanfare',
      category: 'Game Victory',
      description: '2 triumphant major fanfare chords in rapid succession (160ms burst). Plays when solving a conundrum!',
      play: () => soundEffects.playDoubleTriumph(),
      color: 'bg-yellow-500 hover:bg-yellow-600',
    },
    {
      id: 'failure',
      name: '🎷 Comical Wah-Wah Slide',
      category: 'Game Feedback',
      description: '4-step descending slide (340Hz → 110Hz). Playful try again tone.',
      play: () => soundEffects.playFailure(),
      color: 'bg-rose-500 hover:bg-rose-600',
    },
    {
      id: 'unlock',
      name: '🌟 Magical Sparkle Unlock',
      category: 'Unlocks & Badges',
      description: '5-note ascending sparkle (C5 → E5 → G5 → C6 → E6). Secret unlocked.',
      play: () => soundEffects.playUnlock(),
      color: 'bg-amber-500 hover:bg-amber-600',
    },
    {
      id: 'tick',
      name: '⏱️ Woodblock Tick',
      category: 'Timer & Countdown',
      description: '15ms sharp woodblock tap (800Hz → 200Hz). Clock countdown tick.',
      play: () => soundEffects.playTick(),
      color: 'bg-teal-500 hover:bg-teal-600',
    },
    {
      id: 'timeup',
      name: '🔔 Time Up Gong',
      category: 'Timer & Countdown',
      description: '800ms low sine gong decay (220Hz → 110Hz). Timer expired.',
      play: () => soundEffects.playTimeUp(),
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ];

  const handlePlay = (snd) => {
    setActiveSound(snd.id);
    snd.play();
    setTimeout(() => setActiveSound(null), 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 text-center">
          <div className="inline-block px-4 py-1.5 mb-4 text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800/80 rounded-full">
            Web Audio API Synthesizer (Zero MP3 Latency)
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent mb-3">
            🎵 Conundrum Sound Sampler
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Click any button below to listen to the updated sound effects live in your browser!
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sounds.map((snd) => (
            <button
              key={snd.id}
              onClick={() => handlePlay(snd)}
              className={`relative text-left p-6 rounded-2xl border transition-all duration-200 cursor-pointer group shadow-lg overflow-hidden ${
                activeSound === snd.id
                  ? 'border-amber-400 scale-[0.98] ring-4 ring-amber-500/30 bg-slate-800'
                  : 'border-slate-800 bg-slate-900/80 hover:bg-slate-800/90 hover:border-slate-700 hover:-translate-y-1'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                  {snd.category}
                </span>
                <div className={`w-8 h-8 rounded-full ${snd.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                  ▶
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-amber-300 transition-colors">
                {snd.name}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {snd.description}
              </p>

              {activeSound === snd.id && (
                <div className="absolute inset-0 bg-amber-500/10 pointer-events-none animate-pulse rounded-2xl" />
              )}
            </button>
          ))}
        </div>

        <footer className="mt-12 text-center border-t border-slate-800/80 pt-8 text-slate-500 text-sm">
          <p>
            All sounds synthesized dynamically via browser-native AudioContext. No external sound files or network bandwidth required.
          </p>
        </footer>
      </div>
    </div>
  );
}
