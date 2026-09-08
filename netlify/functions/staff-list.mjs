import {db,ensureSchema,json} from "./lib/db.mjs";import {authFromEvent} from "./lib/auth.mjs";
export const handler=async e=>{
 try{
  const a=authFromEvent(e);if(!a)return json(401,{error:"Unauthorized or expired session."});
  const c=db();await ensureSchema(c);
  const d=await c.execute(`SELECT donation_ref,amount,payment_method,status,donor_name,donor_email,donor_phone,donor_pan,donor_message,created_at,reviewed_at,reviewed_by FROM donations ORDER BY id DESC LIMIT 300`);
  const q=await c.execute(`SELECT id,event_type,actor_display,donation_ref,amount,subject_username,action,reason,created_at FROM audit_log ORDER BY id DESC LIMIT 500`);
  return json(200,{records:d.rows,audit:q.rows,role:a.r});
 }catch(x){console.error(x);return json(500,{error:"Could not load staff data."})}
};
