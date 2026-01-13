import { NextRequest, NextResponse } from "next/server";

const STYLE_PREFIX = `Coloring book page illustration, black and white line art, clean bold outlines, no shading, no gradients, no color fill, no grayscale, simple design suitable for children to color in, white background, thick black lines, cartoon style, cute and friendly, `;
const SPACE_URL = "https://tongyi-mai-z-image-turbo.hf.space";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const logs: string[] = [];
  const log = (m: string) => { logs.push(m); console.log(`[Inklings] ${m}`); };

  try {
    const { prompt } = await request.json();
    if (!prompt?.trim()) {
      return NextResponse.json({ success: false, error: "Please enter a prompt!" }, { status: 400 });
    }

    const fullPrompt = `${STYLE_PREFIX}${prompt.trim().slice(0, 200)}`;
    const session = `s${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    
    log(`Starting generation for: "${prompt.slice(0, 30)}..."`);

    const joinRes = await fetch(`${SPACE_URL}/queue/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [[], fullPrompt, true, "1024x1024 ( 1:1 )", 42, 3, 8],
        fn_index: 0,
        session_hash: session,
      }),
    });

    if (!joinRes.ok) {
      const txt = await joinRes.text();
      log(`Queue join failed: ${joinRes.status} - ${txt.slice(0, 200)}`);
      throw new Error("Queue join failed");
    }
    log("Joined queue");

    const dataRes = await fetch(`${SPACE_URL}/queue/data?session_hash=${session}`);
    if (!dataRes.ok || !dataRes.body) throw new Error("SSE connect failed");

    const reader = dataRes.body.getReader();
    const decoder = new TextDecoder();
    let imageUrl: string | null = null;
    let buffer = "";

    for (let i = 0; i < 200 && !imageUrl; i++) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const evt = JSON.parse(line.slice(6));
          log(`Event: ${evt.msg}`);

          if (evt.msg === "process_completed" && evt.output?.data) {
            const gallery = evt.output.data[0];
            if (Array.isArray(gallery) && gallery[0]) {
              const img = gallery[0];
              imageUrl = img.image?.url || img.image?.path || img.url || img.path || null;
            }
          }
          if (evt.msg === "error") throw new Error(evt.error || "Generation error");
        } catch (e) {
          if (!(e instanceof SyntaxError)) throw e;
        }
      }
    }
    reader.cancel();

    if (!imageUrl) {
      log("No image URL found");
      throw new Error("No image generated");
    }
    log(`Got image: ${imageUrl.slice(0, 80)}...`);

    if (imageUrl.startsWith("data:")) {
      return NextResponse.json({ success: true, image: imageUrl, prompt: prompt.trim() });
    }

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Image fetch failed: ${imgRes.status}`);

    const buf = await imgRes.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");
    const mime = imgRes.headers.get("content-type")?.includes("jpeg") ? "image/jpeg" : "image/png";

    log(`Done! ${buf.byteLength} bytes`);
    return NextResponse.json({ success: true, image: `data:${mime};base64,${b64}`, prompt: prompt.trim() });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`ERROR: ${msg}`);
    return NextResponse.json({ success: false, error: "Generation failed - please try again!", logs }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ready", space: "Tongyi-MAI/Z-Image-Turbo" });
}
