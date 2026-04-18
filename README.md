# Lumio Studio v2

A Canva-style creative suite with a unified video editor — design graphics, build scene-based videos from scratch, add text and shapes to scenes, auto-generate captions with AI, and export everything.

---

## What's new in v2

- **Unified Video Editor** — Create and Edit are now one mode. No more switching.
- **Scene-based timeline** — Like Canva: visual clip strip at the bottom, click any scene to edit it, drag the handles to set duration.
- **Video clip backgrounds** — Upload a video as the background of any scene (with CSS filter effects per-scene).
- **Auto Captions** — Click one button, Groq Whisper transcribes audio → timestamped captions appear as overlay. Caption chips visible in the timeline track.
- **Caption styles** — 6 styles: White on Dark, Bold Yellow, Outline, Gradient, Glass, Black Bar.
- **Per-scene FX** — Brightness, Contrast, Saturation, Hue, Blur, Sepia, Grayscale — with Vivid/Cool/Warm/B&W/Cinema/Neon presets.
- **Design mode** — Full Fabric.js canvas editor, unchanged.

---

## Deploy to Vercel (step-by-step)

### Step 1: Get 3 free Groq API keys

1. Go to **https://console.groq.com** and sign up (free).
2. Click **API Keys** in the left sidebar.
3. Click **Create API Key** → name it "Lumio 1" → copy the key.
4. Repeat for "Lumio 2" and "Lumio 3". You should have 3 keys like `gsk_abc…`

> The free tier covers Llama 3.3 70B (copywriting), PlayAI TTS (text-to-speech), and Whisper v3 Turbo (auto-captions) — all the AI features in Lumio.

### Step 2: Put the files on GitHub

**Option A — Web upload (no command line)**

1. Go to **https://github.com/new** → name it `lumio-studio` → Public → **Create repository**
2. Click **uploading an existing file**
3. Drag and drop all these files from this folder:
   - `index.html`
   - `vercel.json`
   - `package.json`
   - The entire `api/` folder (drag the folder itself)
4. Write a commit message and click **Commit changes**

**Option B — GitHub CLI (2 minutes)**

```bash
cd lumio-studio   # this folder
git init
git add .
git commit -m "Initial Lumio Studio v2"
gh repo create lumio-studio --public --source=. --push
```

### Step 3: Deploy on Vercel

1. Go to **https://vercel.com** → sign in (free)
2. Click **Add New → Project**
3. Click **Import** next to your `lumio-studio` repo
4. Settings screen:
   - Framework Preset: **Other**
   - Root Directory: `/` (default, leave blank)
   - Build Command: leave blank
   - Output Directory: leave blank
5. Click **Deploy** — done in ~30 seconds

### Step 4: Add your 3 API keys

> **This is required** — without this, AI features (auto-caption, TTS, copywriter) won't work.

1. In your Vercel dashboard, open the `lumio-studio` project
2. Click **Settings** → **Environment Variables**
3. Add each of these, one at a time:

| Variable Name | Value |
|---|---|
| `GROQ_KEY_1` | `gsk_abc123…` (your primary key) |
| `GROQ_KEY_2` | `gsk_def456…` (backup 1) |
| `GROQ_KEY_3` | `gsk_ghi789…` (backup 2) |

   For each: type the name → paste the value → click **Save**

4. After saving all 3, click **Deployments** tab → click ⋯ next to the latest deployment → **Redeploy**. This applies the new env vars.

5. Open your live URL (e.g. `lumio-studio.vercel.app`). The green dot in the top bar means all 3 keys are working.

**Why 3 keys?** Groq has per-key rate limits. When Key 1 hits a 429 Too Many Requests, the server automatically tries Key 2, then Key 3. This way you almost never see an error.

### Step 5: Test AI features

1. Click **✦ AI** → type "a bold 5-word headline for a shoe brand" → click **✦ Run AI** → you should see a result
2. Click **🔊 TTS** → type "Hello world" → click **🔊 Generate** → audio should play
3. In Video mode → Captions tab → upload an MP3 or video → click **Auto-Caption with AI** → captions appear

---

## Local development

```bash
npm install -g vercel

# copy env template and fill in your keys
cp .env.example .env.local
# edit .env.local

# run local dev server (API functions work locally)
vercel dev

# open http://localhost:3000
```

---

## How to make a video from scratch

1. Click **▶ Video** in the top bar
2. You start with 1 blank scene (dark background)
3. **Left panel → Text**: click any preset to add text. Customize in the right panel.
4. **Left panel → Elements**: click shapes to add them. Customize color, opacity, size.
5. **Left panel → Media**: upload a video clip as the scene background. Or pick a color.
6. Set **Duration** (how many seconds this scene plays) in the top bar of the canvas
7. Set **Transition** (Fade, Slide Left, Slide Right, Zoom)
8. Click **＋ Add Scene** to add another scene. The timeline strip at the bottom shows all scenes.
9. Click between scenes in the strip to edit each one independently.
10. Click **▶ Preview** to play through all scenes
11. **Left panel → Captions**: upload audio → click **Auto-Caption with AI** → captions appear as overlay during playback and export
12. Click **↓ Export Video** in the top bar to render and download your video

---

## File structure

```
lumio-studio/
├── index.html          ← Entire app (single file, ~2000 lines)
├── vercel.json         ← Routing config
├── package.json        ← Node.js runtime
├── .env.example        ← Template for local dev
└── api/
    ├── chat.js         ← Groq LLM proxy (Llama 3.3 70B)
    ├── tts.js          ← Groq PlayAI TTS proxy
    └── transcribe.js   ← Groq Whisper proxy
```

---

## License

MIT.
