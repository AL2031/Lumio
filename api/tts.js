// api/tts.js — server-side Groq TTS proxy
// Model: playai-tts  |  Valid voices: austin, daniel, troy, autumn, diana, hannah
const KEYS = [process.env.GROQ_KEY_1, process.env.GROQ_KEY_2, process.env.GROQ_KEY_3].filter(Boolean);

const VALID_VOICES = new Set(['austin','daniel','troy','autumn','diana','hannah']);

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!KEYS.length) return res.status(503).json({ error: "TTS service not configured." });

  let { text, voice = "austin" } = req.body || {};
  if (!text?.trim()) return res.status(400).json({ error: "text is required" });

  // Sanitize voice — fall back to "austin" if an old/invalid name is passed
  if (!VALID_VOICES.has(voice)) voice = "austin";

  const payload = JSON.stringify({
    model: "canopylabs/orpheus-v1-english",
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
        const errBody = await r.json().catch(() => ({}));
        lastErr = errBody?.error?.message || errBody?.error || `Groq error ${r.status}`;
        continue;
      }

      const buf = await r.arrayBuffer();
      if (buf.byteLength < 100) { lastErr = "Groq returned empty audio."; continue; }

      res.setHeader("Content-Type", "audio/mpeg");
      return res.send(Buffer.from(buf));

    } catch (e) {
      lastErr = e.message;
    }
  }

  return res.status(500).json({ error: lastErr });
};
