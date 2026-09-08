import {db,ensureSchema,json} from "./lib/db.mjs";import {authFromEvent} from "./lib/auth.mjs";
export const handler=async(event)=>{
  if(event.httpMethod!=="POST")return json(405,{error:"Method not allowed."});
  try{
    const a=authFromEvent(event);if(!a)return json(401,{error:"Unauthorized or expired session."});
    const b=JSON.parse(event.body||"{}"), ref=String(b.donation_ref||"").trim().toUpperCase(), status=String(b.status||"");
    if(!/^WKDP-\d{6}-\d{4}$/.test(ref)||!["Pending","Verified","Rejected"].includes(status))return json(400,{error:"Invalid Donation Number or status."});
    const c=db();await ensureSchema(c);
    const reviewedAt=status==="Pending"?null:new Date().toISOString(), reviewedBy=status==="Pending"?null:a.u;
    const r=await c.execute({sql:`UPDATE donations SET status=?,reviewed_at=?,reviewed_by=? WHERE donation_ref=? RETURNING donation_ref,status,reviewed_at,reviewed_by`,args:[status,reviewedAt,reviewedBy,ref]});
    if(!r.rows.length)return json(404,{error:"Donation record not found."});
    return json(200,r.rows[0]);
  }catch(e){console.error(e);return json(500,{error:"Could not update donation status."})}
};