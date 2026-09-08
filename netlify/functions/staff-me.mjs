import {json} from "./lib/db.mjs";import {authFromEvent} from "./lib/auth.mjs";
export const handler=async e=>{const a=authFromEvent(e);return a?json(200,{username:a.u,role:a.r}):json(401,{error:"Unauthorized or expired session."})};
