import {json} from "./lib/db.mjs";
import {bootstrap,checkPassword,makeToken} from "./lib/auth.mjs";
export const handler=async e=>{if(e.httpMethod!=="POST")return json(405,{error:"Method not allowed."});try{
const b=JSON.parse(e.body||"{}"),u=String(b.username||"").trim(),p=String(b.password||""),c=await bootstrap();
await c.execute(`CREATE TABLE IF NOT EXISTS login_attempts(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT,success INTEGER,created_at TEXT)`);
const since=new Date(Date.now()-15*60*1000).toISOString(),f=await c.execute({sql:`SELECT COUNT(*) n FROM login_attempts WHERE username=? AND success=0 AND created_at>?`,args:[u,since]});
if(Number(f.rows[0]?.n||0)>=8)return json(429,{error:"Too many failed attempts. Try again later."});
const r=await c.execute({sql:`SELECT id,username,email,password_hash,role,active FROM staff_users WHERE username=?`,args:[u]});
const ok=r.rows.length&&Number(r.rows[0].active)&&checkPassword(p,r.rows[0].password_hash);
await c.execute({sql:`INSERT INTO login_attempts(username,success,created_at) VALUES(?,?,?)`,args:[u,ok?1:0,new Date().toISOString()]});
if(!ok)return json(401,{error:"Incorrect username or password."});const x=r.rows[0];
await c.execute({sql:`INSERT INTO audit_log(event_type,actor_display,action,reason,details_json,created_at) VALUES(?,?,?,?,?,?)`,args:["security",x.username,"Successful login","",JSON.stringify({role:x.role}),new Date().toISOString()]});
return json(200,{token:makeToken(x),username:x.username,role:x.role});}catch(x){console.error(x);return json(500,{error:"Login failed."})}};
