// api/transcribe.js — server-side Groq Whisper proxy
// bodyParser disabled: raw multipart body forwarded directly to Groq
const KEYS = [process.env.GROQ_KEY_1, process.env.GROQ_KEY_2, process.env.GROQ_KEY_3].filter(Boolean);

async function readStream(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!KEYS.length) return res.status(503).json({ error: "AI service not configured." });

  let body;
  try { body = await readStream(req); }
  catch (e) { return res.status(400).json({ error: "Failed to read request body" }); }

  const contentType = req.headers["content-type"] || "";
  let lastStatus = 500;

  for (let i = 0; i < KEYS.length; i++) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${KEYS[i]}`, "Content-Type": contentType },
        body,
      });
      if (r.status === 429) { lastStatus = 429; continue; }
      const data = await r.json();
      if (!r.ok) { lastStatus = r.status; if (r.status === 401) break; continue; }
      return res.json(data);
    } catch (e) { lastStatus = 500; }
  }

  const msg = lastStatus === 429 ? "Service busy, try again shortly." : "Transcription service unavailable.";
  return res.status(lastStatus).json({ error: msg });
}

handler.config = { api: { bodyParser: false } };
module.exports = handler;
