// api/chat.js — server-side Groq LLM proxy
// Keys are stored ONLY in Vercel Environment Variables — never exposed to the browser
const KEYS = [process.env.GROQ_KEY_1, process.env.GROQ_KEY_2, process.env.GROQ_KEY_3].filter(Boolean);

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!KEYS.length) return res.status(503).json({ error: "AI service not configured. The site owner needs to add API keys in Vercel." });

  const { messages, system, model = "llama-3.3-70b-versatile", max_tokens = 1200 } = req.body || {};
  const body = JSON.stringify({
    model, max_tokens,
    messages: system ? [{ role: "system", content: system }, ...(messages || [])] : (messages || []),
  });

  let lastStatus = 500;
  for (let i = 0; i < KEYS.length; i++) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEYS[i]}` },
        body,
      });
      if (r.status === 429) { lastStatus = 429; continue; } // rate limited, try next key
      const data = await r.json();
      if (!r.ok) { lastStatus = r.status; if (r.status === 401) break; continue; }
      return res.json(data);
    } catch (e) { lastStatus = 500; }
  }

  const msg = lastStatus === 429
    ? "AI service is busy, please try again in a moment."
    : "AI service unavailable. Please try again later.";
  return res.status(lastStatus).json({ error: msg });
};
