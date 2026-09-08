import {db,ensureSchema,json} from "./lib/db.mjs";import {authFromEvent} from "./lib/auth.mjs";
export const handler=async(event)=>{
  try{
    const a=authFromEvent(event);if(!a)return json(401,{error:"Unauthorized or expired session."});
    const c=db();await ensureSchema(c);
    const r=await c.execute(`SELECT donation_ref,amount,payment_method,status,donor_name,donor_email,donor_phone,donor_pan,donor_message,created_at,reviewed_at,reviewed_by FROM donations ORDER BY id DESC LIMIT 200`);
    return json(200,{records:r.rows});
  }catch(e){console.error(e);return json(500,{error:"Could not load donation records."})}
};