import {db,ensureSchema,json} from "./lib/db.mjs";
export const handler=async(event)=>{
  try{
    const ref=String(event.queryStringParameters?.ref||"").trim().toUpperCase();
    const email=String(event.queryStringParameters?.email||"").trim().toLowerCase();
    if(!/^WKDP-\d{6}-\d{4}$/.test(ref)||!email)return json(400,{error:"Enter a valid Donation Number and email."});
    const c=db();await ensureSchema(c);
    const r=await c.execute({sql:`SELECT donation_ref,status,amount,payment_method,created_at,reviewed_at FROM donations WHERE donation_ref=? AND donor_email=? LIMIT 1`,args:[ref,email]});
    if(!r.rows.length)return json(404,{error:"No matching donation record was found."});
    return json(200,r.rows[0]);
  }catch(e){console.error(e);return json(500,{error:"Could not check donation status."})}
};