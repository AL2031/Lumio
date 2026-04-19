// api/transcribe.js — Groq Whisper proxy with 3-key rotation
// Vercel bodyParser must be disabled — raw multipart body forwarded directly to Groq
const KEYS = [process.env.GROQ_KEY_1, process.env.GROQ_KEY_2, process.env.GROQ_KEY_3].filter(Boolean);

async function readStream(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!KEYS.length) return res.status(500).json({ error: "No API keys configured. Add GROQ_KEY_1 in Vercel → Settings → Environment Variables, then Redeploy." });

  let body;
  try { body = await readStream(req); }
  catch (e) { return res.status(400).json({ error: "Failed to read body" }); }

  const contentType = req.headers["content-type"] || "";
  let lastErr = null;

  for (let i = 0; i < KEYS.length; i++) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${KEYS[i]}`, "Content-Type": contentType },
        body,
      });
      if (r.status === 429) { lastErr = `Key ${i + 1} rate-limited`; continue; }
      const data = await r.json();
      if (!r.ok) { lastErr = data.error?.message || `HTTP ${r.status}`; if (r.status === 401) break; continue; }
      return res.json(data);
    } catch (e) { lastErr = e.message; }
  }
  return res.status(500).json({ error: lastErr || "Transcription failed" });
}

// Required: tells Vercel not to parse the body (we need raw multipart)
handler.config = { api: { bodyParser: false } };
module.exports = handler;
