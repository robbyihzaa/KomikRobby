import {NextResponse} from "next/server";
import {pool} from "../../../lib/db";
export async function GET(){
  try{await pool.query("select 1"); return NextResponse.json({ok:true,database:true})}
  catch(e){return NextResponse.json({ok:false,database:false},{status:503})}
}