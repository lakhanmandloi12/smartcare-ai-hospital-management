import { useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

/* =====================================================
   Local "AI": keyword based, koi server ya API key nahi
===================================================== */

const GREETING =
    "Hello! I can suggest a department for symptoms, point you to the right page in this system and share quick hospital workflow tips. I cannot diagnose or suggest medicines.";

const SUGGESTIONS = [
    "Which department for knee pain?",
    "How do I approve a doctor?",
    "How can we reduce appointment no-shows?",
    "Mujhe sar dard rehta hai",
];

const HINGLISH =
    /\b(hai|hain|mujhe|mera|meri|kya|kaise|kaun|nahi|nhi|karo|kare|karna|dard|bukhar|batao|chahiye|hoga|mein|kyu|kyun|aap|tum)\b/i;

// Departments aur unke keywords (leading space = shabd ki shuruat)
const DEPARTMENTS = {
    Cardiology: ["heart", "dil ", "palpitation", "blood pressure", " bp", "cholesterol"],
    Neurology: ["headache", "migraine", "sar dard", "sir dard", "dizz", "chakkar", "numb", "memory"],
    Orthopedics: ["knee", "back pain", "kamar", "joint", "jodo", "fracture", "bone", "haddi", "shoulder", "ghutn", "muscle"],
    Dermatology: ["skin", "rash", "itch", "khujli", "acne", "pimple", " hair", "baal", "allergy"],
    Pediatrics: ["child", "baby", "bachch", "bacha", "infant", "toddler"],
    Gynecology: ["period", "pregnan", "menstrual", "pcos", "garbh"],
    ENT: [" ear", "kaan", "throat", "gala", " nose", "naak", "sinus", "tonsil", "hearing"],
    Psychiatry: ["anxiety", "depress", "stress", " tension", "sleep", "neend", "panic", "mood"],
    Dentistry: ["tooth", "teeth", "dant", " gum", "cavity"],
    "General Medicine": ["fever", "bukhar", "cold", "cough", "khansi", "body ache", "weakness", "kamzori", "vomit", "ulti", "stomach", "pet "],
};

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

const EMERGENCY_REPLY = {
    en: "This may be a medical emergency. Please call 112 or 108 (ambulance), or go to the nearest emergency department right now. Do not wait for an appointment.",
    hi: "Yeh emergency ho sakti hai. Turant 112 ya 108 par call karein, ya najdeeki hospital ke emergency mein jaayein. Appointment ka intezaar na karein.",
};

const SELF_HARM_REPLY = {
    en: "I'm really sorry you're going through this. You don't have to handle it alone. Please call Tele-MANAS at 14416 (free, 24x7), or 112 if you are in immediate danger. If someone is near you, please tell them how you feel.",
    hi: "Aap akele nahi hain. Abhi kisi apne se baat karein, ya Tele-MANAS 14416 par call karein (free, 24x7). Agar turant khatra hai to 112 par call karein.",
};

// Normal baatein: pehla match jeet jata hai
const INTENTS = [
    {
        test: /\b(hi|hello|hey|namaste|namaskar)\b/i,
        en: "Hello! Tell me your symptoms and I will suggest a department, or ask me where to find something in this system.",
        hi: "Namaste! Apne symptoms batayein to main department suggest karunga, ya poochein ki system mein kya kahan milega.",
    },
    {
        test: /\b(thanks|thank you|thx|shukriya|dhanyavad)\b/i,
        en: "You're welcome! Let me know if you need anything else.",
        hi: "Aapka swagat hai! Kuch aur chahiye to poochhiye.",
    },
    {
        test: /\b(bye|goodbye|alvida)\b/i,
        en: "Take care! I'm here whenever you need me.",
        hi: "Apna khayal rakhein! Zaroorat ho to main yahin hu.",
    },
    {
        test: /(what can you do|help|madad|kya kar sakte|kya kar sakta)/i,
        en: "I can: (1) suggest a department for symptoms, (2) tell you which page to use (Patients, Doctors, Appointments, Records, Prescriptions, Billing), and (3) share short workflow tips. I cannot diagnose or prescribe.",
        hi: "Main kar sakta hu: (1) symptoms ke hisaab se department batana, (2) batana ki kaunsa page use karna hai (Patients, Doctors, Appointments, Records, Prescriptions, Billing), (3) chhote workflow tips. Main diagnose ya dawai nahi bata sakta.",
    },
    {
        test: /(approve|approval|pending).*(doctor)|doctor.*(approve|approval|pending)|add.*doctor/i,
        en: "Open the Doctors page. At the top you will see 'Pending doctor approvals' with their specialization and license number. Press Approve to let a doctor sign in, or Reject to remove the request.",
        hi: "Doctors page kholein. Upar 'Pending doctor approvals' mein specialization aur license number dikhega. Approve dabane par doctor login kar payega, Reject dabane par request hat jayegi.",
    },
    {
        test: /no[- ]?show|missed appointment|cancel(lation)?s?\b.*(reduce|kam)|(reduce|kam).*(no[- ]?show|cancel)/i,
        en: "To reduce no-shows: send a reminder 1 day before, allow easy rescheduling, keep slots short, and track which departments miss the most. Review the Appointments page weekly for patterns.",
        hi: "No-show kam karne ke liye: 1 din pehle reminder bhejein, reschedule aasan rakhein, slots chhote rakhein, aur dekhein kaunse department mein sabse zyada miss hota hai. Appointments page har hafte check karein.",
    },
    {
        test: /billing|bill\b|invoice|payment|paisa|fees?\b/i,
        en: "Use the Billing page for invoices and payments. Tip: keep consultation fees fixed per doctor and share the bill with the patient right after the visit.",
        hi: "Invoices aur payments ke liye Billing page use karein. Tip: har doctor ki consultation fees fixed rakhein aur visit ke turant baad bill patient ko dein.",
    },
    {
        test: /appointment|booking|book\b|schedule|slot/i,
        en: "Appointments are on the Appointments page, where you can filter by status and check each doctor's schedule. Patients book from their own portal.",
        hi: "Appointments, Appointments page par hain, wahan status se filter kar sakte hain aur doctor ka schedule dekh sakte hain. Patients apne portal se book karte hain.",
    },
    {
        test: /prescription|medicine|dawai|dawa\b/i,
        en: "Prescriptions are listed on the Prescriptions page. I cannot suggest medicines or dosages. Those must be decided by a qualified doctor.",
        hi: "Prescriptions, Prescriptions page par hain. Main dawai ya dose nahi bata sakta, wo qualified doctor hi tay karta hai.",
    },
    {
        test: /record|report|history|summary/i,
        en: "Patient reports and history are in Medical records. Keep entries dated and short so doctors can scan them quickly.",
        hi: "Patient ki reports aur history, Medical records mein hain. Entries par date rakhein aur chhoti rakhein taaki doctor jaldi padh sake.",
    },
    {
        test: /patient list|patients\b|mareez/i,
        en: "The Patients page lists all registered patients. You can search by name there.",
        hi: "Patients page par saare registered patients ki list hai. Wahan naam se search kar sakte hain.",
    },
    {
        test: /doctor|specialist|dr\.?\b/i,
        en: "Doctors and their specializations are on the Doctors page. Tell me your symptoms and I can suggest which specialization fits.",
        hi: "Doctors aur unki specialization, Doctors page par hain. Symptoms batayein to main bata dunga ki kaunsi specialization sahi rahegi.",
    },
];

function bestDepartment(text) {
    const t = ` ${text.toLowerCase()} `;
    let best = null;
    let bestScore = 0;
    for (const [dept, words] of Object.entries(DEPARTMENTS)) {
        const score = words.filter((w) => t.includes(w)).length;
        if (score > bestScore) {
            best = dept;
            bestScore = score;
        }
    }
    return best;
}

function getReply(text) {
    const hi = HINGLISH.test(text);
    const pick = (o) => (hi ? o.hi : o.en);

    if (SELF_HARM.test(text)) return { text: pick(SELF_HARM_REPLY), emergency: true };
    if (EMERGENCY.some((p) => p.test(text))) return { text: pick(EMERGENCY_REPLY), emergency: true };

    const dept = bestDepartment(text);
    if (dept) {
        return {
            text: hi
                ? `Aapke bataye hisaab se ${dept} department sahi rahega. Ye sirf ek general suggestion hai, asli diagnosis doctor check karne ke baad hi karega. Agar problem badh rahi hai to jaldi doctor ko dikhayein.`
                : `Based on what you wrote, ${dept} looks like a suitable department. This is only a general suggestion. A doctor must examine the patient for a real diagnosis. If it is getting worse, see a doctor soon.`,
        };
    }

    const intent = INTENTS.find((i) => i.test.test(text));
    if (intent) return { text: pick(intent) };

    return {
        text: hi
            ? "Mujhe ye poori tarah samajh nahi aaya. Aap apne symptoms likh sakte hain (jaise 'knee pain'), ya poochh sakte hain ki Billing, Appointments ya Doctors approval kahan hai."
            : "I did not fully understand that. You can describe symptoms (for example 'knee pain'), or ask where to find Billing, Appointments or Doctor approvals.",
    };
}

/* ===================================================== */

function AIAssistant() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [typing, setTyping] = useState(false);
    const bodyRef = useRef(null);
    const timer = useRef(null);

    useEffect(() => {
        const el = bodyRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, typing]);

    // Page chhodte waqt pending timer saaf karo
    useEffect(() => () => clearTimeout(timer.current), []);

    function send(text) {
        const content = (text ?? input).trim();
        if (!content || typing) return;

        setMessages((m) => [...m, { role: "user", content }]);
        setInput("");
        setTyping(true);

        // Thoda ruk ke jawab, taaki natural lage
        timer.current = setTimeout(() => {
            const reply = getReply(content);
            setMessages((m) => [
                ...m,
                { role: "assistant", content: reply.text, emergency: reply.emergency },
            ]);
            setTyping(false);
        }, 700);
    }

    function onKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    }

    return (
        <div className="app-layout">

            <Sidebar />

            <div className="main-content">

                <Topbar />

                <main className="dashboard-content">

                    <div className="page-header">

                        <div>
                            <h2 className="fw-bold mb-1">
                                SmartCare AI
                            </h2>

                            <p className="text-muted">
                                Intelligent assistance for healthcare workflows.
                            </p>
                        </div>

                    </div>


                    <div className="row g-4">

                        <div className="col-lg-8">

                            <div className="ai-chat-card">

                                <div className="ai-chat-header">

                                    <div className="d-flex align-items-center gap-3">

                                        <div className="ai-icon">
                                            <i className="bi bi-stars"></i>
                                        </div>

                                        <div>
                                            <h5 className="fw-bold mb-0">
                                                SmartCare AI Assistant
                                            </h5>

                                            <small>
                                                AI-powered healthcare assistance
                                            </small>
                                        </div>

                                    </div>

                                    <span className="ai-online">
                                        ● Online
                                    </span>

                                </div>


                                <div className="chat-body" ref={bodyRef} aria-live="polite">

                                    <div className="ai-message">

                                        <div className="ai-message-icon">
                                            <i className="bi bi-stars"></i>
                                        </div>

                                        <div>
                                            <strong>SmartCare AI</strong>

                                            <p className="mb-0 mt-1">
                                                {GREETING}
                                            </p>
                                        </div>

                                    </div>

                                    {messages.length === 0 && (
                                        <div className="ai-chips">
                                            {SUGGESTIONS.map((s) => (
                                                <button key={s} onClick={() => send(s)}>
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {messages.map((m, i) =>
                                        m.role === "user" ? (
                                            <div key={i} className="ai-message user">
                                                <p className="mb-0">{m.content}</p>
                                            </div>
                                        ) : (
                                            <div
                                                key={i}
                                                className={`ai-message ${m.emergency ? "emergency" : ""}`}
                                            >
                                                <div className="ai-message-icon">
                                                    <i className={`bi ${m.emergency ? "bi-exclamation-triangle" : "bi-stars"}`}></i>
                                                </div>
                                                <div>
                                                    <strong>SmartCare AI</strong>
                                                    <p className="mb-0 mt-1">{m.content}</p>
                                                </div>
                                            </div>
                                        )
                                    )}

                                    {typing && (
                                        <div className="ai-message">
                                            <div className="ai-message-icon">
                                                <i className="bi bi-stars"></i>
                                            </div>
                                            <span className="ai-typing"><i></i><i></i><i></i></span>
                                        </div>
                                    )}

                                </div>


                                <div className="chat-input">

                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Ask SmartCare AI..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={onKeyDown}
                                        maxLength={500}
                                        aria-label="Your message"
                                    />

                                    <button
                                        className="btn btn-primary"
                                        onClick={() => send()}
                                        disabled={typing || !input.trim()}
                                        aria-label="Send message"
                                    >
                                        <i className="bi bi-send"></i>
                                    </button>

                                </div>

                            </div>

                        </div>


                        <div className="col-lg-4">

                            <div className="dashboard-card">

                                <h5 className="fw-bold">
                                    AI Features
                                </h5>

                                <p className="text-muted small">
                                    SmartCare AI modules
                                </p>


                                <div className="ai-feature">

                                    <i className="bi bi-chat-dots"></i>

                                    <div>
                                        <strong>AI Health Assistant</strong>
                                        <small>
                                            Preliminary patient assistance
                                        </small>
                                    </div>

                                </div>


                                <div className="ai-feature">

                                    <i className="bi bi-diagram-3"></i>

                                    <div>
                                        <strong>Department Suggestion</strong>
                                        <small>
                                            Suggest relevant department
                                        </small>
                                    </div>

                                </div>


                                <div className="ai-feature">

                                    <i className="bi bi-file-earmark-text"></i>

                                    <div>
                                        <strong>Medical Summary</strong>
                                        <small>
                                            Summarize medical records
                                        </small>
                                    </div>

                                </div>


                                <div className="ai-feature">

                                    <i className="bi bi-bar-chart"></i>

                                    <div>
                                        <strong>Hospital Insights</strong>
                                        <small>
                                            Operational data insights
                                        </small>
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>


                    <div className="ai-disclaimer mt-4">

                        <i className="bi bi-shield-check me-2"></i>

                        SmartCare AI provides assistance for healthcare
                        workflows and does not replace qualified medical
                        professionals.

                    </div>

                </main>

            </div>

        </div>
    );
}

export default AIAssistant;