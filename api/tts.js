const KEYS=[process.env.GROQ_KEY_1,process.env.GROQ_KEY_2,process.env.GROQ_KEY_3].filter(Boolean);
module.exports=async function(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS")return res.status(200).end();
  if(!KEYS.length)return res.status(500).json({error:"No API keys configured."});
  const{text,voice="Fritz-PlayAI",speed=1.0}=req.body||{};
  if(!text?.trim())return res.status(400).json({error:"text is required"});
  const body=JSON.stringify({model:"playai-tts",input:text.slice(0,4096),voice,speed:Math.max(0.5,Math.min(2.0,+speed||1)),response_format:"mp3"});
  let lastErr=null;
  for(let i=0;i<KEYS.length;i++){
    try{const r=await fetch("https://api.groq.com/openai/v1/audio/speech",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${KEYS[i]}`},body});
      if(r.status===429){lastErr=`Key ${i+1} rate-limited`;continue;}
      if(!r.ok){const e=await r.json().catch(()=>({}));lastErr=e.error?.message||`HTTP ${r.status}`;if(r.status===401)break;continue;}
      const buf=await r.arrayBuffer();res.setHeader("Content-Type","audio/mpeg");return res.send(Buffer.from(buf));
    }catch(e){lastErr=e.message;}
  }
  return res.status(500).json({error:lastErr||"TTS failed"});
};
