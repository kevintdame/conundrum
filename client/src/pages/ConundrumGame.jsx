import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, ArrowRight, RefreshCw, AlertCircle, Sparkles, CheckCircle2, AlertTriangle, Star, Award, Lightbulb, ArrowLeft, Check, ChevronLeft, ChevronRight, Rocket, PartyPopper 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { soundEffects } from "@/utils/audioEffects";
import confetti from "canvas-confetti";

// 6 CORE GAMEPLAY CATEGORIES (EPIC BUBBLES FOR KIDS & ADULTS)
const CATEGORY_BUBBLES = [
  { label: "Escape Room", desc: "Spatial Traps, Locked Hardware, & Breakout Mechanisms", emoji: "🚪", grad: "from-amber-500 via-orange-500 to-red-600", ring: "ring-amber-300", glow: "rgba(245,158,11,0.5)" },
  { label: "Time Crunch", desc: "High-Stakes Emergency Saves Before Damage Occurs", emoji: "⏳", grad: "from-red-500 via-rose-500 to-pink-600", ring: "ring-rose-300", glow: "rgba(244,63,94,0.5)" },
  { label: "Social Tact", desc: "Everyday Awkward Situations, Boundaries, & Diplomacy", emoji: "🤝", grad: "from-sky-400 via-blue-500 to-indigo-600", ring: "ring-sky-300", glow: "rgba(56,189,248,0.5)" },
  { label: "Mystery Clue", desc: "Deducing Look-Alike Items Without Damaging Them", emoji: "🔍", grad: "from-purple-500 via-fuchsia-500 to-pink-500", ring: "ring-purple-300", glow: "rgba(168,85,247,0.5)" },
  { label: "Tool Hack", desc: "Making Do & Repurposing When Tools are Missing", emoji: "🛠️", grad: "from-emerald-400 via-teal-500 to-cyan-600", ring: "ring-emerald-300", glow: "rgba(52,211,153,0.5)" },
  { label: "Idea Lab", desc: "Inventing Products & Service Concepts for Daily Hassles", emoji: "💡", grad: "from-yellow-400 via-amber-400 to-orange-500", ring: "ring-yellow-300", glow: "rgba(250,204,21,0.5)" }
];

const KIDS_CATEGORIES = CATEGORY_BUBBLES;
const ADULTS_CATEGORIES = CATEGORY_BUBBLES;

// LARGER FOOTPRINT VECTOR JIGSAW PUZZLE PIECE WITH PERFECT 1-TO-1 INTERLOCKING SEAMS
const JigsawGridPiece = ({ char, row, col }) => {
  // True = male tab bump out, False = female cutout hole in, Null = flat outer edge
  const config = [
    // Row 0
    [
      { top: null, left: null, right: true, bottom: true },    // C
      { top: null, left: false, right: false, bottom: false },  // O
      { top: null, left: true, right: null, bottom: true }     // N
    ],
    // Row 1
    [
      { top: false, left: null, right: true, bottom: false },   // U
      { top: true, left: false, right: true, bottom: false },   // N
      { top: false, left: false, right: null, bottom: false }   // D
    ],
    // Row 2
    [
      { top: true, left: null, right: true, bottom: null },    // R
      { top: true, left: false, right: false, bottom: null },   // U
      { top: true, left: true, right: null, bottom: null }     // M
    ]
  ][row][col];

  const getPath = () => {
    const { top, right, bottom, left } = config;
    let d = "";

    // Start Top-Left
    d += "M 14 0 ";

    // TOP EDGE
    if (top === null) {
      d += "L 86 0 ";
    } else if (top === true) {
      d += "L 36 0 C 36 -16, 64 -16, 64 0 L 86 0 ";
    } else {
      d += "L 36 0 C 36 16, 64 16, 64 0 L 86 0 ";
    }

    // TOP-RIGHT CORNER
    d += (col === 2 && row === 0) ? "A 14 14 0 0 1 100 14 " : "L 100 0 L 100 14 ";

    // RIGHT EDGE
    if (right === null) {
      d += "L 100 86 ";
    } else if (right === true) {
      d += "L 100 36 C 116 36, 116 64, 100 64 L 100 86 ";
    } else {
      d += "L 100 36 C 84 36, 84 64, 100 64 L 100 86 ";
    }

    // BOTTOM-RIGHT CORNER
    d += (col === 2 && row === 2) ? "A 14 14 0 0 1 86 100 " : "L 100 100 L 86 100 ";

    // BOTTOM EDGE
    if (bottom === null) {
      d += "L 14 100 ";
    } else if (bottom === true) {
      d += "L 64 100 C 64 116, 36 116, 36 100 L 14 100 ";
    } else {
      d += "L 64 100 C 64 84, 36 84, 36 100 L 14 100 ";
    }

    // BOTTOM-LEFT CORNER
    d += (col === 0 && row === 2) ? "A 14 14 0 0 1 0 86 " : "L 0 100 L 0 86 ";

    // LEFT EDGE
    if (left === null) {
      d += "L 0 14 ";
    } else if (left === true) {
      d += "L 0 64 C -16 64, -16 36, 0 36 L 0 14 ";
    } else {
      d += "L 0 64 C 16 64, 16 36, 0 36 L 0 14 ";
    }

    // TOP-LEFT CORNER
    d += (col === 0 && row === 0) ? "A 14 14 0 0 1 14 0 Z" : "L 0 0 L 14 0 Z";

    return d;
  };

  return (
    <div className="relative w-24 h-24 sm:w-40 sm:h-40 md:w-52 md:h-52 flex items-center justify-center font-['Lilita_One',sans-serif] text-5xl sm:text-8xl md:text-[9rem] text-slate-950 select-none">
      <svg viewBox="-20 -20 140 140" className="absolute inset-0 w-full h-full drop-shadow-xl overflow-visible">
        <path
          d={getPath()}
          fill="url(#puzzle-tile-grad)"
          stroke="#b45309"
          strokeWidth="2.5"
        />
        <defs>
          <linearGradient id="puzzle-tile-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="60%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
        </defs>
      </svg>
      <span className="relative z-10 drop-shadow-md">{char}</span>
    </div>
  );
};

