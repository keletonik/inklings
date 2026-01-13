import { NextRequest, NextResponse } from "next/server";
import { Client } from "@gradio/client";

const STYLE_PREFIX = `Coloring book page, black and white line art only, clean bold outlines, no shading, no color, white background, thick black lines, cartoon style, cute, simple design for children to color, `;

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    if (!prompt?.trim()) {
      return NextResponse.json({ success: false, error: "Please enter a prompt!" }, { status: 400 });
    }

    const fullPrompt = `${STYLE_PREFIX}${prompt.trim().slice(0, 200)}`;
    
    console.log("[Inklings] Connecting to Qwen-Image-Fast...");
    const client = await Client.connect("multimodalart/Qwen-Image-Fast");

    console.log("[Inklings] Generating...");
    const result = await client.predict("/Qwen_Image_Fast_infer", {
      prompt: fullPrompt,
      aspect_ratio: "1:1",
      guidance_scale: 1,
      num_inference_steps: 8,
      prompt_enhance: false,
      randomize_seed: true,
      seed: Math.floor(Math.random() * 999999),
    });

    console.log("[Inklings] Got result");
    const data = result.data as any[];
    
    if (!data?.[0]?.url && !data?.[0]?.path && typeof data?.[0] !== 'string') {
      console.log("[Inklings] Data structure:", JSON.stringify(data).slice(0, 500));
      throw new Error("No image in response");
    }

    let imageUrl = data[0]?.url || data[0]?.path || data[0];
    console.log("[Inklings] URL:", String(imageUrl).slice(0, 100));

    if (typeof imageUrl === 'string' && imageUrl.startsWith("data:")) {
      return NextResponse.json({ success: true, image: imageUrl, prompt: prompt.trim() });
    }

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Fetch failed: ${imgRes.status}`);

    const buf = await imgRes.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");
    const mime = imgRes.headers.get("content-type")?.includes("jpeg") ? "image/jpeg" : "image/png";

    return NextResponse.json({ success: true, image: `data:${mime};base64,${b64}`, prompt: prompt.trim() });

  } catch (err: any) {
    console.error("[Inklings] Error:", err?.message || err);
    return NextResponse.json({ success: false, error: "Generation failed - try again!" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ready" });
}
