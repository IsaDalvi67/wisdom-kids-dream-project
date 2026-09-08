import crypto from "node:crypto";
import {db,ensureSchema} from "./db.mjs";
const b64=v=>Buffer.from(v).toString("base64url"),unb64=v=>Buffer.from(v,"base64url").toString();
const secret=()=>{const s=process.env.WKDP_SESSION_SECRET;if(!s)throw new Error("Session secret is not configured.");return s};
const sign=p=>crypto.createHmac("sha256",secret()).update(p).digest("base64url");
export function makeToken(user,stage="full",minutes=480){
 const payload=b64(JSON.stringify({u:user.username,r:user.role,id:user.id,stage,exp:Date.now()+minutes*60000}));
 return payload+"."+sign(payload);
}
export function verifyToken(t){
 if(!t||!t.includes("."))return null;const[p,s]=t.split("."),e=sign(p);
 if(s.length!==e.length||!crypto.timingSafeEqual(Buffer.from(s),Buffer.from(e)))return null;
 try{const d=JSON.parse(unb64(p));return d.u&&Date.now()<d.exp?d:null}catch{return null}
}
export function authFromEvent(e,full=true){
 const h=e.headers.authorization||e.headers.Authorization||"",a=verifyToken(h.startsWith("Bearer ")?h.slice(7):"");
 return a&&(!full||a.stage==="full")?a:null;
}
export function hashPassword(p,salt=crypto.randomBytes(16).toString("hex")){
 const h=crypto.scryptSync(String(p),salt,64).toString("hex");return `scrypt$${salt}$${h}`;
}
export function checkPassword(p,stored){
 try{const[,salt,h]=stored.split("$"),x=crypto.scryptSync(String(p),salt,64);return crypto.timingSafeEqual(x,Buffer.from(h,"hex"))}catch{return false}
}
export async function bootstrap(){
 const c=db();await ensureSchema(c);
 const count=Number((await c.execute(`SELECT COUNT(*) n FROM staff_users`)).rows[0].n);
 if(count===0){
   const now=new Date().toISOString();
   const mu=process.env.WKDP_MANAGER_USER,mp=process.env.WKDP_MANAGER_PASSWORD,me=process.env.WKDP_MANAGER_EMAIL;
   if(mu&&mp&&me)await c.execute({sql:`INSERT INTO staff_users(username,email,password_hash,role,created_at,created_by) VALUES(?,?,?,?,?,?)`,args:[mu,me.toLowerCase(),hashPassword(mp),"manager",now,"SYSTEM"]});
   const au=process.env.WKDP_STAFF_USER,ap=process.env.WKDP_STAFF_PASSWORD,ae=process.env.WKDP_ADMIN_EMAIL;
   if(au&&ap&&ae)await c.execute({sql:`INSERT OR IGNORE INTO staff_users(username,email,password_hash,role,created_at,created_by) VALUES(?,?,?,?,?,?)`,args:[au,ae.toLowerCase(),hashPassword(ap),"admin",now,"SYSTEM"]});
 }
 return c;
}

export const requireRole=(a,roles)=>a&&roles.includes(a.r);
