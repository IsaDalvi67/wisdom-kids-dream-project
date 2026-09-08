import crypto from "node:crypto";

const b64=v=>Buffer.from(v).toString("base64url");
const unb64=v=>Buffer.from(v,"base64url").toString();

function secret(){const s=process.env.WKDP_SESSION_SECRET;if(!s)throw new Error("Session secret is not configured.");return s}
function sign(payload){return crypto.createHmac("sha256",secret()).update(payload).digest("base64url")}
export function makeToken(username){
  const payload=b64(JSON.stringify({u:username,exp:Date.now()+8*60*60*1000}));
  return payload+"."+sign(payload);
}
export function verifyToken(token){
  if(!token||!token.includes("."))return null;
  const [p,s]=token.split(".");
  const expected=sign(p);
  if(s.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(s),Buffer.from(expected)))return null;
  try{const d=JSON.parse(unb64(p));if(!d.u||Date.now()>d.exp)return null;return d}catch{return null}
}
export function authFromEvent(event){
  const h=event.headers.authorization||event.headers.Authorization||"";
  return verifyToken(h.startsWith("Bearer ")?h.slice(7):"");
}
