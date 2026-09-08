import { json } from "./lib/db.mjs";
import { bootstrap, requireAuth, hashPassword } from "./lib/auth.mjs";

export const handler=async(event)=>{
  if(event.httpMethod!=="POST") return json(405,{error:"Method not allowed."});
  try{
    const db=await bootstrap();
    const auth=requireAuth(event);
    if(!auth || auth.r!=="recovery")
      return json(403,{error:"Recovery account required."});

    const body=JSON.parse(event.body||"{}");
    const id=Number(body.id);
    if(!Number.isInteger(id)||id<1) return json(400,{error:"Invalid account."});

    const found=await db.execute({
      sql:`SELECT id,username,role,active FROM staff_users WHERE id=?`,args:[id]
    });
    if(!found.rows.length) return json(404,{error:"Account not found."});

    const current=found.rows[0];
    const sets=[],args=[],changed=[];

    if(body.username!==undefined){
      const username=String(body.username).trim();
      if(username.length<3) return json(400,{error:"Username must be at least 3 characters."});
      sets.push("username=?"); args.push(username); changed.push("username");
    }
    if(body.role!==undefined){
      const role=String(body.role).toLowerCase();
      if(!["staff","admin","manager"].includes(role))
        return json(400,{error:"Invalid role."});
      sets.push("role=?"); args.push(role); changed.push("role");
    }
    if(body.active!==undefined){
      sets.push("active=?"); args.push(body.active?1:0); changed.push("active");
    }
    if(body.password){
      const password=String(body.password);
      if(password.length<10) return json(400,{error:"New password must be at least 10 characters."});
      sets.push("password_hash=?"); args.push(hashPassword(password)); changed.push("password_reset");
    }
    if(!sets.length) return json(400,{error:"No changes supplied."});

    args.push(id);
    await db.execute({sql:`UPDATE staff_users SET ${sets.join(",")} WHERE id=?`,args});

    await db.execute({
      sql:`INSERT INTO audit_log(event_type,actor_display,action,reason,details_json,created_at)
           VALUES(?,?,?,?,?,?)`,
      args:["account","SYSTEM","Recovery account edit",
            String(body.reason||"Recovery maintenance"),
            JSON.stringify({target_id:id,target_username:current.username,changed}),
            new Date().toISOString()]
    });

    return json(200,{ok:true,changed});
  }catch(err){
    console.error(err);
    return json(500,{error:"Recovery edit failed."});
  }
};