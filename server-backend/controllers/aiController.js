const Anthropic = require("@anthropic-ai/sdk");
const User = require("../models/User");

const MODEL = process.env.AI_MODEL || "claude-haiku-5-5";

// Register form ki specializations se match karti hain
const DEPARTMENTS = [
    "General Medicine", "Cardiology", "Dermatology", "Neurology", "Orthopedics",
    "Pediatrics", "Gynecology", "ENT", "Psychiatry", "Dentistry",
];

/* ---------- Client (key na ho to server crash nahi hoga) ---------- */
let client;
function getClient() {
    if (!process.env.ANTHROPIC_API_KEY) {
        const e = new Error("ANTHROPIC_API_KEY missing");
        e.code = "NO_KEY";
        throw e;
    }
    if (!client) {
        const Ctor = Anthropic.default || Anthropic;
        client = new Ctor({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return client;
}

async function ask({ system, messages, max_tokens = 500 }) {
    const res = await getClient().messages.create({ model: MODEL, max_tokens, system, messages });
    return res.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
}

/* ---------- Fallback: AI na chale (key/credits/limit) to bhi app kaam kare ---------- */
// Leading space wale words (" ear", " bp") poore shabd ki shuruat match karte hain,
// taaki "heart" mein "ear" ya "hypertension" mein "tension" na pakda jaye.
const KEYWORDS = {
    Cardiology: ["heart", "dil ", "palpitation", "blood pressure", " bp", "cholesterol"],
    Neurology: ["headache", "migraine", "sar dard", "sir dard", "dizz", "chakkar", "numb", "memory"],
    Orthopedics: ["knee", "back pain", "kamar", "joint", "jodo", "fracture", "bone", "haddi", "shoulder", "ghutn", "muscle"],
    Dermatology: ["skin", "rash", "itch", "khujli", "acne", "pimple", " hair", "baal", "allergy"],
    Pediatrics: ["child", "baby", "bachch", "bacha", "infant", "toddler"],
    Gynecology: ["period", "pregnan", "menstrual", "pcos", "garbh"],
    ENT: [" ear", "kaan", "throat", "gala", " nose", "naak", "sinus", "tonsil", "hearing"],
    Psychiatry: ["anxiety", "depress", "stress", " tension", "sleep", "neend", "panic", "mood"],
    Dentistry: ["tooth", "teeth", "dant", " gum", "cavity"],
};

function ruleBasedDepartment(text = "") {
    const t = ` ${text.toLowerCase()} `;
    let best = "General Medicine";
    let bestScore = 0;
    for (const [dept, words] of Object.entries(KEYWORDS)) {
        const score = words.filter((w) => t.includes(w)).length;
        if (score > bestScore) {
            best = dept;
            bestScore = score;
        }
    }
    return best;
}

/* ---------- Safety: emergency detection (AI tak bheje bina) ---------- */
const EMERGENCY = [
    /chest\s*(pain|pressure|tight)/i,
    /seene\s*(mein|me)\s*(dard|jakdan)/i,
    /can'?t\s*breathe|difficulty\s*breathing|short(ness)?\s*of\s*breath|saans\s*(nahi|nhi|lene)/i,
    /stroke|face\s*droop|slurred\s*speech|sudden\s*weakness|lakwa/i,
    /severe\s*bleeding|bleeding\s*(heavily|a\s*lot)|bahut\s*khoon/i,
    /unconscious|passed\s*out|unresponsive|seizure|behosh|daura\s*pad/i,
    /overdose|poison|zeher\s*kha/i,
    /anaphyla|throat\s*(closing|swelling)/i,
];
const SELF_HARM =
    /suicid|kill\s*myself|end\s*my\s*life|self[-\s]*harm|marna\s*chah|jaan\s*de(na|ne)|khud\s*ko\s*(khatam|nuksan)/i;

const EMERGENCY_REPLY =
    "This may be a medical emergency. Please call 112 or 108 (ambulance), or go to the nearest emergency department right now. Do not wait for an appointment.\n\nYeh emergency ho sakti hai. Turant 112 ya 108 par call karein, ya najdeeki hospital ke emergency mein jaayein.";

const SELF_HARM_REPLY =
    "I'm really sorry you're going through this, and I'm glad you said it. You don't have to handle it alone. Please talk to someone right now: call 112 if you are in immediate danger, or call Tele-MANAS at 14416 (free, 24x7). If someone is near you, please tell them how you feel.\n\nAap akele nahi hain. Abhi kisi apne se baat karein, ya Tele-MANAS 14416 par call karein. Agar turant khatra hai to 112 par call karein.";

function safetyReply(text = "") {
    if (SELF_HARM.test(text)) return SELF_HARM_REPLY;
    if (EMERGENCY.some((p) => p.test(text))) return EMERGENCY_REPLY;
    return null;
}

/* ---------- 1. Chat ---------- */
const CHAT_SYSTEM = `You are SmartCare AI, a friendly assistant inside a hospital's patient portal in India.

You can: give general health information, explain what to expect at an appointment, suggest which department to visit, and explain the portal (book appointments on the Appointments page, see prescriptions and reports in Medical records, update details in My profile).

Rules:
- Never diagnose. Never prescribe medicines or give dosages. Share general information only and say a doctor must examine the patient for a real diagnosis.
- For symptoms, ask at most one or two short follow-up questions, then suggest a suitable department from this list: ${DEPARTMENTS.join(", ")}. Invite the patient to book an appointment.
- If something sounds serious or is getting worse, tell the patient to see a doctor soon, or call 112 / 108 for an emergency.
- Reply in the same language the patient writes in (English, Hindi or Hinglish).
- Keep answers short (under 120 words), warm and in plain text only. No markdown, no asterisks, no headings.
- Politely decline topics unrelated to health or this hospital.
- Do not ask for the patient's full name, phone number, address or ID.`;

exports.chat = async (req, res) => {
    try {
        const { messages } = req.body;
        if (!Array.isArray(messages) || messages.length === 0)
            return res.status(400).json({ message: "Message likho" });

        let history = messages
            .slice(-12)
            .map((m) => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: String(m.content || "").slice(0, 1500),
            }))
            .filter((m) => m.content.trim());

        while (history.length && history[0].role !== "user") history.shift();
        if (!history.length || history[history.length - 1].role !== "user")
            return res.status(400).json({ message: "Last message user ka hona chahiye" });

        const lastText = history[history.length - 1].content;

        // Emergency ho to AI ko bheje bina turant jawab
        const safety = safetyReply(lastText);
        if (safety) return res.json({ reply: safety, emergency: true });

        let reply;
        try {
            reply = await ask({ system: CHAT_SYSTEM, messages: history });
        } catch (err) {
            // Key/credits/limit/network, kuch bhi ho: app band na ho
            console.warn("AI chat fallback:", err.status || err.code, err.message);
            const dept = ruleBasedDepartment(lastText);
            reply =
                `The AI chat is not available right now, but based on what you wrote, ${dept} looks like a good department to start with. ` +
                `You can use the "Find a doctor" tab or book an appointment directly. In an emergency call 112 or 108.\n\n` +
                `AI chat abhi available nahi hai. Aapke bataye hisaab se ${dept} department sahi rahega. "Find a doctor" tab use karein ya appointment book karein.`;
        }

        res.json({ reply, emergency: false });
    } catch (err) {
        console.error("Chat error:", err);
        res.status(500).json({ message: "Kuch gadbad ho gayi. Dobara try karo." });
    }
};

/* ---------- 2. Find a doctor ---------- */
const DEPT_SYSTEM = `You route patients to hospital departments. Choose ONLY from: ${DEPARTMENTS.join(", ")}.
Reply with JSON only, no markdown:
{"department": string, "urgency": "routine" | "soon" | "urgent", "reasoning": string (max 2 short sentences, in the same language as the symptoms), "alternatives": string[] (0 to 2 other departments)}`;

function parseJSON(text) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI ne JSON nahi diya");
    return JSON.parse(match[0]);
}

