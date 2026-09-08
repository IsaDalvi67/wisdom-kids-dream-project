
import {json} from "./lib/db.mjs";
import {authFromEvent,bootstrap,hashPassword} from "./lib/auth.mjs";

export const handler=async e=>{
 if(e.httpMethod!=="POST")return json(405,{error:"Method not allowed."});
 try{
  const a=authFromEvent(e);
  if(!a||!["admin","manager"].includes(a.r))return json(403,{error:"Admin or Account Manager access required."});

  const b=JSON.parse(e.body||"{}");
  const username=String(b.username||"").trim();
  const password=String(b.password||"");
  const requestedRole=String(b.role||"staff").toLowerCase();

  if(!username)return json(400,{error:"Username is required."});
  if(password.length<10)return json(400,{error:"Password must be at least 10 characters."});
  if(!["staff","admin","manager"].includes(requestedRole))return json(400,{error:"Invalid role."});

  // Admins may create Staff only. Managers may create any account type.
  if(a.r==="admin" && requestedRole!=="staff")
    return json(403,{error:"Admins can create Staff accounts only."});

  const c=await bootstrap();
  const exists=await c.execute({sql:`SELECT id FROM staff_users WHERE username=?`,args:[username]});
  if(exists.rows.length)return json(409,{error:"Username already exists."});

  // Existing V8 databases require a non-null unique email. This internal placeholder
  // is not a real mailbox and is not used for verification.
  const placeholder=`${username.toLowerCase().replace(/[^a-z0-9._-]/g,"_")}@${requestedRole}.wkdp.invalid`;

  await c.execute({
   sql:`INSERT INTO staff_users(username,email,password_hash,role,active,created_at,created_by)
        VALUES(?,?,?,?,1,?,?)`,
   args:[username,placeholder,hashPassword(password),requestedRole,new Date().toISOString(),a.r==="manager"?"SYSTEM":a.u]
  });

  await c.execute({
   sql:`INSERT INTO audit_log(event_type,actor_display,subject_username,action,reason,details_json,created_at)
        VALUES(?,?,?,?,?,?,?)`,
   args:["account",a.r==="manager"?"SYSTEM":a.u,username,`Created ${requestedRole} account`,"",
         JSON.stringify({role:requestedRole}),new Date().toISOString()]
  });

  return json(200,{ok:true,username,role:requestedRole});
 }catch(x){
  console.error(x);
  if(String(x?.message||"").toLowerCase().includes("unique"))
    return json(409,{error:"Username already exists."});
  return json(500,{error:"Could not create account."});
 }
};
