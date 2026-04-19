// api/tts.js — server-side Groq PlayAI TTS proxy
const KEYS = [process.env.GROQ_KEY_1, process.env.GROQ_KEY_2, process.env.GROQ_KEY_3].filter(Boolean);

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!KEYS.length) return res.status(503).json({ error: "AI service not configured." });

  const { text, voice = "Fritz-PlayAI", speed = 1.0 } = req.body || {};
  if (!text?.trim()) return res.status(400).json({ error: "text is required" });

  const body = JSON.stringify({
    model: "playai-tts",
    input: text.slice(0, 4096),
    voice,
    speed: Math.max(0.5, Math.min(2.0, +speed || 1)),
    response_format: "mp3",
  });

  let lastStatus = 500;
  for (let i = 0; i < KEYS.length; i++) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/audio/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEYS[i]}` },
        body,
      });
      if (r.status === 429) { lastStatus = 429; continue; }
      if (!r.ok) { lastStatus = r.status; if (r.status === 401) break; continue; }
      const buf = await r.arrayBuffer();
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Disposition", 'attachment; filename="speech.mp3"');
      return res.send(Buffer.from(buf));
    } catch (e) { lastStatus = 500; }
  }

  const msg = lastStatus === 429 ? "Service busy, try again shortly." : "Speech service unavailable.";
  return res.status(lastStatus).json({ error: msg });
};
