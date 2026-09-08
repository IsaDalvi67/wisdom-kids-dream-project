import crypto from "node:crypto";
import { json } from "./lib/db.mjs";
import { bootstrap, makeToken } from "./lib/auth.mjs";

function equalSecret(a,b){
  const x=crypto.createHash("sha256").update(String(a)).digest();
  const y=crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x,y);
}

export const handler=async(event)=>{
  if(event.httpMethod!=="POST") return json(405,{error:"Method not allowed."});
  try{
    const db=await bootstrap();
    await db.execute(`CREATE TABLE IF NOT EXISTS recovery_login_attempts(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      success INTEGER NOT NULL,
      created_at TEXT NOT NULL
    )`);

    const body=JSON.parse(event.body||"{}");
    const username=String(body.username||"").trim();
    const password=String(body.password||"");
    const expectedUser=String(process.env.WKDP_RECOVERY_USER||"").trim();
    const expectedPass=String(process.env.WKDP_RECOVERY_PASSWORD||"");

    if(!expectedUser || !expectedPass)
      return json(503,{error:"Recovery account is not configured."});

    const since=new Date(Date.now()-15*60*1000).toISOString();
    const recent=await db.execute({
      sql:`SELECT COUNT(*) AS n FROM recovery_login_attempts
           WHERE username=? AND success=0 AND created_at>?`,
      args:[username,since]
    });
    if(Number(recent.rows[0]?.n||0)>=8)
      return json(429,{error:"Too many failed attempts. Try again later."});

    const ok=equalSecret(username,expectedUser)&&equalSecret(password,expectedPass);
    await db.execute({
      sql:`INSERT INTO recovery_login_attempts(username,success,created_at) VALUES(?,?,?)`,
      args:[username,ok?1:0,new Date().toISOString()]
    });

    if(!ok) return json(401,{error:"Incorrect recovery credentials."});

    await db.execute({
      sql:`INSERT INTO audit_log(event_type,actor_display,action,reason,details_json,created_at)
           VALUES(?,?,?,?,?,?)`,
      args:["security","SYSTEM","Recovery account login","",
            JSON.stringify({role:"recovery"}),new Date().toISOString()]
    });

    return json(200,{
      token:makeToken({id:0,username:expectedUser,role:"recovery"}),
      username:expectedUser,
      role:"recovery"
    });
  }catch(err){
    console.error(err);
    return json(500,{error:"Recovery login failed."});
  }
};