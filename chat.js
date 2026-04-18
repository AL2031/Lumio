const KEYS=[process.env.GROQ_KEY_1,process.env.GROQ_KEY_2,process.env.GROQ_KEY_3].filter(Boolean);
module.exports=async function(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS")return res.status(200).end();
  if(!KEYS.length)return res.status(500).json({error:"No API keys. Add GROQ_KEY_1/2/3 in Vercel → Settings → Environment Variables."});
  const{messages,system,model="llama-3.3-70b-versatile",max_tokens=1200}=req.body||{};
  const body=JSON.stringify({model,max_tokens,messages:system?[{role:"system",content:system},...(messages||[])]:messages||[]});
  let lastErr=null;
  for(let i=0;i<KEYS.length;i++){
    try{const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${KEYS[i]}`},body});
      if(r.status===429){lastErr=`Key ${i+1} rate-limited`;continue;}
      const d=await r.json();if(!r.ok){lastErr=d.error?.message||`HTTP ${r.status}`;if(r.status===401)break;continue;}
      return res.json(d);
    }catch(e){lastErr=e.message;}
  }
  return res.status(500).json({error:lastErr||"All keys failed"});
};
