import {db,ensureSchema,json,istDateParts} from "./lib/db.mjs";

export const handler=async(event)=>{
  if(event.httpMethod!=="POST")return json(405,{error:"Method not allowed."});
  try{
    const b=JSON.parse(event.body||"{}");
    const amount=Number(b.amount), method=String(b.payment_method||"").toLowerCase();
    const name=String(b.donor_name||"").trim(), email=String(b.donor_email||"").trim().toLowerCase();
    const phone=String(b.donor_phone||"").trim(), pan=String(b.donor_pan||"").trim().toUpperCase(), message=String(b.donor_message||"").trim();
    if(!Number.isFinite(amount)||amount<=0||amount>1090000000)return json(400,{error:"Enter a valid donation amount."});
    if(!name||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json(400,{error:"Name and a valid email are required."});
    if(!["upi","bank"].includes(method))return json(400,{error:"Invalid payment method."});
    if(pan&&!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan))return json(400,{error:"PAN format is invalid."});

    const c=db();await ensureSchema(c);
    const {dd,mm,yy}=istDateParts(), key=`20${yy}-${mm}-${dd}`;
    const seq=await c.execute({sql:`INSERT INTO daily_sequences(donation_date,last_number)
      VALUES(?,1) ON CONFLICT(donation_date) DO UPDATE SET last_number=last_number+1 RETURNING last_number`,args:[key]});
    const n=Number(seq.rows[0].last_number);
    if(n>9999)return json(503,{error:"Daily donation number limit reached."});
    const ref=`WKDP-${dd}${mm}${yy}-${String(n).padStart(4,"0")}`;
    const now=new Date().toISOString();
    await c.execute({sql:`INSERT INTO donations(donation_ref,amount,payment_method,status,donor_name,donor_email,donor_phone,donor_pan,donor_message,created_at)
      VALUES(?,?,?,?,?,?,?,?,?,?)`,args:[ref,amount,method,"Pending",name,email,phone||null,pan||null,message||null,now]});
    return json(200,{donation_ref:ref,status:"Pending",amount,payment_method:method});
  }catch(e){console.error(e);return json(500,{error:"Could not create the donation record."})}
};