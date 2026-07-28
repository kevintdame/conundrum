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

// 1. Generation Endpoint
app.post('/api/conundrum2/generate', async (req, res) => {
  try {
    const { mode, targetCategory } = req.body || {};
  const isKidsMode = mode === "kids";
  const categoryName = targetCategory || (isKidsMode ? "Food & Snacks" : "Food & Cooking");

  const domainMap = {
    "Food & Snacks": "Food & Cooking",
    "Food & Cooking": "Food & Cooking",
    "Pets & Animals": "Health & Wellness",
    "Health & Wellness": "Health & Wellness",
    "Toys & Games": "Entertainment & Gaming",
    "Entertainment & Gaming": "Entertainment & Gaming",
    "Arts & Crafts": "Education",
    "Education & Learning": "Education",
    "Outdoors & Playground": "Travel & Mobility",
    "Travel & Mobility": "Travel & Mobility",
    "School & Cartoons": "Education",
    "Finance & Budgeting": "Work & Productivity",
    "Inventions & Gadgets": "Work & Productivity",
    "Work & Productivity": "Work & Productivity",
    "Music & Dancing": "Entertainment & Gaming",
    "Environment & Plants": "Sustainability"
  };

  const domain = domainMap[categoryName] || "Food & Cooking";
  const selectedSubTopic = getRandomSubTopic(domain) || "ice cream melting sticky on hands";
  const NAME_POOL = [
    "Maya", "Zoe", "Mia", "Ella", "Chloe", "Ruby", "Lily", "Ivy", "Sophia", "Aria", "Emma", "Nora",
    "Sammy", "Max", "Ben", "Kai", "Finn", "Eli", "Jack", "Owen", "Mason", "Ethan", "Noah", "Toby",
    "Jasper", "Oliver", "Ezra", "Milo", "Sora", "Devon", "Cora", "Nico", "Felix", "Amara", "Hugo",
    "Gemma", "Kobe", "Rory", "Shiloh", "Rowan", "Skyler", "Priya", "Lucas", "Caleb", "Liam", "Mateo"
  ];
  const PET_NAME_POOL = [
    "Buster", "Biscuit", "Ziggy", "Pippin", "Otis", "Clover", "Waffles", "Mochi", "Peanut", "Bean",
    "Archie", "Cooper", "Rosie", "Bruno", "Teddy", "Gizmo", "Jasper", "Chewie", "Noodle", "Spud",
    "Cleo", "Milo", "Banjo", "Pepper", "Copper", "Ziggy", "Oreo", "Bandit", "Shadow", "Pebbles",
    "Taco", "Nugget", "Fifi", "Ziggy", "Pip", "Bubbles", "Pickles", "Moose", "Trixie", "Goose"
  ];
  const assignedName = NAME_POOL[Math.floor(Math.random() * NAME_POOL.length)];
  const assignedPetName = PET_NAME_POOL[Math.floor(Math.random() * PET_NAME_POOL.length)];
  const randomSeed = Math.floor(Math.random() * 1000000);

  const modeInstruction = isKidsMode
    ? `MODE: KIDS MODE (Ages 8-12) - EASY DIFFICULTY MATRIX: Create a fun kid character named "${assignedName}" with 1 simple physical barrier solvable in 1 direct physical action.`
    : `MODE: ADULTS MODE (Ages 13+) - CHALLENGING DIFFICULTY MATRIX: Create a clever adult character named "${assignedName}" with a multi-variable trade-off requiring 2-3 logical steps.`;

  const promptText = `You are the Master Puzzle Designer for CONUNDRUM.

[RANDOM SEED: ${randomSeed}]
${modeInstruction}

3-INGREDIENT FORMULAIC ARCHITECTURE:
1. CHARACTER: Named "${assignedName}" with a specific grounded role.
2. SITUATION / CONTEXT: A specific physical setting or activity.
3. CONUNDRUM TYPE: Select 1 specific friction type from: Tool Mismatch, Material Fragility, Grip Slippage, Mess Contamination, Weight Strain, Container Overflow, Tangle Interlocking, Component Jamming, Small Object Loss, Thermal Change, Weather Exposure, Unintended Side Effect, Shared Space, Pet Interference, Disruption Avoidance, Multitasking Overflow.

STRICT DOMAIN COHERENCE CONSTRAINT:
- The character's role, physical setting, tools, and problem MUST ALL BELONG TO THE EXACT SAME REAL-WORLD DOMAIN.
- ABSOLUTELY NEVER mix software engineering / agile methodologies (sprints, standups, Kanban, virtual sticky notes) into non-tech professions (book editing, baking, teaching, gardening, painting)!

MANDATORY CHARACTER NAME CONSTRAINT:
- The character's first name MUST BE EXACTLY: "${assignedName}". Do NOT change or replace this name!

PARAMETER CONSTRAINTS:
- Category: ${categoryName}
- Grounded Sub-Topic: ${selectedSubTopic}
- Character Name: "${assignedName}"
- Pet Name Constraint: If a pet (dog, cat, bunny, parrot, hamster, etc.) is involved in this scenario, the pet's name MUST BE EXACTLY: "${assignedPetName}". ABSOLUTELY NEVER use "Barnaby"!

JSON OUTPUT SCHEMA (Return JSON ONLY):
{
  "id": "conundrum-${Date.now()}",
  "mode": "${isKidsMode ? 'kids' : 'adults'}",
  "category": "${categoryName}",
  "character": "${assignedName}",
  "characterType": "1-2 word role",
  "setting": "Cozy Location",
  "title": "Short Punchy Title",
  "complaint": "Hi! I'm ${assignedName}. [1-2 short, vivid, 1st-person sentences describing the conundrum clearly]",
  "conundrumType": "Selected Friction Type",
  "customer_persona": "1 neutral high-level intro sentence about who they are",
  "customer_context": "Hidden internal details about their daily routine, environment, emotional preferences, and core motivations that player discovers through Q&A",
  "hiddenConstraints": [
    { "id": 1, "topic": "Routine/Environment", "summary": "Plain-language summary of environment or timing", "unlocked": false },
    { "id": 2, "topic": "Sensory/Personal Preference", "summary": "Plain-language summary of what they love or dislike", "unlocked": false },
    { "id": 3, "topic": "Core Motivation", "summary": "Plain-language summary of what they care about most", "unlocked": false }
  ]
}`;

    let finalScenario = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && !finalScenario) {
      attempts++;
      const response = await generateContentWithRetry({
        model: 'gemini-3.6-pro',
        contents: promptText,
        config: {
          temperature: 0.95,
          responseMimeType: 'application/json'
        }
      });

      const text = typeof response?.text === 'function' ? response.text() : response?.candidates?.[0]?.content?.parts?.[0]?.text;
      let cleanText = text ? text.trim() : "";
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) continue;
      const parsed = JSON.parse(jsonMatch[0]);

      // 🕵️ 2-AGENT INSPECTOR / CRITIC PASS: Audit logic & real-world feasibility
      const inspectorPrompt = `You are the Chief Logic & Feasibility Inspector for the puzzle game CONUNDRUM.

Your job is to strictly audit a candidate scenario for real-world logic, internal coherence, and physical plausibility.

CANDIDATE SCENARIO:
Title: "${parsed.title}"
Character: "${parsed.character}" (${parsed.characterType})
Complaint: "${parsed.complaint}"
Conundrum Type: "${parsed.conundrumType}"

CRITICAL REJECTION CRITERIA (Set "passed": false if ANY apply):
1. LOGICAL CONTRADICTION: The scenario contains absurd or contradictory logic (e.g. claiming pets can't sleep at night because daytime office lights don't dim during work hours, or claiming paper burns from room light).
2. PSEUDO-SCIENCE / FAKE PROBLEM: The problem is an artificial or fake dilemma that wouldn't actually be a problem in real life.
3. DOMAIN MISMATCH: Mismatched profession and tools (e.g. software sprints mixed into book editing).
4. CONFUSING PREMISE: The situation is hard for a normal person to picture in 3 seconds.

Return JSON ONLY:
{
  "passed": true,
  "reason": "Clear 1-sentence reason why it passed or failed"
}`;

      try {
        const inspectRes = await generateContentWithRetry({
          model: 'gemini-3.6-pro',
          contents: inspectorPrompt,
          config: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        });

        const inspectText = typeof inspectRes?.text === 'function' ? inspectRes.text() : inspectRes?.candidates?.[0]?.content?.parts?.[0]?.text;
        const inspectMatch = inspectText ? inspectText.match(/\{[\s\S]*\}/) : null;
        const inspectJson = inspectMatch ? JSON.parse(inspectMatch[0]) : { passed: true };

        if (inspectJson.passed) {
          console.log(`✅ [2-AGENT INSPECTOR PASSED Attempt ${attempts}] "${parsed.title}": ${inspectJson.reason || 'Logically sound'}`);
          finalScenario = parsed;
        } else {
          console.warn(`⚠️ [2-AGENT INSPECTOR REJECTED Attempt ${attempts}] "${parsed.title}": ${inspectJson.reason}`);
        }
      } catch (inspectErr) {
        console.warn("Inspector pass bypassed on error, accepting candidate:", inspectErr.message);
        finalScenario = parsed;
      }
    }

    if (!finalScenario) throw new Error("Failed to generate a verified logical scenario.");

    console.log(`[CONUNDRUM ENGINE VERIFIED] Mode: ${finalScenario.mode} | Character: ${finalScenario.character}`);
    return res.json(finalScenario);
  } catch (err) {
    console.error("[CONUNDRUM GENERATION ERROR]:", err.message);
    return res.status(500).json({ error: `Failed to generate conundrum: ${err.message}` });
  }
});

// 2. Q&A Probing Endpoint
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
      model: 'gemini-3.6-pro',
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
