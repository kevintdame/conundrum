import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// Bypass automatic Google Cloud Metadata checks on hosted VMs (like Render)
process.env.GCP_METADATA_HOST = '127.0.0.1';
process.env.GCE_METADATA_HOST = '127.0.0.1';
process.env.NO_GCE_CHECK = 'true';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
let ai = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.warn("⚠️ No GEMINI_API_KEY found in environment variables.");
}

// Load Sub-topics Dataset
let subTopics = {};
try {
  const dataPath = path.join(__dirname, 'sub_topics.json');
  if (fs.existsSync(dataPath)) {
    subTopics = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log("✅ Successfully loaded sub_topics.json");
  }
} catch (err) {
  console.error("⚠️ Failed to load sub_topics.json:", err.message);
}

function getRandomSubTopic(domain) {
  const topics = subTopics[domain];
  if (!topics || topics.length === 0) return null;
  const idx = Math.floor(Math.random() * topics.length);
  return topics[idx];
}

async function generateContentWithRetry(params) {
  if (!ai) {
    throw new Error("GEMINI_API_KEY is missing. Please set GEMINI_API_KEY in server environment.");
  }
  return await ai.models.generateContent(params);
}

// ----------------------------------------------------
// CONUNDRUM API ENDPOINTS
// ----------------------------------------------------

// 1. Instant Verified Conundrum Scenario Endpoint (Powered by Pro-Generated Bank)
app.post('/api/conundrum2/generate', async (req, res) => {
  try {
    const { mode, targetCategory } = req.body || {};
    const reqMode = (mode || "adults").toLowerCase();
    
    const bankPath = path.join(__dirname, 'conundrums_bank.json');
    let bank = [];
    if (fs.existsSync(bankPath)) {
      bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
    }

    // Filter bank by mode & category
    let matches = bank.filter(item => item.mode === reqMode && (!targetCategory || item.category === targetCategory));
    
    // Fallback 1: match mode only
    if (matches.length === 0) {
      matches = bank.filter(item => item.mode === reqMode);
    }

    // Fallback 2: return any item from bank
    if (matches.length === 0) {
      matches = bank;
    }

    if (matches.length === 0) {
      return res.status(500).json({ error: "No conundrum scenarios available in bank." });
    }

    const selected = matches[Math.floor(Math.random() * matches.length)];
    const scenario = {
      ...selected,
      id: `conundrum-${Date.now()}`
    };

    console.log(`⚡ [INSTANT BANK SERVED] Mode: ${scenario.mode} | Cat: ${scenario.category} | Title: "${scenario.title}"`);
    return res.json(scenario);
  } catch (err) {
    console.error("[CONUNDRUM GENERATION ERROR]:", err.message);
    return res.status(500).json({ error: `Failed to serve conundrum: ${err.message}` });
  }
});

// 2. Natural Q&A Probing Endpoint (Powered by gemini-3.6-flash using Pro Knowledge Base)
app.post('/api/conundrum2/ask', async (req, res) => {
  const { scenario, question } = req.body;
  if (!question) return res.status(400).json({ error: "Missing question" });

  const charName = scenario?.character || "Character";
  const persona = scenario?.customer_persona || scenario?.complaint || "";
  const internalContext = scenario?.customer_context || scenario?.complaint || "";

  const promptText = `You are roleplaying as "${charName}" in CONUNDRUM.

YOUR PUBLIC PERSONA: "${persona}"
YOUR INTERNAL SECRET LIFESTYLE & DILEMMA CONTEXT:
"${internalContext}"

PLAYER'S MESSAGE TO YOU:
"${question}"

YOUR IMPROV & SERENDIPITY POSTURE:
1. Embrace the player's curiosity with an enthusiastic "Yes, And..." improv mindset!
2. When the player asks an unexpected, creative, or unusual question, lean fully into your world's physical environment and habits.
3. Reveal surprising, delightful, or funny quirks about your surroundings, items, routine, or habits that spark fresh lateral thinking ideas for the player.
4. Keep your tone warm, playful, witty, and expressive as a collaborative partner in solving this conundrum!
5. IF THE PLAYER PROPOSES A NEW IDEA OR FIX IN THEIR QUESTION, respond warmly and playfully:
   "Ooh, that sounds like a clever new idea! Tap the SUBMIT SOLUTION button below so we can officially test it out!"

Return JSON ONLY:
{
  "answer": "Enthusiastic, playful 1-2 sentence improv response that sparks new creative ideas"
}`;

  try {
    const response = await generateContentWithRetry({
      model: 'gemini-3.6-flash',
      contents: promptText,
      config: {
        temperature: 0.7,
        responseMimeType: 'application/json'
      }
    });

    const text = typeof response?.text === 'function' ? response.text() : response?.candidates?.[0]?.content?.parts?.[0]?.text;
    let cleanText = text ? text.trim() : "";
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    const parsed = JSON.parse(jsonMatch[0]);

    return res.json({ answer: parsed.answer });
  } catch (err) {
    console.error("[CONUNDRUM ASK ERROR]:", err.message);
    return res.status(500).json({ error: `Failed to answer question: ${err.message}` });
  }
});

