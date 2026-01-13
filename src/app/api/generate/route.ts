import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const STYLE = "Coloring book page, black and white line art, clean bold outlines, no shading, no color, white background, thick black lines, simple design for children to color, ";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt?.trim()) return NextResponse.json({ success: false, error: "Enter a prompt" }, { status: 400 });

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    const out = await replicate.run("black-forest-labs/flux-schnell", { input: { prompt: STYLE + prompt.trim() } });
    
    const res = await fetch((out as string[])[0]);
    const b64 = Buffer.from(await res.arrayBuffer()).toString("base64");
    
    return NextResponse.json({ success: true, image: `data:image/png;base64,${b64}`, prompt: prompt.trim() });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}

export async function GET() { return NextResponse.json({ ok: true }); }
