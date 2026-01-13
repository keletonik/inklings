import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const STYLE_PREFIX = `Coloring book page, black and white line art, clean bold outlines, no shading, no color, white background, thick black lines, simple design for children to color, `;

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    if (!prompt?.trim()) {
      return NextResponse.json({ success: false, error: "Please enter a prompt!" }, { status: 400 });
    }

    const output = await replicate.run("black-forest-labs/flux-schnell", {
      input: { prompt: `${STYLE_PREFIX}${prompt.trim()}`, num_outputs: 1 }
    });

    const imageUrl = (output as string[])[0];
    const imgRes = await fetch(imageUrl);
    const buf = await imgRes.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");

    return NextResponse.json({ success: true, image: `data:image/png;base64,${b64}`, prompt: prompt.trim() });
  } catch (err: any) {
    console.error("[Inklings]", err);
    return NextResponse.json({ success: false, error: "Generation failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ready" });
}
