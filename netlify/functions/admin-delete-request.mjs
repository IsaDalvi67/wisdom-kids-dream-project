import {json} from "./lib/db.mjs";
import {authFromEvent,bootstrap} from "./lib/auth.mjs";
export const handler=async e=>{
 if(e.httpMethod!=="POST")return json(405,{error:"Method not allowed."});
 try{
  const a=authFromEvent(e);
  if(!a||a.r!=="admin")return json(403,{error:"Admin access required."});
  const b=JSON.parse(e.body||"{}"),target=String(b.username||"").trim(),reason=String(b.reason||"").trim();
  if(!reason)return json(400,{error:"Deletion reason is required."});
  const c=await bootstrap();
  const t=(await c.execute({sql:`SELECT role FROM staff_users WHERE username=?`,args:[target]})).rows[0];
  if(!t||t.role!=="admin")return json(400,{error:"Target must be an Admin account."});
  await c.execute({sql:`INSERT INTO audit_log(event_type,actor_display,subject_username,action,reason,details_json,created_at)
    VALUES(?,?,?,?,?,?,?)`,
    args:["admin-delete-request",a.u,target,"Requested Admin deletion",reason,JSON.stringify({status:"awaiting_manager"}),new Date().toISOString()]});
  return json(200,{ok:true,message:"Deletion request sent for Account Manager approval."});
 }catch(x){console.error(x);return json(500,{error:"Could not request Admin deletion."})}
};
