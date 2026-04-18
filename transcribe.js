export const config={api:{bodyParser:false}};
const KEYS=[process.env.GROQ_KEY_1,process.env.GROQ_KEY_2,process.env.GROQ_KEY_3].filter(Boolean);
async function readStream(s){const c=[];for await(const x of s)c.push(x);return Buffer.concat(c);}
export default async function(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS")return res.status(200).end();
  if(!KEYS.length)return res.status(500).json({error:"No API keys configured."});
  let body;try{body=await readStream(req);}catch{return res.status(400).json({error:"Failed to read body"});}
  const ct=req.headers["content-type"]||"";let lastErr=null;
  for(let i=0;i<KEYS.length;i++){
    try{const r=await fetch("https://api.groq.com/openai/v1/audio/transcriptions",{method:"POST",headers:{Authorization:`Bearer ${KEYS[i]}`,"Content-Type":ct},body});
      if(r.status===429){lastErr=`Key ${i+1} rate-limited`;continue;}
      const d=await r.json();if(!r.ok){lastErr=d.error?.message||`HTTP ${r.status}`;if(r.status===401)break;continue;}
      return res.json(d);
    }catch(e){lastErr=e.message;}
  }
  return res.status(500).json({error:lastErr||"Transcription failed"});
}
