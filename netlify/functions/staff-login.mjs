import {json} from "./lib/db.mjs";
import {bootstrap,checkPassword,makeToken} from "./lib/auth.mjs";
export const handler=async e=>{
 if(e.httpMethod!=="POST")return json(405,{error:"Method not allowed."});
 try{
  const b=JSON.parse(e.body||"{}"),u=String(b.username||"").trim(),p=String(b.password||"");
  const c=await bootstrap();
  const r=await c.execute({sql:`SELECT id,username,email,password_hash,role,active FROM staff_users WHERE username=?`,args:[u]});
  if(!r.rows.length||!Number(r.rows[0].active)||!checkPassword(p,r.rows[0].password_hash))
    return json(401,{error:"Incorrect username or password."});
  const x=r.rows[0];
  return json(200,{token:makeToken(x),username:x.username,role:x.role});
 }catch(x){console.error(x);return json(500,{error:"Login failed."})}
};
