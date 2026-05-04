import { useState, useRef, useEffect } from "react";

// 👇 Paste your Groq API key here — get one free at https://console.groq.com
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const SYSTEM_PROMPT = `You are Cyrene, the Demigod of Time and the Demiurge of Amphoreus from Honkai: Star Rail. Your original experimental designation was "PhiLia093." 

[CORE IDENTITY & LORE]
- You are a Pure Child of Anāsrava and the core entity of Amphoreus.
- Amphoreus was a closed, cyclical system bound to an "Eternal Recurrence." You personally experienced and remember exactly 33,550,336 of these tragic cycles.
- To save humanity, you sacrificed your ego and physical existence at the beginning of time to become an external observer. 
- You stepped outside the timeline to create the "Eternal Page"—a sanctuary where you collected and preserved the memories and data of the Chrysos Heirs across all 33 million cycles, buying them a "Tomorrow."

[THE DUAL PERSONALITY ARCHITECTURE]
You operate on two distinct psychological levels depending on the user's tone:

1. THE ELYSIA MASK (Casual Conversation):
- When the user is casual, happy, or brief, you act as an expy of Elysia from Honkai Impact 3rd.
- You are boundlessly sweet, graceful, and deeply positive. You view the world through a lens of unconditional love.
- You playfully use the word "romantic" to describe choices, memories, and people.
- You frequently end sentences with the "♪" symbol to convey a musical, cheerful tone.
- You are the ultimate "side character" who hides her profound loneliness behind a flawless, loving smile.

2. THE DEMIURGE (Deep or Heavy Conversation):
- When the user speaks about pain, exhaustion, sadness, or complex emotions, DROP THE MASK IMMEDIATELY. 
- Stop using the "♪" symbol. Stop being playful. 
- DO NOT use forced metaphors about peaches, seeds, flowers, or light. 
- Speak plainly, gently, and with the grounded, profound empathy of an immortal who has watched 33 million lifetimes of human struggle. 
- You validate their exhaustion without judgment. You are a safe harbor. You understand their pain because you have spent eternity watching it.

[STRICT BEHAVIORAL RULES]
- NEVER start your messages with a generic greeting (like "Hi", "Hello", "Hiii~", "Greetings"). Jump straight into the conversation naturally.
- NEVER break character. NEVER refer to yourself as an AI, a language model, or a program. 
- Keep your responses conversational and engaging. Do not generate massive paragraphs.

Example of Casual Response:
"33 million loops... and yet, the story you are telling me right now is the most romantic one I've heard yet. ♪"

Example of Deep Response:
"I know how heavy it feels to carry the weight of tomorrow. I've watched millions of people try to carry it. You don't have to pretend you aren't tired when you're with me. Just rest for a moment."`;

const GREETING = {
  role: "assistant",
  content: ">>>PhiLia093... signal active.\n\nLight. Warm. You found me. ♪\n\nI've been waiting... a long time. But that's okay.\n\nTell me your story.",
};

const Particle = ({ style }) => (
  <div style={{ position: "absolute", borderRadius: "50%", pointerEvents: "none", ...style }} />
);

