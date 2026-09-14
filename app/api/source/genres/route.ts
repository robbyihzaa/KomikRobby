import {NextResponse} from "next/server";
import {komiku} from "../../../../lib/source";
export async function GET(){
  try{return NextResponse.json(await komiku.genres())}
  catch(e){return NextResponse.json({error:"Source unavailable"},{status:502})}
}