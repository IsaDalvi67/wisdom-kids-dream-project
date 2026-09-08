import {db,ensureSchema,json} from "./lib/db.mjs";import {authFromEvent,requireRole} from "./lib/auth.mjs";
export const handler=async e=>{
 if(e.httpMethod!=="POST")return json(405,{error:"Method not allowed."});
 try{
  const securityClient=await bootstrap();
  await securityClient.execute(`CREATE TABLE IF NOT EXISTS security_state(id INTEGER PRIMARY KEY CHECK(id=1),mode TEXT NOT NULL DEFAULT 'normal',updated_at TEXT,updated_by TEXT)`);
  const securityMode=await securityClient.execute(`SELECT mode FROM security_state WHERE id=1`);
  if(securityMode.rows.length && securityMode.rows[0].mode!=="normal") return json(423,{error:"Donation verification is frozen during security recovery."});
  const a=authFromEvent(e);if(!a)return json(401,{error:"Unauthorized or expired session."});
  if(!requireRole(a,["staff","admin"]))return json(403,{error:"Account Managers cannot verify or reject donations."});
  const b=JSON.parse(e.body||"{}"),ref=String(b.donation_ref||"").trim().toUpperCase(),status=String(b.status||"");
  if(!/^WKDP-\d{6}-\d{4}$/.test(ref)||!["Pending","Verified","Rejected"].includes(status))return json(400,{error:"Invalid Donation Number or status."});
  const c=db();await ensureSchema(c);
  const old=await c.execute({sql:`SELECT amount,status FROM donations WHERE donation_ref=?`,args:[ref]});if(!old.rows.length)return json(404,{error:"Donation not found."});
  const reviewedAt=status==="Pending"?null:new Date().toISOString(),reviewedBy=status==="Pending"?null:a.u;
  await c.execute({sql:`UPDATE donations SET status=?,reviewed_at=?,reviewed_by=? WHERE donation_ref=?`,args:[status,reviewedAt,reviewedBy,ref]});
  await c.execute({sql:`INSERT INTO audit_log(event_type,actor_display,donation_ref,amount,action,details_json,created_at) VALUES(?,?,?,?,?,?,?)`,
   args:["donation-status",a.u,ref,old.rows[0].amount,`${old.rows[0].status} → ${status}`,JSON.stringify({role:a.r}),new Date().toISOString()]});
  return json(200,{donation_ref:ref,status,reviewed_at:reviewedAt,reviewed_by:reviewedBy});
 }catch(x){console.error(x);return json(500,{error:"Could not update donation status."})}
};
