import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../pages/services/api";

/* =====================================================
   Local "AI": keyword based, koi AI server ya key nahi
===================================================== */

const GREETING =
    "Hello! I can suggest a department for your symptoms and guide you around the portal. I can't diagnose or suggest medicines.";

const SUGGESTIONS = [
    "I have a fever and body ache since 2 days",
    "Which doctor should I see for back pain?",
    "What should I carry for my appointment?",
    "Mujhe roz sar dard hota hai, kya karu?",
];

const HINGLISH =
    /\b(hai|hain|mujhe|mera|meri|kya|kaise|kaun|nahi|nhi|karo|kare|karna|karu|dard|bukhar|batao|chahiye|hoga|mein|kyu|kyun|aap|tum|roz|raha|rahi)\b/i;

// Department ke keywords (leading space = shabd ki shuruat, "heart" mein "ear" na pakde)
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

// Portal se jude sawal: pehla match jeet jata hai
const INTENTS = [
    {
        test: /\b(hi|hello|hey|namaste|namaskar)\b/i,
        en: "Hello! Tell me your symptoms and I will suggest a department, or ask me how to use the portal.",
        hi: "Namaste! Apne symptoms batayein to main department suggest karunga, ya poochein ki portal kaise use karein.",
    },
    {
        test: /\b(thanks|thank you|thx|shukriya|dhanyavad)\b/i,
        en: "You're welcome! Take care and get well soon.",
        hi: "Aapka swagat hai! Apna khayal rakhein.",
    },
    {
        test: /\b(bye|goodbye|alvida)\b/i,
        en: "Take care! I'm here whenever you need me.",
        hi: "Apna khayal rakhein! Zaroorat ho to main yahin hu.",
    },
    {
        test: /(what can you do|\bhelp\b|madad|kya kar sakte|kya kar sakta)/i,
        en: "I can suggest a department for your symptoms, show doctors in the 'Find a doctor' tab, and explain how to book appointments or see your records. I cannot diagnose or prescribe.",
        hi: "Main symptoms ke hisaab se department bata sakta hu, 'Find a doctor' tab mein doctors dikha sakta hu, aur appointment ya records ke baare mein bata sakta hu. Main diagnose ya dawai nahi bata sakta.",
    },
    {
        test: /(carry|bring|le jana|le jaun|leke|documents?|saath).*(appointment|visit|doctor)|(appointment|visit).*(carry|bring|documents?)/i,
        en: "Please carry: a photo ID, your previous prescriptions and reports, a list of medicines you take now, and any allergy details. Reach 10 minutes early.",
        hi: "Saath le jayein: photo ID, purani prescriptions aur reports, abhi chal rahi dawaiyon ki list, aur allergy ki jaankari. 10 minute pehle pahunchein.",
    },
    {
        test: /(cancel|reschedule|badal)/i,
        en: "Open the Appointments page, find your booking and press Cancel. You can then book a new slot with the doctor.",
        hi: "Appointments page kholein, apni booking par Cancel dabayein, phir doctor ke saath naya slot book karein.",
    },
    {
        test: /appointment|booking|book\b|slot|schedule/i,
        en: "To book: open Appointments in the sidebar, pick a doctor, choose a date and time, and confirm. Or use the 'Find a doctor' tab here and press Book.",
        hi: "Book karne ke liye: sidebar mein Appointments kholein, doctor chunein, date aur time chunein aur confirm karein. Ya yahan 'Find a doctor' tab mein Book dabayein.",
    },
    {
        test: /prescription|medicine|dawai|dawa\b|dose|dosage/i,
        en: "Your prescriptions are in Medical records. I can't suggest medicines or dosages. Please follow what your doctor has written.",
        hi: "Aapki prescriptions Medical records mein hain. Main dawai ya dose nahi bata sakta, doctor ne jo likha hai wahi follow karein.",
    },
    {
        test: /record|report|history|test result/i,
        en: "Your reports and prescriptions are listed in Medical records in the sidebar, newest first.",
        hi: "Aapki reports aur prescriptions sidebar ke Medical records mein hain, naye sabse upar.",
    },
    {
        test: /profile|phone number|address|blood group|update.*detail|details.*update/i,
        en: "Open My profile to update your phone, date of birth, blood group, address and emergency contact. Press Save changes when done.",
        hi: "My profile kholein, wahan phone, date of birth, blood group, address aur emergency contact badal sakte hain. Ho jaye to Save changes dabayein.",
    },
    {
        test: /ambulance|emergency number|108|112/i,
        en: "For an emergency call 112, or 108 for an ambulance. The portal also shows this in the sidebar.",
        hi: "Emergency mein 112 par call karein, ambulance ke liye 108. Ye sidebar mein bhi likha hai.",
    },
    {
        test: /dark mode|theme|night/i,
        en: "You can switch dark mode from the toggle in My profile.",
        hi: "Dark mode My profile ke toggle se badal sakte hain.",
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

// Urgency ka andaza (sirf general)
function guessUrgency(text) {
    if (/severe|worse|worsening|unbearable|bahut\s*(tez|zyada)|bardasht|high fever|103|104/i.test(text)) return "urgent";
    if (/week|hafte|month|mahin|since|se\b.*(din|days)|days|din\b|persistent|roz|repeated/i.test(text)) return "soon";
    return "routine";
}

function getReply(text) {
    const hi = HINGLISH.test(text);
    const pick = (o) => (hi ? o.hi : o.en);

    if (SELF_HARM.test(text)) return { text: pick(SELF_HARM_REPLY), emergency: true };
    if (EMERGENCY.some((p) => p.test(text))) return { text: pick(EMERGENCY_REPLY), emergency: true };

    // Pehle portal wale sawal (taaki "doctor" jaise shabd se symptoms ka galat match na ho)
    const intent = INTENTS.find((i) => i.test.test(text));
    if (intent) return { text: pick(intent) };

    const dept = bestDepartment(text);
    if (dept) {
        return {
            text: hi
                ? `Aapke bataye hisaab se ${dept} department sahi rahega. Ye sirf general suggestion hai, asli diagnosis doctor check karne ke baad hi karega. Agar takleef badh rahi hai to jaldi doctor ko dikhayein. Chahein to "Find a doctor" tab se appointment book karein.`
                : `Based on what you wrote, ${dept} looks like a suitable department. This is only a general suggestion. A doctor must examine you for a real diagnosis. If it is getting worse, please see a doctor soon. You can use the "Find a doctor" tab to book.`,
        };
    }

    return {
        text: hi
            ? "Mujhe ye poori tarah samajh nahi aaya. Aap apne symptoms likh sakte hain (jaise 'knee pain'), ya poochh sakte hain ki appointment kaise book karein."
            : "I did not fully understand that. You can describe your symptoms (for example 'knee pain'), or ask how to book an appointment.",
    };
}

const URGENCY = {
    routine: { cls: "confirmed", label: "Routine" },
    soon: { cls: "pending", label: "See a doctor soon" },
    urgent: { cls: "cancelled", label: "Urgent" },
};

/* ===================================================== */

function PatientAI() {
    const [tab, setTab] = useState("chat");

    /* ---------- Chat ---------- */
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [typing, setTyping] = useState(false);
    const bodyRef = useRef(null);
    const timer = useRef(null);

    useEffect(() => {
        const el = bodyRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, typing, tab]);

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

    /* ---------- Find a doctor ---------- */
    const [symptoms, setSymptoms] = useState("");
    const [age, setAge] = useState("");
    const [result, setResult] = useState(null);
    const [allDoctors, setAllDoctors] = useState([]);

    // Approved doctors ek baar laao (route na ho to bhi page chalta rahega)
    useEffect(() => {
        api.get("/doctors")
            .then(({ data }) => setAllDoctors(data.doctors || []))
            .catch(() => setAllDoctors([]));
    }, []);

    function findDoctor(e) {
        e.preventDefault();
        const text = symptoms.trim();
        const hi = HINGLISH.test(text);

        if (SELF_HARM.test(text) || EMERGENCY.some((p) => p.test(text))) {
            const pick = SELF_HARM.test(text) ? SELF_HARM_REPLY : EMERGENCY_REPLY;
            setResult({ emergency: true, reply: hi ? pick.hi : pick.en });
            return;
        }

        let department = bestDepartment(text) || "General Medicine";
        // Bachon ke liye (12 saal se kam) Pediatrics
        if (age !== "" && Number(age) < 12 && department === "General Medicine") department = "Pediatrics";

        setResult({
            emergency: false,
            department,
            urgency: guessUrgency(text),
            reasoning: hi
                ? "Ye aapke symptoms ke keywords par based general suggestion hai. Sahi diagnosis doctor hi karega."
                : "This is a general suggestion based on keywords in your symptoms. A doctor will examine you for a proper diagnosis.",
            doctors: allDoctors.filter((d) => d.specialization === department).slice(0, 6),
        });
    }

    return (
        <>
            <div className="pt-header">
                <h2>AI Health Assistant</h2>
                <p>Ask health questions or find the right doctor for your symptoms.</p>
            </div>

            <div className="pt-ai-banner" role="note">
                <i className="bi bi-info-circle"></i>
                <span>
                    This assistant gives general information only and cannot diagnose or prescribe. In an
                    emergency call <strong>112</strong> or <strong>108</strong> right away.
                </span>
            </div>

            <div className="pt-tabs" role="tablist">
                <button
                    role="tab"
                    aria-selected={tab === "chat"}
                    className={tab === "chat" ? "active" : ""}
                    onClick={() => setTab("chat")}
                >
                    <i className="bi bi-chat-dots"></i> Chat
                </button>
                <button
                    role="tab"
                    aria-selected={tab === "doctor"}
                    className={tab === "doctor" ? "active" : ""}
                    onClick={() => setTab("doctor")}
                >
                    <i className="bi bi-person-heart"></i> Find a doctor
                </button>
            </div>

            {tab === "chat" && (
                <section className="pt-chat">
                    <div className="pt-chat-body" ref={bodyRef} aria-live="polite">
                        <div className="pt-msg bot">
                            <span className="pt-msg-avatar"><i className="bi bi-stars"></i></span>
                            <div className="pt-bubble">{GREETING}</div>
                        </div>

                        {messages.length === 0 && (
                            <div className="pt-chips">
                                {SUGGESTIONS.map((s) => (
                                    <button key={s} onClick={() => send(s)}>{s}</button>
                                ))}
                            </div>
                        )}

                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`pt-msg ${m.role === "user" ? "user" : "bot"} ${m.emergency ? "emergency" : ""}`}
                            >
                                {m.role !== "user" && (
                                    <span className="pt-msg-avatar">
                                        <i className={`bi ${m.emergency ? "bi-exclamation-triangle" : "bi-stars"}`}></i>
                                    </span>
                                )}
                                <div className="pt-bubble">{m.content}</div>
                            </div>
                        ))}

                        {typing && (
                            <div className="pt-msg bot">
                                <span className="pt-msg-avatar"><i className="bi bi-stars"></i></span>
                                <div className="pt-bubble">
                                    <span className="pt-typing"><i></i><i></i><i></i></span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-chat-input">
                        <textarea
                            rows="1"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={onKeyDown}
                            placeholder="Ask SmartCare AI..."
                            maxLength={500}
                            aria-label="Your message"
                        />
                        <button
                            className="pt-send"
                            onClick={() => send()}
                            disabled={typing || !input.trim()}
                            aria-label="Send message"
                        >
                            <i className="bi bi-send"></i>
                        </button>
                    </div>

                    {messages.length > 0 && (
                        <button className="pt-chat-clear" onClick={() => setMessages([])}>
                            <i className="bi bi-arrow-counterclockwise"></i> New chat
                        </button>
                    )}
                </section>
            )}

            {tab === "doctor" && (
                <div className="pt-grid wide-left">
                    <form className="pt-card" onSubmit={findDoctor}>
                        <h5 className="mb-1">Describe your symptoms</h5>
                        <p className="pt-muted">We will suggest a department and show doctors available at SmartCare.</p>

                        <label htmlFor="symptoms">Symptoms</label>
                        <textarea
                            id="symptoms"
                            rows="4"
                            value={symptoms}
                            onChange={(e) => setSymptoms(e.target.value)}
                            placeholder="e.g. knee pain for 2 weeks, worse while climbing stairs"
                            maxLength={500}
                            required
                        />

                        <label htmlFor="age">Age (optional)</label>
                        <input
                            id="age"
                            type="number"
                            min="0"
                            max="120"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                        />

                        <button className="pt-btn" disabled={symptoms.trim().length < 3}>
                            Suggest a doctor
                        </button>
                    </form>

                    <section className="pt-card">
                        <h5 className="mb-3">Suggestion</h5>

                        {!result && (
                            <div className="pt-empty">
                                <i className="bi bi-person-heart"></i>
                                <p>Your suggested department and doctors will appear here.</p>
                            </div>
                        )}

                        {result?.emergency && (
                            <div className="pt-alert error mb-0" role="alert">
                                <i className="bi bi-exclamation-triangle"></i>
                                <span>{result.reply}</span>
                            </div>
                        )}

                        {result && !result.emergency && (
                            <>
                                <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                                    <strong style={{ fontSize: "1.15rem" }}>{result.department}</strong>
                                    <span className={`pt-status ${URGENCY[result.urgency].cls}`}>
                                        {URGENCY[result.urgency].label}
                                    </span>
                                </div>
                                <p className="pt-muted mb-3">{result.reasoning}</p>

                                {result.doctors.length === 0 ? (
                                    <p className="pt-muted mb-0">
                                        No {result.department} doctor is listed right now. You can try General Medicine
                                        or check the Appointments page.
                                    </p>
                                ) : (
                                    <ul className="pt-list">
                                        {result.doctors.map((d) => (
                                            <li key={d._id}>
                                                <span className="pt-stat-icon small">
                                                    <i className="bi bi-person-badge"></i>
                                                </span>
                                                <div>
                                                    <strong>Dr. {d.name}</strong>
                                                    <small>
                                                        {d.specialization} · {d.experience ?? 0} yrs experience
                                                    </small>
                                                </div>
                                                <Link
                                                    to="/patient/appointments"
                                                    state={{ doctorId: d._id }}
                                                    className="pt-btn small"
                                                >
                                                    Book
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </>
                        )}
                    </section>
                </div>
            )}
        </>
    );
}

export default PatientAI;