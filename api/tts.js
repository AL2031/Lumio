// api/tts.js — server-side Groq PlayAI TTS proxy
const KEYS = [process.env.GROQ_KEY_1, process.env.GROQ_KEY_2, process.env.GROQ_KEY_3].filter(Boolean);

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!KEYS.length) return res.status(503).json({ error: "TTS service not configured." });

  const { text, voice = "Fritz-PlayAI" } = req.body || {};
  if (!text?.trim()) return res.status(400).json({ error: "text is required" });

  // Note: speed param omitted — not supported by all playai-tts versions and causes 400
  const payload = JSON.stringify({
    model: "playai-tts",
    input: text.slice(0, 4096),
    voice,
    response_format: "mp3",
  });

  let lastErr = "TTS service unavailable.";
  for (let i = 0; i < KEYS.length; i++) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/audio/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEYS[i]}` },
        body: payload,
      });

      if (r.status === 429) { lastErr = "Service busy, try again."; continue; }
      if (r.status === 401) { lastErr = "Auth error."; break; }

      if (!r.ok) {
        // Surface the actual Groq error so we can debug
        const errBody = await r.json().catch(() => ({}));
        lastErr = errBody?.error?.message || errBody?.error || `Groq error ${r.status}`;
        continue;
      }

      const buf = await r.arrayBuffer();
      if (buf.byteLength < 100) {
        lastErr = "Groq returned empty audio.";
        continue;
      }

      res.setHeader("Content-Type", "audio/mpeg");
      return res.send(Buffer.from(buf));

    } catch (e) {
      lastErr = e.message;
    }
  }

  return res.status(500).json({ error: lastErr });
};
