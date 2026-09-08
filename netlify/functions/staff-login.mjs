import {json} from "./lib/db.mjs";import {makeToken} from "./lib/auth.mjs";
export const handler=async(event)=>{
  if(event.httpMethod!=="POST")return json(405,{error:"Method not allowed."});
  try{
    const b=JSON.parse(event.body||"{}"), u=String(b.username||""), p=String(b.password||"");
    const expectedU=process.env.WKDP_STAFF_USER, expectedP=process.env.WKDP_STAFF_PASSWORD;
    if(!expectedU||!expectedP)return json(503,{error:"Staff login is not configured."});
    if(u!==expectedU||p!==expectedP)return json(401,{error:"Incorrect username or password."});
    return json(200,{token:makeToken(u),username:u});
  }catch{return json(400,{error:"Invalid request."})}
};