import {NextResponse} from "next/server";
import {komiku} from "../../../../lib/source";
export async function GET(req:Request){
  const q=new URL(req.url).searchParams.get("q")||"";
  if(!q)return NextResponse.json({data:[]});
  try{return NextResponse.json(await komiku.search(q))}
  catch(e){return NextResponse.json({error:"Source unavailable"},{status:502})}
}