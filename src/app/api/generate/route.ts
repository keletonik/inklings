import { NextRequest, NextResponse } from "next/server";
import { Client } from "@gradio/client";

const STYLE_PREFIX = `Coloring book page illustration, black and white line art, clean bold outlines, no shading, no gradients, no color fill, no grayscale, simple design suitable for children to color in, white background, thick black lines, cartoon style, cute and friendly, `;

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    if (!prompt?.trim()) {
      return NextResponse.json({ success: false, error: "Please enter a prompt!" }, { status: 400 });
    }

    const fullPrompt = `${STYLE_PREFIX}${prompt.trim().slice(0, 200)}`;
    
    console.log("[Inklings] Connecting...");
    const client = await Client.connect("Tongyi-MAI/Z-Image-Turbo");

    console.log("[Inklings] Generating...");
    const result = await client.predict(0, [
      [],
      fullPrompt,
      true,
      "1024x1024 ( 1:1 )",
      Math.floor(Math.random() * 999999),
      3,
      8,
    ]);

    console.log("[Inklings] Result:", JSON.stringify(result.data).slice(0, 300));

    const data = result.data as any[];
    if (!data?.[0]?.[0]) throw new Error("No image in response");

    const img = data[0][0];
    const imageUrl = img.image?.url || img.image?.path || img.url || img.path;
    if (!imageUrl) throw new Error("No image URL");

    console.log("[Inklings] URL:", imageUrl.slice(0, 80));

    if (imageUrl.startsWith("data:")) {
      return NextResponse.json({ success: true, image: imageUrl, prompt: prompt.trim() });
    }

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Fetch failed: ${imgRes.status}`);

    const buf = await imgRes.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");
    const mime = imgRes.headers.get("content-type")?.includes("jpeg") ? "image/jpeg" : "image/png";

    return NextResponse.json({ success: true, image: `data:${mime};base64,${b64}`, prompt: prompt.trim() });

  } catch (err) {
    console.error("[Inklings] Error:", err);
    return NextResponse.json({ success: false, error: "Generation failed - try again!" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ready" });
}