// 3. Evaluation Endpoint
app.post('/api/conundrum2/evaluate', async (req, res) => {
  const { scenario, solutionText, mode } = req.body;
  if (!solutionText) return res.status(400).json({ error: "Missing solutionText" });

  const charName = scenario?.character || "Character";
  const complaint = scenario?.complaint || "";
  const isKidsMode = mode === "kids" || scenario?.mode === "kids";

  const modeInstruction = isKidsMode
    ? `KIDS MODE ENFORCEMENT (Ages 8-12):
       - Write feedback in enthusiastic, simple, 4th-grade level English.
       - "alternativeSolutions": Write 3 short, super simple, clever 1-sentence fixes using 4th-grade words!`
    : `ADULTS MODE ENFORCEMENT (Ages 13+):
       - Write feedback in witty, clever, human-centered language.
       - "alternativeSolutions": Write 3 clever, practical alternative design thinking solution paths.`;

  const promptText = `You are evaluating a player's proposed solution in CONUNDRUM.

Character: "${charName}"
Problem: "${complaint}"
${modeInstruction}

PLAYER'S PROPOSED SOLUTION PITCH:
"${solutionText}"

SYSTEMIC EVALUATION PRINCIPLE — HUMAN-CENTERED PRAGMATISM:
- Evaluate the solution with an empathic, practical mindset.
- If a solution represents a plausible, real-world human attempt that reduces or addresses the core problem (whether simple or creative), IT MUST PASS (passed: true).
- Before marking any solution as failed, ask yourself: "Is this a reasonable approach an everyday person or child would try?" If yes, mark passed: true!
- DO NOT reject solutions with nitpicky micro-physics objections. Reserve passed: false ONLY for solutions that are harmful, nonsensical, or completely ignore the character's problem.

EVALUATE AGAINST THESE 3 PASS/FAIL CRITERIA:
1. Need Fulfilled: Does it solve or help reduce the character's primary pain point?
2. Empathy Preserved: Does it respect the motivations and feelings of all involved parties/animals without using cruel or force-based measures?
3. Plausibility: Is it logically sound within a creative/everyday context?

IF ALL 3 CRITERIA PASS (passed: true):
- Pick a Badge from: "The Minimalist", "The Lateral Thinker", "The Architect", "The Behavioral Specialist", "The Community Hero".
- Generate 3 clever alternative solution paths strictly adhering to the Mode Enforcement above.
- Write a warm 1-2 sentence character thank-you response.

IF ANY CRITERION FAILS (passed: false):
- Explain gently in character voice WHICH criterion was violated and invite them to tweak their solution.
- Generate 3 clever alternative solution paths strictly adhering to the Mode Enforcement above.

Return JSON ONLY:
{
  "passed": true,
  "criteriaResults": {
    "needFulfilled": true,
    "empathyPreserved": true,
    "plausibility": true
  },
  "feedback": "Warm in-character response celebrating their idea!",
  "badge": "Badge Name",
  "alternativeSolutions": [
    "Simple solution path 1",
    "Simple solution path 2",
    "Simple solution path 3"
  ]
}`;

  try {
    const response = await generateContentWithRetry({
      model: 'gemini-3.6-flash',
      contents: promptText,
      config: {
        temperature: 0.5,
        responseMimeType: 'application/json'
      }
    });

    const text = typeof response?.text === 'function' ? response.text() : response?.candidates?.[0]?.content?.parts?.[0]?.text;
    let cleanText = text ? text.trim() : "";
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    const parsed = JSON.parse(jsonMatch[0]);

    return res.json(parsed);
  } catch (err) {
    console.error("[CONUNDRUM EVALUATION ERROR]:", err.message);
    return res.status(500).json({ error: `Failed to evaluate solution: ${err.message}` });
  }
});

// Serve Static Assets in Production
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Conundrum Server running on port ${PORT}`);
});