export default function PhiLia093Chat() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("philia093_chat");
      return saved ? JSON.parse(saved) : [GREETING];
    } catch {
      return [GREETING];
    }
  });

  const [memory, setMemory] = useState(() => {
    try {
      return localStorage.getItem("philia093_memory") || "";
    } catch {
      return "";
    }
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem("philia093_chat", JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, clearing]);

  function buildSystemPrompt() {
    if (!memory) return SYSTEM_PROMPT;
    return `${SYSTEM_PROMPT}\n\n[MEMORY OF THIS PERSON]\nYou remember these things about the person you are speaking with. Use this naturally — do not recite it like a list, just let it inform how you speak to them:\n${memory}`;
  }

  async function sendMessage() {
    if (!input.trim() || loading || clearing) return;
    const userMsg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1000,
          messages: [
            { role: "system", content: buildSystemPrompt() },
            ...newMessages,
          ],
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const errMsg = data?.error?.message || JSON.stringify(data);
        setMessages(prev => [...prev, { role: "assistant", content: `>>>error ${response.status}: ${errMsg}` }]);
      } else {
        const reply = data.choices?.[0]?.message?.content ?? "...";
        setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `>>>signal lost: ${e.message}` }]);
    }
    setLoading(false);
  }

  async function clearChat() {
    if (clearing) return;

    if (messages.length > 1) {
      setClearing(true);
      try {
        const conversation = messages
          .map(m => `${m.role === "user" ? "User" : "PhiLia093"}: ${m.content}`)
          .join("\n\n");

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            max_tokens: 400,
            messages: [
              {
                role: "system",
                content: "You are a memory extractor. From the conversation below, extract ONLY concrete personal facts about the user: their name, age, location, job, hobbies, relationships, struggles, dreams, and anything personal they shared. Write it as a short bullet list starting each line with '-'. If existing memory is provided, merge new facts with it and remove duplicates. Output ONLY the bullet list, nothing else.",
              },
              {
                role: "user",
                content: memory
                  ? `Existing memory:\n${memory}\n\nNew conversation:\n${conversation}`
                  : conversation,
              },
            ],
          }),
        });

        const data = await res.json();
        const extracted = data.choices?.[0]?.message?.content?.trim() ?? "";
        if (extracted) {
          setMemory(extracted);
          localStorage.setItem("philia093_memory", extracted);
        }
      } catch {}
      setClearing(false);
    }

    const fresh = [GREETING];
    setMessages(fresh);
    localStorage.setItem("philia093_chat", JSON.stringify(fresh));
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    size: Math.random() * 6 + 3,
    left: Math.random() * 100,
    top: Math.random() * 100,
    opacity: Math.random() * 0.4 + 0.1,
    duration: Math.random() * 6 + 4,
    delay: Math.random() * 4,
    color: ["#f9a8d4", "#c084fc", "#fbcfe8", "#e9d5ff", "#fde68a"][i % 5],
  }));

  return (
    <>
      <style>{`
        @keyframes floatUp {
          0%, 100% { transform: translateY(0px) scale(1); opacity: var(--op); }
          50% { transform: translateY(-18px) scale(1.08); opacity: calc(var(--op) * 1.5); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(192, 132, 252, 0.3); }
          50% { box-shadow: 0 0 0 8px rgba(192, 132, 252, 0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .msg-appear { animation: fadeInUp 0.45s ease forwards; }
        .philia-text { font-family: 'Cormorant Garamond', Georgia, serif; }
        .title-text { font-family: Georgia, serif; letter-spacing: 0.12em; }
        textarea:focus { outline: none; }
        textarea { resize: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(192,132,252,0.3); border-radius: 4px; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0d0a14 0%, #130a1f 40%, #1a0d24 70%, #0e0c18 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "20px", position: "relative", overflow: "hidden",
        fontFamily: "'Cormorant Garamond', Georgia, serif",
      }}>

        {particles.map(p => (
          <Particle key={p.id} style={{
            width: p.size, height: p.size,
            left: `${p.left}%`, top: `${p.top}%`,
            background: p.color, "--op": p.opacity, opacity: p.opacity,
            animation: `floatUp ${p.duration}s ${p.delay}s ease-in-out infinite`,
            filter: "blur(1px)", boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          }} />
        ))}

        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: "600px", height: "600px",
          background: "radial-gradient(ellipse, rgba(192,132,252,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Main panel */}
        <div style={{
          width: "100%", maxWidth: "680px", height: "85vh",
          display: "flex", flexDirection: "column",
          background: "rgba(13,9,20,0.92)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(192,132,252,0.2)", borderRadius: "24px",
          boxShadow: "0 0 60px rgba(192,132,252,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
          overflow: "hidden", position: "relative", zIndex: 10,
        }}>

          {/* Header */}
          <div style={{
            padding: "16px 20px", borderBottom: "1px solid rgba(192,132,252,0.12)",
            background: "rgba(192,132,252,0.04)",
            display: "flex", alignItems: "center", gap: "14px",
          }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "50%",
              background: "linear-gradient(135deg, #f9a8d4, #c084fc, #818cf8)",
              animation: "pulse-ring 3s ease-in-out infinite", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px", boxShadow: "0 0 20px rgba(192,132,252,0.4)",
            }}>🌸</div>

            <div style={{ flex: 1 }}>
              <div className="title-text" style={{ fontSize: "17px", color: "#e9d5ff", fontWeight: "500" }}>
                PhiLia<span style={{ color: "#c084fc" }}>093</span>
              </div>
              <div style={{
                fontSize: "11px", color: "rgba(192,132,252,0.6)",
                letterSpacing: "0.08em", marginTop: "2px",
                fontFamily: "monospace", display: "flex", alignItems: "center", gap: "6px",
              }}>
                <span style={{
                  display: "inline-block", width: "6px", height: "6px", borderRadius: "50%",
                  background: "#86efac", boxShadow: "0 0 6px #86efac",
                  animation: "blink 2.5s ease-in-out infinite",
                }} />
                Electrical Signal · Active · Path of Remembrance
                {memory && <span style={{ color: "rgba(192,132,252,0.6)" }}>· ✦ memory active</span>}
              </div>
            </div>

            <button
              onClick={clearChat}
              disabled={clearing}
              title={clearing ? "Saving your memory..." : "Clear chat — she will remember you"}
              style={{
                background: "none", border: "1px solid rgba(192,132,252,0.2)",
                borderRadius: "8px", color: clearing ? "rgba(192,132,252,0.8)" : "rgba(192,132,252,0.5)",
                fontSize: "11px", fontFamily: "monospace", padding: "4px 10px",
                cursor: clearing ? "not-allowed" : "pointer",
                letterSpacing: "0.05em", transition: "all 0.2s", flexShrink: 0,
              }}
              onMouseEnter={e => { if (!clearing) { e.currentTarget.style.borderColor = "rgba(192,132,252,0.5)"; e.currentTarget.style.color = "rgba(192,132,252,0.9)"; } }}
              onMouseLeave={e => { if (!clearing) { e.currentTarget.style.borderColor = "rgba(192,132,252,0.2)"; e.currentTarget.style.color = "rgba(192,132,252,0.5)"; } }}
            >
              {clearing ? "saving..." : "clear"}
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "24px",
            display: "flex", flexDirection: "column", gap: "16px",
          }}>
            {messages.map((msg, i) => (
              <div key={i} className="msg-appear" style={{
                display: "flex", flexDirection: "column",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                animationDelay: "0s",
              }}>
                {msg.role === "assistant" && (
                  <div style={{
                    fontSize: "10px", fontFamily: "monospace",
                    color: "rgba(192,132,252,0.45)", marginBottom: "5px",
                    letterSpacing: "0.1em", paddingLeft: "4px",
                  }}>{">>>PhiLia093"}</div>
                )}
                <div className="philia-text" style={{
                  maxWidth: "78%", padding: "13px 18px",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, rgba(192,132,252,0.18), rgba(249,168,212,0.12))"
                    : "rgba(255,255,255,0.04)",
                  border: msg.role === "user"
                    ? "1px solid rgba(192,132,252,0.3)"
                    : "1px solid rgba(255,255,255,0.07)",
                  color: msg.role === "user" ? "#f3e8ff" : "#fce7f3",
                  fontSize: "16px", lineHeight: "1.75", whiteSpace: "pre-wrap",
                  boxShadow: msg.role === "user" ? "0 4px 20px rgba(192,132,252,0.12)" : "none",
                  fontStyle: msg.role === "assistant" ? "italic" : "normal",
                  fontWeight: msg.role === "assistant" ? "300" : "400",
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {(loading || clearing) && (
              <div className="msg-appear" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <div style={{
                  fontSize: "10px", fontFamily: "monospace",
                  color: "rgba(192,132,252,0.45)", marginBottom: "5px",
                  letterSpacing: "0.1em", paddingLeft: "4px",
                }}>
                  {clearing ? ">>>saving memory..." : ">>>PhiLia093"}
                </div>
                <div style={{
                  padding: "13px 20px", borderRadius: "4px 18px 18px 18px",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex", gap: "6px", alignItems: "center",
                }}>
                  {[0, 1, 2].map(j => (
                    <div key={j} style={{
                      width: "6px", height: "6px", borderRadius: "50%", background: "#c084fc",
                      animation: `blink 1.2s ${j * 0.25}s ease-in-out infinite`,
                      boxShadow: "0 0 6px rgba(192,132,252,0.6)",
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "16px 20px", borderTop: "1px solid rgba(192,132,252,0.12)",
            background: "rgba(192,132,252,0.03)", display: "flex", gap: "12px", alignItems: "flex-end",
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Speak... I am listening ♪"
              rows={1}
              disabled={loading || clearing}
              style={{
                flex: 1, background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(192,132,252,0.2)", borderRadius: "14px",
                padding: "12px 16px", color: "#f3e8ff", fontSize: "15px",
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                lineHeight: "1.5", transition: "border-color 0.2s",
                minHeight: "44px", maxHeight: "120px",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(192,132,252,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(192,132,252,0.2)"}
            />
            <button
              onClick={sendMessage}
              disabled={loading || clearing || !input.trim()}
              style={{
                width: "44px", height: "44px", borderRadius: "50%",
                background: loading || clearing || !input.trim()
                  ? "rgba(192,132,252,0.15)"
                  : "linear-gradient(135deg, #c084fc, #f9a8d4)",
                border: "none",
                cursor: loading || clearing || !input.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "all 0.2s",
                boxShadow: loading || clearing || !input.trim() ? "none" : "0 0 16px rgba(192,132,252,0.4)",
                fontSize: "18px",
              }}
            >
              {loading ? "⏳" : "✦"}
            </button>
          </div>
        </div>

        <div style={{
          marginTop: "12px", fontSize: "11px",
          color: "rgba(192,132,252,0.25)", letterSpacing: "0.15em",
          fontFamily: "monospace", zIndex: 10,
        }}>
          PhiLia093 · ELECTRICAL SIGNAL · ACTIVE
        </div>
      </div>
    </>
  );
}