exports.suggestDoctor = async (req, res) => {
    try {
        const { symptoms, age } = req.body;
        if (!symptoms || String(symptoms).trim().length < 3)
            return res.status(400).json({ message: "Symptoms likho" });

        const safety = safetyReply(String(symptoms));
        if (safety) return res.json({ emergency: true, reply: safety });

        let result;
        try {
            const text = await ask({
                system: DEPT_SYSTEM,
                max_tokens: 350,
                messages: [
                    {
                        role: "user",
                        content: `Age: ${age ? Number(age) : "unknown"}\nSymptoms: ${String(symptoms).slice(0, 1000)}`,
                    },
                ],
            });
            result = parseJSON(text);
        } catch (err) {
            // AI na chale ya JSON kharab aaye: keywords se department
            console.warn("AI department fallback:", err.status || err.code, err.message);
            result = {
                department: ruleBasedDepartment(String(symptoms)),
                urgency: "routine",
                reasoning:
                    "Suggested from keywords in your symptoms. A doctor will examine you for a proper diagnosis.",
                alternatives: [],
            };
        }

        if (!DEPARTMENTS.includes(result.department)) result.department = "General Medicine";
        if (!["routine", "soon", "urgent"].includes(result.urgency)) result.urgency = "routine";
        result.alternatives = (result.alternatives || []).filter((d) => DEPARTMENTS.includes(d));

        // Us department ke approved doctors aapke database se
        const doctors = await User.find({
            role: "doctor",
            isApproved: true,
            specialization: result.department,
        })
            .select("name specialization experience")
            .limit(6);

        res.json({ ...result, doctors, emergency: false });
    } catch (err) {
        console.error("Department error:", err);
        res.status(500).json({ message: "Kuch gadbad ho gayi. Dobara try karo." });
    }
};