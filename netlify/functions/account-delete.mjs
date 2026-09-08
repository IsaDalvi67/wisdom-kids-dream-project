import {json} from "./lib/db.mjs";import {authFromEvent,bootstrap,requireRole} from "./lib/auth.mjs";
export const handler=async e=>{if(e.httpMethod!=="POST")return json(405,{error:"Method not allowed."});try{
 const a=authFromEvent(e);if(!a)return json(401,{error:"Unauthorized."});if(!requireRole(a,["admin","manager"]))return json(403,{error:"Forbidden."});
 const b=JSON.parse(e.body||"{}"),u=String(b.username||""),reason=String(b.reason||"").trim(),c=await bootstrap();
 const t=(await c.execute({sql:`SELECT role FROM staff_users WHERE username=?`,args:[u]})).rows[0];if(!t)return json(404,{error:"Account not found."});
 if(t.role==="manager")return json(403,{error:"Manager accounts cannot be deleted here."});
 if(t.role==="admin"&&a.r!=="manager")return json(409,{error:"MANAGER_VERIFICATION_REQUIRED"});
 if(a.r==="manager"&&!reason)return json(400,{error:"A deletion reason is required."});
 if(a.r==="admin"&&t.role!=="staff")return json(403,{error:"Admins can directly delete Staff accounts only."});
 await c.execute({sql:`DELETE FROM staff_users WHERE username=?`,args:[u]});
 await c.execute({sql:`INSERT INTO audit_log(event_type,actor_display,subject_username,action,reason,created_at) VALUES(?,?,?,?,?,?)`,
  args:["account",a.r==="manager"?"SYSTEM":a.u,u,`Deleted ${t.role} account`,reason||null,new Date().toISOString()]});
 return json(200,{ok:true})}catch(x){console.error(x);return json(500,{error:"Could not delete account."})}};