export default function ConundrumGame() {
  const [selectedMode, setSelectedMode] = useState(null); // "kids" or "adults"
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const [scenario, setScenario] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Gameplay State
  const [qaHistory, setQaHistory] = useState([]);
  const [questionInput, setQuestionInput] = useState("");
  const [askingQuestion, setAskingQuestion] = useState(false);

  // Screen View State: "SPLASH", "MODE_SELECT", "CATEGORY_SELECT", "DISCOVERY", "SOLUTION", "OUTCOME"
  const [viewState, setViewState] = useState("SPLASH");
  const [pitchText, setPitchText] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);

  // Outcome Screen Sub-State: "FEEDBACK", "OTHER_SOLUTIONS"
  const [outcomeSubState, setOutcomeSubState] = useState("FEEDBACK");
  const [altSolutionIndex, setAltSolutionIndex] = useState(0);

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (viewState === "DISCOVERY") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [qaHistory, viewState]);

  const activeCategoryList = selectedMode === "kids" ? KIDS_CATEGORIES : ADULTS_CATEGORIES;

  const [questionsLeft, setQuestionsLeft] = useState(5);

  // Fetch Scenario for Selected Mode & Category Immediately
  const handleLaunchChallenge = async (catParam, modeParam) => {
    const modeToUse = modeParam || selectedMode;
    const catToUse = catParam || selectedCategory;
    if (!modeToUse || !catToUse) return;
    
    soundEffects.playClick();

    setLoading(true);
    setError(null);
    setScenario(null);
    setQaHistory([]);
    setPitchText("");
    setEvaluationResult(null);
    setQuestionsLeft(5);
    setViewState("DISCOVERY");

    try {
      const response = await fetch("/api/conundrum2/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: modeToUse, targetCategory: catToUse.label }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setScenario(data);

      const cleanComplaint = data.complaint.startsWith("Hi! I'm") 
        ? data.complaint 
        : `Hi! I'm ${data.character}. ${data.complaint}`;

      setQaHistory([
        {
          id: `intro-${Date.now()}`,
          sender: "character",
          text: cleanComplaint,
        },
      ]);
    } catch (err) {
      console.error("Conundrum fetch error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Question Submission in Continuous Chat
  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!questionInput.trim() || askingQuestion || questionsLeft <= 0) return;

    soundEffects.playClick();
    const qText = questionInput.trim();
    setQuestionInput("");
    setAskingQuestion(true);
    setQuestionsLeft((prev) => Math.max(0, prev - 1));

    setQaHistory((prev) => [...prev, { id: `q-${Date.now()}`, sender: "player", text: qText }]);

    try {
      const response = await fetch("/api/conundrum2/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario,
          question: qText,
        }),
      });

      if (!response.ok) throw new Error("Failed to answer question");

      const data = await response.json();
      setQaHistory((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, sender: "character", text: data.answer },
      ]);
    } catch (err) {
      setQaHistory((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, sender: "character", text: "My thoughts got scrambled! Ask me again in a second!" },
      ]);
    } finally {
      setAskingQuestion(false);
    }
  };

  // Submit Solution Pitch
  const handleSubmitPitch = async () => {
    if (!pitchText.trim() || evaluating) return;

    soundEffects.playClick();
    setEvaluating(true);

    try {
      const response = await fetch("/api/conundrum2/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario,
          solutionText: pitchText.trim(),
          mode: selectedMode
        }),
      });

      if (!response.ok) throw new Error("Evaluation failed");

      const data = await response.json();
      setEvaluationResult(data);
      setViewState("OUTCOME");
      setOutcomeSubState("FEEDBACK");

      if (data.passed) {
        soundEffects.playSuccess();
        confetti({
          particleCount: 160,
          spread: 100,
          origin: { y: 0.3 },
          colors: ["#F59E0B", "#EC4899", "#3B82F6", "#10B981", "#8B5CF6"],
        });
      } else {
        soundEffects.playFailure();
      }
    } catch (err) {
      alert(`Evaluation error: ${err.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  // SCREEN 0: SPLASH SCREEN WITH COMPACT RESPONSIVE SPACING
  if (viewState === "SPLASH") {
    const line1 = ["C", "O", "N"];
    const line2 = ["U", "N", "D"];
    const line3 = ["R", "U", "M"];

    return (
      <div 
        onClick={() => { soundEffects.playClick(); setViewState("MODE_SELECT"); }}
        className="fixed inset-0 z-50 w-screen h-screen flex flex-col justify-between p-3 sm:p-6 text-white select-none bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-600 font-['Nunito',sans-serif] cursor-pointer overflow-hidden"
      >
        <div className="max-w-3xl sm:max-w-4xl w-full mx-auto flex-1 flex flex-col justify-center items-center text-center space-y-4 sm:space-y-8 my-auto">
          
          {/* MASSIVE 3-LINE JIGSAW GRID WITH ENLARGED FOOTPRINT */}
          <div className="flex flex-col items-center justify-center -space-y-4 sm:-space-y-7 md:-space-y-9 my-1">
            {[line1, line2, line3].map((row, rowIdx) => (
              <div key={rowIdx} className="flex items-center justify-center -space-x-4 sm:-space-x-7 md:-space-x-9">
                {row.map((char, charIdx) => {
                  const totalIndex = rowIdx * 3 + charIdx;
                  const randomX = (totalIndex % 2 === 0 ? 1 : -1) * (90 + Math.random() * 110);
                  const randomY = (totalIndex % 3 === 0 ? 1 : -1) * (90 + Math.random() * 110);
                  const randomRotate = (Math.random() - 0.5) * 240;

                  return (
                    <motion.div
                      key={charIdx}
                      initial={{
                        x: randomX,
                        y: randomY,
                        rotate: randomRotate,
                        opacity: 0,
                        scale: 0.2
                      }}
                      animate={{
                        x: 0,
                        y: 0,
                        rotate: 0,
                        opacity: 1,
                        scale: 1
                      }}
                      transition={{
                        duration: 0.85,
                        delay: totalIndex * 0.08,
                        type: "spring",
                        stiffness: 160,
                        damping: 14
                      }}
                    >
                      <JigsawGridPiece char={char} row={rowIdx} col={charIdx} />
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* SUBTITLE: EVERYDAY PUZZLES */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            className="text-sm sm:text-lg font-black uppercase tracking-[0.3em] text-white/90 pt-1"
          >
            EVERYDAY PUZZLES
          </motion.p>

          {/* STANDARD PLAY BUTTON */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.3, duration: 0.4 }}
            className="pt-1"
          >
            <Button
              onClick={(e) => {
                e.stopPropagation();
                soundEffects.playClick();
                setViewState("MODE_SELECT");
              }}
              size="lg"
              className="w-56 sm:w-64 h-12 sm:h-14 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 font-['Lilita_One',sans-serif] text-xl uppercase tracking-wider rounded-full shadow-2xl hover:scale-105 transition-all cursor-pointer flex items-center justify-center border-none"
            >
              PLAY
            </Button>
          </motion.div>

        </div>
      </div>
    );
  }

  // SCREEN 1: MODE SELECTION
  if (viewState === "MODE_SELECT") {
    return (
      <div className="fixed inset-0 z-50 w-screen h-screen flex flex-col justify-between p-4 sm:p-6 text-white overflow-y-auto select-none bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-600 font-['Nunito',sans-serif]">
        <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center items-center text-center space-y-6 my-auto">
          
          <motion.h2
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl sm:text-6xl font-extrabold font-['Lilita_One',sans-serif] uppercase leading-none mb-1 text-white drop-shadow-2xl"
          >
            CHOOSE A MODE
          </motion.h2>

          <div className="grid grid-cols-1 gap-4 w-full text-left">
            {[
              {
                key: "kids",
                label: "KIDS MODE",
                desc: "Ages 8–12 • Fun, Whimsical Everyday Challenges",
                emoji: "🎈",
                grad: "from-yellow-400 via-amber-400 to-orange-500",
                glow: "rgba(250,204,21,0.5)",
              },
              {
                key: "adults",
                label: "ADULTS MODE",
                desc: "Ages 13+ • Clever, Human-Centered Design Challenges",
                emoji: "🚀",
                grad: "from-fuchsia-500 via-purple-600 to-indigo-700",
                glow: "rgba(217,70,239,0.5)",
              },
            ].map((m) => (
              <motion.button
                key={m.key}
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  soundEffects.playClick();
                  setSelectedMode(m.key);
                  setSelectedCategory(null);
                  setViewState("CATEGORY_SELECT");
                }}
                className={`relative text-left rounded-3xl p-5 sm:p-7 transition-all overflow-hidden bg-gradient-to-br ${m.grad} shadow-xl hover:shadow-2xl cursor-pointer`}
              >
                <div className="flex items-start justify-between">
                  <div className="text-4xl sm:text-5xl drop-shadow">
                    {m.emoji}
                  </div>
                </div>
                <span className="block font-['Lilita_One',sans-serif] text-2xl sm:text-4xl text-white mt-3 uppercase tracking-wide drop-shadow">
                  {m.label}
                </span>
                <span className="block text-white/95 text-xs sm:text-sm font-bold leading-snug mt-1">{m.desc}</span>
              </motion.button>
            ))}
          </div>

        </div>
      </div>
    );
  }

  // SCREEN 2: CATEGORY SELECT
  if (viewState === "CATEGORY_SELECT") {
    return (
      <div className="fixed inset-0 z-50 w-screen h-[100dvh] flex flex-col justify-between p-3 sm:p-5 text-white select-none bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-600 font-['Nunito',sans-serif] overflow-hidden">
        
        {/* PINNED TOP HEADER BAR */}
        <div className="max-w-md w-full mx-auto flex items-center justify-between pt-1 pb-2 shrink-0 z-50 relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              soundEffects.playClick();
              setViewState("MODE_SELECT");
            }}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 active:scale-95 backdrop-blur-md cursor-pointer transition-all border border-white/30 flex items-center justify-center text-white shrink-0 z-50 relative"
          >
            <ArrowLeft className="w-5 h-5 text-white shrink-0" />
          </button>
          <span className="text-xs font-black uppercase text-amber-300 tracking-widest shrink-0">
            {selectedMode === "kids" ? "🎈 KIDS MODE" : "🚀 ADULTS MODE"}
          </span>
        </div>

        <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-between items-center text-center space-y-3 my-auto min-h-0 overflow-hidden">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-0.5 shrink-0"
          >
            <h2 className="text-3xl sm:text-5xl font-['Lilita_One',sans-serif] uppercase tracking-wide text-white drop-shadow-2xl">
              PICK A CATEGORY
            </h2>
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-300">
              TAP ANY CATEGORY TO PLAY
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-2.5 w-full text-left flex-1 overflow-y-auto pr-1 py-1">
            {activeCategoryList.map((cat) => (
              <motion.button
                key={cat.label}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedCategory(cat);
                  handleLaunchChallenge(cat, selectedMode);
                }}
                className={`relative text-left rounded-2xl p-4 transition-all overflow-hidden bg-gradient-to-br ${cat.grad} shadow-lg min-h-[72px] flex items-center justify-between hover:shadow-xl cursor-pointer`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl sm:text-4xl shrink-0 drop-shadow">
                    {cat.emoji}
                  </div>
                  <div>
                    <span className="block font-['Lilita_One',sans-serif] text-xl sm:text-2xl text-white uppercase tracking-wide drop-shadow leading-tight">
                      {cat.label}
                    </span>
                    <span className="block text-white/90 text-xs font-bold leading-snug mt-0.5">{cat.desc}</span>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-white shrink-0 ml-2 drop-shadow" />
              </motion.button>
            ))}
          </div>

        </div>
      </div>
    );
  }

  // LOADING STATE
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 w-screen h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-600 flex flex-col items-center justify-center p-6 text-center text-white select-none font-['Nunito',sans-serif]">
        <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4 shadow-2xl" />
        <h2 className="text-3xl sm:text-5xl font-['Lilita_One',sans-serif] uppercase tracking-wide text-amber-300 drop-shadow-2xl">
          GENERATING CONUNDRUM...
        </h2>
      </div>
    );
  }

  // ERROR STATE
  if (error && !scenario) {
    return (
      <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white select-none font-['Nunito',sans-serif]">
        <AlertCircle className="w-14 h-14 text-rose-500 mb-3 animate-bounce" />
        <h2 className="text-2xl font-['Lilita_One',sans-serif] uppercase text-rose-400 mb-2">GENERATION ERROR</h2>
        <p className="text-xs text-slate-300 max-w-md font-mono bg-slate-900 p-3 rounded-2xl border border-slate-800 mb-4">
          {error}
        </p>
        <Button
          onClick={() => setViewState("CATEGORY_SELECT")}
          size="lg"
          className="h-12 px-6 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-full shadow-2xl"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          <span>BACK TO CATEGORIES</span>
        </Button>
      </div>
    );
  }

  const isPassed = evaluationResult?.passed !== false;
  const altSolutions = evaluationResult?.alternativeSolutions || [];

  return (
    <div className="fixed inset-0 z-50 w-screen h-[100dvh] flex flex-col justify-between p-3 sm:p-5 text-white overflow-hidden select-none bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-600 font-['Nunito',sans-serif]">
      
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-between items-center text-center space-y-2 relative h-full overflow-hidden">
        
        {/* DISCOVERY / CHAT SCREEN - HIGH-EFFICIENCY MOBILE LAYOUT */}
        {viewState === "DISCOVERY" && (
          <AnimatePresence mode="wait">
            <motion.div
              key="discovery"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-1 flex flex-col justify-between items-center w-full h-full space-y-2 py-1 overflow-hidden"
            >
              {/* COMPACT TOP HEADER */}
              <div className="flex items-center justify-between w-full shrink-0 z-30">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setViewState("CATEGORY_SELECT");
                  }}
                  className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 active:scale-95 backdrop-blur-md cursor-pointer transition-all border border-white/30 flex items-center justify-center text-white shrink-0 z-30 relative"
                >
                  <ArrowLeft className="w-5 h-5 text-white shrink-0" />
                </button>

                <span className="text-xs font-black uppercase text-amber-300 tracking-widest">
                  {questionsLeft} {questionsLeft === 1 ? "question" : "questions"} left
                </span>
              </div>

              {/* CHAT MESSAGES SCROLL AREA */}
              <div className="w-full flex-1 overflow-y-auto space-y-2.5 pr-1 select-text py-1 my-auto min-h-0">
                {qaHistory.map((msg, idx) => (
                  <motion.div
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${msg.sender === "player" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[92%] p-4 sm:p-5 rounded-3xl text-base sm:text-lg font-black leading-snug text-left shadow-xl ${
                        msg.sender === "player"
                          ? "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 rounded-br-none"
                          : "bg-white text-slate-950 rounded-bl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* COMPACT INPUT FORM & ACTION BUTTON */}
              <div className="w-full shrink-0 space-y-2 pt-1">
                <form onSubmit={handleAskQuestion} className="w-full flex gap-2">
                  <Input
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder={questionsLeft > 0 ? `Ask ${scenario.character} a question...` : "0 questions left. Tap SUBMIT SOLUTION!"}
                    disabled={askingQuestion || questionsLeft <= 0}
                    className="h-11 sm:h-12 bg-white/10 border border-white/20 rounded-full px-4 text-sm sm:text-base text-white placeholder:text-white/60 focus-visible:ring-amber-400 backdrop-blur-md font-bold"
                  />
                  <Button
                    type="submit"
                    disabled={askingQuestion || !questionInput.trim() || questionsLeft <= 0}
                    className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black shrink-0 flex items-center justify-center shadow-lg cursor-pointer"
                  >
                    {askingQuestion ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>

                <Button
                  onClick={() => { soundEffects.playClick(); setViewState("SOLUTION"); }}
                  size="lg"
                  className="w-full h-12 sm:h-13 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-['Lilita_One',sans-serif] text-lg sm:text-xl uppercase tracking-wider rounded-full shadow-xl flex items-center justify-center cursor-pointer border-none"
                >
                  <span>SUBMIT SOLUTION</span>
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* SOLUTION PITCH SCREEN */}
        {viewState === "SOLUTION" && (
          <AnimatePresence mode="wait">
            <motion.div
              key="solution"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-1 flex flex-col justify-between items-center w-full h-full space-y-3 py-1 overflow-hidden"
            >
              <div className="w-full flex items-start shrink-0">
                <button
                  type="button"
                  onClick={() => { soundEffects.playClick(); setViewState("DISCOVERY"); }}
                  className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 active:scale-95 backdrop-blur-md cursor-pointer transition-all border border-white/30 flex items-center justify-center text-white shrink-0 z-30 relative"
                >
                  <ArrowLeft className="w-5 h-5 text-white shrink-0" />
                </button>
              </div>

              <div className="text-center shrink-0">
                <h2 className="text-3xl sm:text-4xl font-['Lilita_One',sans-serif] uppercase text-white mb-0.5">
                  CONUNDRUM SOLUTION
                </h2>
                <p className="text-[11px] font-black text-amber-300">
                  How would you solve {scenario.character}'s conundrum?
                </p>
              </div>

              <div className="bg-white text-slate-950 p-5 rounded-3xl shadow-xl w-full text-left my-auto min-h-[160px] max-h-[240px] flex flex-col">
                <Textarea
                  value={pitchText}
                  onChange={(e) => setPitchText(e.target.value)}
                  placeholder={`Describe your solution to ${scenario.character}'s conundrum...`}
                  className="w-full h-full bg-transparent border-none p-1 text-xl sm:text-2xl font-extrabold text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 select-text resize-none leading-snug"
                />
              </div>

              <Button
                onClick={handleSubmitPitch}
                disabled={evaluating || !pitchText.trim()}
                size="lg"
                className="w-full h-12 sm:h-14 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-['Lilita_One',sans-serif] text-lg sm:text-xl uppercase tracking-wider rounded-full shadow-xl flex items-center justify-center cursor-pointer shrink-0 border-none"
              >
                {evaluating ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <span>SUBMIT SOLUTION</span>
                )}
              </Button>
            </motion.div>
          </AnimatePresence>
        )}

        {/* CONSOLIDATED OUTCOME SCREEN */}
        {viewState === "OUTCOME" && outcomeSubState === "FEEDBACK" && (
          <AnimatePresence mode="wait">
            <motion.div
              key="consolidated-outcome"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col justify-between items-center w-full h-full space-y-3 py-1 overflow-y-auto"
            >
              <div className="space-y-0.5 text-center shrink-0 pt-1">
                <div className="text-4xl sm:text-5xl mb-1 flex items-center justify-center">
                  {isPassed ? "🎉" : "💥"}
                </div>
                <h1 className="text-4xl sm:text-5xl font-['Lilita_One',sans-serif] uppercase tracking-wide text-amber-300 drop-shadow-2xl">
                  {isPassed ? "PURE GENIUS!" : "EPIC FAIL!"}
                </h1>
                <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-amber-300">
                  {isPassed ? "CONUNDRUM SOLVED!" : "TIME FOR PLAN B!"}
                </p>
              </div>

              {isPassed && (
                <div className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 p-4 rounded-2xl shadow-xl w-full flex items-center justify-between border-2 border-amber-300 shrink-0">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 shadow">
                      <Star className="w-6 h-6 fill-amber-400 text-amber-400 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-900">BADGE UNLOCKED</div>
                      <div className="text-xl sm:text-2xl font-['Lilita_One',sans-serif] uppercase text-slate-950">
                        {evaluationResult.badge || "The Lateral Thinker"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white text-slate-950 p-6 rounded-3xl shadow-xl text-xl sm:text-2xl font-extrabold leading-relaxed w-full text-left my-auto min-h-[140px] max-h-[260px] overflow-y-auto">
                {evaluationResult.feedback}
              </div>

              <div className="w-full space-y-2 shrink-0">
                {altSolutions.length > 0 && (
                  <Button
                    onClick={() => {
                      soundEffects.playClick();
                      setAltSolutionIndex(0);
                      setOutcomeSubState("OTHER_SOLUTIONS");
                    }}
                    size="lg"
                    className="w-full h-12 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-['Lilita_One',sans-serif] text-base uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-all cursor-pointer"
                  >
                    <span>💡</span>
                    <span>SEE OTHER CLEVER SOLUTIONS</span>
                  </Button>
                )}

                <Button
                  onClick={() => {
                    soundEffects.playClick();
                    setViewState("CATEGORY_SELECT");
                  }}
                  size="lg"
                  className="w-full h-12 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-['Lilita_One',sans-serif] text-base uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>PLAY AGAIN</span>
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* OUTCOME SCREEN: CAROUSEL */}
        {viewState === "OUTCOME" && outcomeSubState === "OTHER_SOLUTIONS" && (
          <AnimatePresence mode="wait">
            <motion.div
              key="other-solutions-carousel"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex flex-col justify-center items-center w-full h-full my-auto relative"
            >
              <div className="w-full flex items-center justify-between z-30 shrink-0 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setOutcomeSubState("FEEDBACK");
                  }}
                  className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 active:scale-95 backdrop-blur-md cursor-pointer transition-all border border-white/30 flex items-center justify-center text-white shrink-0 z-30 relative"
                >
                  <ArrowLeft className="w-5 h-5 text-white shrink-0" />
                </button>
                <span className="text-xs font-black uppercase text-amber-300 tracking-widest">
                  IDEA {altSolutionIndex + 1} OF {altSolutions.length}
                </span>
              </div>

              <div className="relative w-full my-auto flex items-center justify-center pt-2">
                <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 text-slate-950 p-5 rounded-3xl shadow-xl w-full text-center space-y-2 border-2 border-amber-300 mx-1 min-h-[280px] flex flex-col justify-between items-center">
                  
                  <div className="text-4xl mx-auto flex items-center justify-center">
                    💡
                  </div>

                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                    ALTERNATIVE SOLUTION #{altSolutionIndex + 1}
                  </div>
                  
                  <p className="text-xl sm:text-2xl font-['Lilita_One',sans-serif] uppercase leading-snug text-slate-950 my-auto flex-1 flex items-center justify-center">
                    "{altSolutions[altSolutionIndex]}"
                  </p>

                  {/* BOTTOM NAVIGATION STRIP WITH MINIMAL BLENDED ARROWS FLANKING PAGINATION DOTS */}
                  <div className="flex items-center justify-center gap-3 pt-2 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        setAltSolutionIndex((prev) => (prev > 0 ? prev - 1 : altSolutions.length - 1));
                      }}
                      className="w-8 h-8 rounded-full bg-slate-950/20 hover:bg-slate-950/40 text-slate-950 flex items-center justify-center transition-all active:scale-90 cursor-pointer border border-slate-950/10 shrink-0"
                    >
                      <ChevronLeft className="w-5 h-5 text-slate-950" />
                    </button>

                    <div className="flex items-center justify-center gap-2">
                      {altSolutions.map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          type="button"
                          onClick={() => {
                            soundEffects.playClick();
                            setAltSolutionIndex(dotIdx);
                          }}
                          className={`transition-all rounded-full ${
                            dotIdx === altSolutionIndex
                              ? "w-3.5 h-3.5 bg-slate-950 ring-2 ring-amber-300 scale-110"
                              : "w-2.5 h-2.5 bg-slate-950/30 hover:bg-slate-950/60"
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        setAltSolutionIndex((prev) => (prev < altSolutions.length - 1 ? prev + 1 : 0));
                      }}
                      className="w-8 h-8 rounded-full bg-slate-950/20 hover:bg-slate-950/40 text-slate-950 flex items-center justify-center transition-all active:scale-90 cursor-pointer border border-slate-950/10 shrink-0"
                    >
                      <ChevronRight className="w-5 h-5 text-slate-950" />
                    </button>
                  </div>

                </div>
              </div>

            </motion.div>
          </AnimatePresence>
        )}

      </div>
    </div>
  );
}
