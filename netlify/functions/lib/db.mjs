import { createClient } from "@libsql/client/web";
export function db(){
  const url=process.env.TURSO_DATABASE_URL,authToken=process.env.TURSO_AUTH_TOKEN;
  if(!url||!authToken)throw new Error("Database is not configured.");
  return createClient({url,authToken});
}
export async function ensureSchema(c){
  await c.batch([
    `CREATE TABLE IF NOT EXISTS daily_sequences(donation_date TEXT PRIMARY KEY,last_number INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS donations(
      id INTEGER PRIMARY KEY AUTOINCREMENT,donation_ref TEXT NOT NULL UNIQUE,amount REAL NOT NULL,
      payment_method TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Pending',donor_name TEXT NOT NULL,
      donor_email TEXT NOT NULL,donor_phone TEXT,donor_pan TEXT,donor_message TEXT,created_at TEXT NOT NULL,
      reviewed_at TEXT,reviewed_by TEXT)`,
    `CREATE INDEX IF NOT EXISTS idx_donations_email ON donations(donor_email)`,
    `CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status)`,
    `CREATE TABLE IF NOT EXISTS staff_users(
      id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT NOT NULL UNIQUE,email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('staff','admin','manager')),
      active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,created_by TEXT)`,
    `CREATE TABLE IF NOT EXISTS audit_log(
      id INTEGER PRIMARY KEY AUTOINCREMENT,event_type TEXT NOT NULL,actor_display TEXT NOT NULL,
      donation_ref TEXT,amount REAL,subject_username TEXT,action TEXT NOT NULL,reason TEXT,
      details_json TEXT,created_at TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at)`,
    `CREATE TABLE IF NOT EXISTS auth_codes(
      id INTEGER PRIMARY KEY AUTOINCREMENT,purpose TEXT NOT NULL,username TEXT NOT NULL,email TEXT NOT NULL,
      code_hash TEXT NOT NULL,expires_at TEXT NOT NULL,used INTEGER NOT NULL DEFAULT 0,meta_json TEXT,created_at TEXT NOT NULL)`
  ],"write");
}
export function json(statusCode,obj){return{statusCode,headers:{"Content-Type":"application/json","Cache-Control":"no-store"},body:JSON.stringify(obj)}}
export function istDateParts(){
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",day:"2-digit",month:"2-digit",year:"2-digit"}).formatToParts(new Date());
 const g=t=>parts.find(x=>x.type===t)?.value||"";return{dd:g("day"),mm:g("month"),yy:g("year")};
}
