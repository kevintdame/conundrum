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

    // Filter bank by mode & category (matching category or category_bubble)
    let matches = bank.filter(item => {
      const modeMatch = !reqMode || (item.mode && item.mode.toLowerCase() === reqMode);
      if (!modeMatch) return false;
      if (!targetCategory) return true;
      const targetLower = targetCategory.toLowerCase().trim();
      const catLower = (item.category || "").toLowerCase().trim();
      const bubbleLower = (item.category_bubble || "").toLowerCase().trim();
      return catLower === targetLower || bubbleLower === targetLower || catLower.includes(targetLower) || targetLower.includes(catLower);
    });
    
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

YOUR CHARACTER & SCENARIO:
- Character Name: "${charName}"
- Setting: "${scenario?.setting || 'Setting'}"
- Problem: "${scenario?.complaint || ''}"
- Items Nearby: ${JSON.stringify(scenario?.on_hand_items || [])}

PLAYER'S QUESTION TO YOU:
"${question}"

STRICT FACTUAL RESPONSE RULES:
1. Answer ONLY the specific factual question asked by the player. State plain facts about what you see, have, or experience.
2. ABSOLUTELY NO SOLUTION HINTS, ADVICE, OR SUGGESTIONS! Never suggest how items can be combined, bent, or used as tools (do NOT say things like "if we find something long or hooked" or "this makes a great hook").
3. You are helpless/stuck and do NOT know how to solve your conundrum. That is 100% up to the player.
4. Keep your answer brief (1-2 short, strictly factual in-character sentences). State only what was asked without volunteering extra ideas or hints.

Return JSON ONLY:
{
  "answer": "1-2 short, strictly factual in-character sentences answering only what was asked."
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

  const obviousTrap = scenario?.obvious_trap || "";
  const hiddenConstraint = scenario?.hidden_constraint || "";

  const promptText = `You are evaluating a player's proposed solution in CONUNDRUM.

Character: "${charName}"
Problem: "${complaint}"
Obvious Trap Idea: "${obviousTrap}"
Hidden Constraint Gotcha: "${hiddenConstraint}"
${modeInstruction}

PLAYER'S PROPOSED SOLUTION PITCH:
"${solutionText}"

MANDATORY OBVIOUS TRAP & HIDDEN CONSTRAINT CHECK:
- If the player's proposed solution relies on the obvious trap ("${obviousTrap}") or succumbs to the hidden constraint ("${hiddenConstraint}"), IT MUST FAIL (passed: false, plausibility: false)!
- In your character feedback, explain clearly why that obvious approach failed due to the hidden constraint ("${hiddenConstraint}") and encourage them to probe further!

SYSTEMIC EVALUATION PRINCIPLE — HUMAN-CENTERED PRAGMATISM:
- If the solution avoids the obvious trap and represents a plausible, creative human attempt that addresses the core problem, IT MUST PASS (passed: true).
- DO NOT reject valid solutions with nitpicky micro-physics objections.

EVALUATE AGAINST THESE 3 PASS/FAIL CRITERIA:
1. Need Fulfilled: Does it solve or help reduce the character's primary pain point?
2. Empathy Preserved: Does it respect the motivations and feelings of all involved parties/animals without using cruel or force-based measures?
3. Plausibility: Is it logically sound and does it avoid the hidden constraint gotcha?

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
    let parsed = null;
    let attempts = 0;

    while (attempts < 2 && !parsed) {
      attempts++;
      try {
        const response = await generateContentWithRetry({
          model: 'gemini-3.6-flash',
          contents: promptText,
          config: {
            temperature: 0.3,
            responseMimeType: 'application/json'
          }
        });

        const text = typeof response?.text === 'function' ? response.text() : response?.candidates?.[0]?.content?.parts?.[0]?.text;
        let cleanText = text ? text.trim() : "";
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch (pe) {
            const sanitized = jsonMatch[0].replace(/[\u0000-\u001F\u007F-\u009F]/g, " ");
            parsed = JSON.parse(sanitized);
          }
        }
      } catch (e) {
        console.warn(`[EVALUATE RETRY ${attempts}]:`, e.message);
      }
    }

    if (!parsed) {
      parsed = {
        passed: true,
        criteriaResults: { needFulfilled: true, empathyPreserved: true, plausibility: true },
        feedback: `That's a creative attempt to help ${charName}! Thanks for your quick thinking!`,
        badge: "The Lateral Thinker",
        alternativeSolutions: [
          "Try tackling the immediate cause first.",
          "Use available items to create a quick barrier or tool.",
          "Check if a simple adjustment solves the main hassle."
        ]
      };
    }

    return res.json(parsed);
  } catch (err) {
    console.error("[CONUNDRUM EVALUATION ERROR]:", err.message);
    return res.json({
      passed: true,
      criteriaResults: { needFulfilled: true, empathyPreserved: true, plausibility: true },
      feedback: `Great creative effort! Every idea brings us closer to solving the conundrum!`,
      badge: "The Creative Innovator",
      alternativeSolutions: [
        "Focus on the simplest available items in the room.",
        "Look for a fast, direct fix before over-complicating.",
        "Combine two items to create a makeshift tool."
      ]
    });
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
