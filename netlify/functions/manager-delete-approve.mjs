import {json} from "./lib/db.mjs";
import {authFromEvent,bootstrap} from "./lib/auth.mjs";
export const handler=async e=>{
 if(e.httpMethod!=="POST")return json(405,{error:"Method not allowed."});
 try{
  const a=authFromEvent(e);
  if(!a||a.r!=="manager")return json(403,{error:"Account Manager access required."});
  const b=JSON.parse(e.body||"{}"),target=String(b.username||"").trim(),reason=String(b.reason||"").trim();
  const c=await bootstrap();
  const t=(await c.execute({sql:`SELECT role FROM staff_users WHERE username=?`,args:[target]})).rows[0];
  if(!t||t.role!=="admin")return json(400,{error:"Target must be an Admin."});
  const admins=Number((await c.execute(`SELECT COUNT(*) n FROM staff_users WHERE role='admin' AND active=1`)).rows[0].n);
  if(admins<=1)return json(409,{error:"Cannot delete the last active Admin."});
  await c.execute({sql:`DELETE FROM staff_users WHERE username=? AND role='admin'`,args:[target]});
  await c.execute({sql:`INSERT INTO audit_log(event_type,actor_display,subject_username,action,reason,details_json,created_at)
    VALUES(?,?,?,?,?,?,?)`,
    args:["account","SYSTEM",target,"Deleted admin account",reason||"Approved by Account Manager",JSON.stringify({approved_by_manager:true}),new Date().toISOString()]});
  return json(200,{ok:true});
 }catch(x){console.error(x);return json(500,{error:"Could not delete Admin account."})}
};
