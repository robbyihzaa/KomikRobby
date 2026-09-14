import {NextResponse} from "next/server";
import {komiku} from "../../../../lib/source";
export async function GET(req:Request){
  const p=Number(new URL(req.url).searchParams.get("page")||1);
  try{return NextResponse.json(await komiku.latest(p))}
  catch(e){return NextResponse.json({error:"Source unavailable"},{status:502})}
}