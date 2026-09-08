import {json} from "./lib/db.mjs";import {authFromEvent,bootstrap,requireRole} from "./lib/auth.mjs";
export const handler=async e=>{if(e.httpMethod!=="POST")return json(405,{error:"Method not allowed."});try{
 const a=authFromEvent(e);if(!a)return json(401,{error:"Unauthorized."});if(!requireRole(a,["admin","manager"]))return json(403,{error:"Forbidden."});
 const b=JSON.parse(e.body||"{}"),u=String(b.username||""),active=b.active?1:0,c=await bootstrap();
 const t=(await c.execute({sql:`SELECT role FROM staff_users WHERE username=?`,args:[u]})).rows[0];if(!t)return json(404,{error:"Account not found."});
 if(t.role==="manager"&&a.r!=="manager")return json(403,{error:"Only Account Manager can manage Manager accounts."});
 if(t.role==="admin"&&a.r!=="manager")return json(403,{error:"Admins cannot disable Admin accounts."});
 await c.execute({sql:`UPDATE staff_users SET active=? WHERE username=?`,args:[active,u]});
 await c.execute({sql:`INSERT INTO audit_log(event_type,actor_display,subject_username,action,created_at) VALUES(?,?,?,?,?)`,args:["account",a.r==="manager"?"SYSTEM":a.u,u,active?"Account enabled":"Account disabled",new Date().toISOString()]});
 return json(200,{ok:true})}catch(x){console.error(x);return json(500,{error:"Could not update account."})}};
