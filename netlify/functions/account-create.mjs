import {json} from "./lib/db.mjs";import {authFromEvent,bootstrap,hashPassword,requireRole} from "./lib/auth.mjs";
export const handler=async e=>{if(e.httpMethod!=="POST")return json(405,{error:"Method not allowed."});try{
 const a=authFromEvent(e);if(!a)return json(401,{error:"Unauthorized."});if(!requireRole(a,["admin","manager"]))return json(403,{error:"Forbidden."});
 const b=JSON.parse(e.body||"{}"),u=String(b.username||"").trim(),em=String(b.email||"").trim().toLowerCase(),p=String(b.password||""),role=String(b.role||"staff");
 if(!/^[A-Za-z0-9_.-]{3,40}$/.test(u)||!em.includes("@")||p.length<10||!["staff","admin","manager"].includes(role))return json(400,{error:"Invalid account details. Password must be at least 10 characters."});
 if(a.r==="admin"&&role!=="staff")return json(403,{error:"Admins can create Staff accounts only. Account Manager creates Admin/Manager accounts."});
 const c=await bootstrap(),now=new Date().toISOString();
 await c.execute({sql:`INSERT INTO staff_users(username,email,password_hash,role,created_at,created_by) VALUES(?,?,?,?,?,?)`,args:[u,em,hashPassword(p),role,now,a.r==="manager"?"SYSTEM":a.u]});
 await c.execute({sql:`INSERT INTO audit_log(event_type,actor_display,subject_username,action,created_at) VALUES(?,?,?,?,?)`,args:["account",a.r==="manager"?"SYSTEM":a.u,u,`Created ${role} account`,now]});
 return json(201,{ok:true})}catch(x){console.error(x);return json(400,{error:x.message?.includes("UNIQUE")?"Username or email already exists.":"Could not create account."})}};
