import {json} from "./lib/db.mjs";
import {authFromEvent,bootstrap} from "./lib/auth.mjs";
async function setup(c){await c.execute(`CREATE TABLE IF NOT EXISTS security_state(id INTEGER PRIMARY KEY CHECK(id=1),mode TEXT NOT NULL DEFAULT 'normal',updated_at TEXT,updated_by TEXT)`);await c.execute({sql:`INSERT OR IGNORE INTO security_state(id,mode,updated_at,updated_by) VALUES(1,'normal',?,?)`,args:[new Date().toISOString(),"SYSTEM"]});}
export const handler=async e=>{try{const a=authFromEvent(e);if(!a||!["admin","manager"].includes(a.r))return json(403,{error:"Authorized account required."});const c=await bootstrap();await setup(c);
if(e.httpMethod==="GET"){const r=await c.execute(`SELECT mode,updated_at,updated_by FROM security_state WHERE id=1`);return json(200,{...r.rows[0]});}
if(e.httpMethod!=="POST")return json(405,{error:"Method not allowed."});if(a.r!=="manager")return json(403,{error:"Account Manager required."});
const b=JSON.parse(e.body||"{}"),mode=String(b.mode||"").toLowerCase();if(!["normal","recovery","lockdown"].includes(mode))return json(400,{error:"Invalid security mode."});
await c.execute({sql:`UPDATE security_state SET mode=?,updated_at=?,updated_by=? WHERE id=1`,args:[mode,new Date().toISOString(),"SYSTEM"]});
await c.execute({sql:`INSERT INTO audit_log(event_type,actor_display,action,reason,details_json,created_at) VALUES(?,?,?,?,?,?)`,args:["security","SYSTEM",`Security mode → ${mode.toUpperCase()}`,String(b.reason||""),JSON.stringify({mode}),new Date().toISOString()]});return json(200,{ok:true,mode});
}catch(x){console.error(x);return json(500,{error:"Security-state operation failed."})}};
