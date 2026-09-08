import { createClient } from "@libsql/client/web";

export function db(){
  const url=process.env.TURSO_DATABASE_URL;
  const authToken=process.env.TURSO_AUTH_TOKEN;
  if(!url||!authToken) throw new Error("Database is not configured.");
  return createClient({url,authToken});
}
export async function ensureSchema(client){
  await client.batch([
    `CREATE TABLE IF NOT EXISTS daily_sequences (
      donation_date TEXT PRIMARY KEY,
      last_number INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      donation_ref TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      donor_name TEXT NOT NULL,
      donor_email TEXT NOT NULL,
      donor_phone TEXT,
      donor_pan TEXT,
      donor_message TEXT,
      created_at TEXT NOT NULL,
      reviewed_at TEXT,
      reviewed_by TEXT
    )`,
    `CREATE INDEX IF NOT EXISTS idx_donations_email ON donations(donor_email)`,
    `CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status)`
  ],"write");
}
export function json(statusCode,obj){
  return {statusCode,headers:{"Content-Type":"application/json","Cache-Control":"no-store"},body:JSON.stringify(obj)};
}
export function istDateParts(){
  const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",day:"2-digit",month:"2-digit",year:"2-digit"}).formatToParts(new Date());
  const get=t=>parts.find(x=>x.type===t)?.value||"";
  return {dd:get("day"),mm:get("month"),yy:get("year")};
}
