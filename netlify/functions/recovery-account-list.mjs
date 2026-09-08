import { json } from "./lib/db.mjs";
import { bootstrap, requireAuth } from "./lib/auth.mjs";

export const handler=async(event)=>{
  if(event.httpMethod!=="GET") return json(405,{error:"Method not allowed."});
  try{
    const db=await bootstrap();
    const auth=requireAuth(event);
    if(!auth || auth.r!=="recovery")
      return json(403,{error:"Recovery account required."});
    const r=await db.execute(`SELECT id,username,role,active,created_at FROM staff_users ORDER BY role,username`);
    return json(200,{accounts:r.rows});
  }catch(err){
    console.error(err);
    return json(500,{error:"Could not load accounts."});
  }
};