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
  const c=await db();

  await c.execute(`CREATE TABLE IF NOT EXISTS staff_users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('staff','admin','manager')),
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    created_by TEXT
  )`);

  await c.execute(`CREATE TABLE IF NOT EXISTS audit_log(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT,
    actor_display TEXT,
    donation_ref TEXT,
    amount REAL,
    subject_username TEXT,
    action TEXT,
    reason TEXT,
    details_json TEXT,
    created_at TEXT NOT NULL
  )`);

  await c.execute(`CREATE TABLE IF NOT EXISTS auth_codes(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purpose TEXT,
    username TEXT,
    email TEXT,
    code_hash TEXT,
    expires_at TEXT,
    used INTEGER DEFAULT 0,
    meta_json TEXT,
    created_at TEXT
  )`);

  const now = new Date().toISOString();

  // Ensure Manager exists if env vars are configured.
  const managerUser = String(process.env.WKDP_MANAGER_USER || "").trim();
  const managerPass = String(process.env.WKDP_MANAGER_PASSWORD || "");
  if(managerUser && managerPass){
    const existingManager = await c.execute({
      sql:`SELECT id,role FROM staff_users WHERE username=?`,
      args:[managerUser]
    });
    if(!existingManager.rows.length){
      await c.execute({
        sql:`INSERT INTO staff_users(username,email,password_hash,role,active,created_at,created_by)
             VALUES(?,?,?,?,1,?,?)`,
        args:[managerUser,null,hashPassword(managerPass),"manager",now,"SYSTEM"]
      });
    }
  }

  // Ensure first Admin exists if env vars are configured.
  const adminUser = String(process.env.WKDP_STAFF_USER || "").trim();
  const adminPass = String(process.env.WKDP_STAFF_PASSWORD || "");
  if(adminUser && adminPass){
    const existingAdmin = await c.execute({
      sql:`SELECT id,role FROM staff_users WHERE username=?`,
      args:[adminUser]
    });
    if(!existingAdmin.rows.length){
      await c.execute({
        sql:`INSERT INTO staff_users(username,email,password_hash,role,active,created_at,created_by)
             VALUES(?,?,?,?,1,?,?)`,
        args:[adminUser,null,hashPassword(adminPass),"admin",now,"SYSTEM"]
      });
    }
  }

  return c;
}

export const requireRole=(a,roles)=>a&&roles.includes(a.r);
