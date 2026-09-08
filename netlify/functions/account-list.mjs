import {json} from "./lib/db.mjs";import {authFromEvent,bootstrap,requireRole} from "./lib/auth.mjs";
export const handler=async e=>{try{const a=authFromEvent(e);if(!a)return json(401,{error:"Unauthorized."});if(!requireRole(a,["admin","manager"]))return json(403,{error:"Forbidden."});
 const c=await bootstrap(),r=await c.execute(`SELECT id,username,email,role,active,created_at,created_by FROM staff_users ORDER BY role,username`);
 return json(200,{accounts:r.rows,role:a.r})}catch(x){console.error(x);return json(500,{error:"Could not load accounts."})}};
