import { HfInference } from "@huggingface/inference";
import { NextRequest, NextResponse } from "next/server";

// The secret sauce: coloring book style prompt prefix
const STYLE_PREFIX = `Coloring book page illustration, black and white line art, clean bold outlines, no shading, no gradients, no color fill, no grayscale, simple design suitable for children to color in, white background, thick black lines, cartoon style, cute and friendly, `;

// Negative prompt to reinforce what we don't want
const NEGATIVE_PROMPT = `color, colored, shading, gradient, grayscale, gray, photorealistic, photo, 3d render, shadows, texture, filled areas, painted, watercolor, scary, dark, violent`;

export async function POST(request: NextRequest) {
  try {
    const { prompt, width = 1024, height = 1024 } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Please describe what you'd like to color!" },
        { status: 400 }
      );
    }

    // Sanitize prompt length
    const sanitizedPrompt = prompt.trim().slice(0, 200);
    
    // Build the full prompt
    const fullPrompt = `${STYLE_PREFIX}${sanitizedPrompt}`;

    const token = process.env.HF_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Oops! The coloring machine isn't set up yet. Please add your HF_TOKEN." },
        { status: 500 }
      );
    }

    const client = new HfInference(token);
    const model = process.env.HF_MODEL || "black-forest-labs/FLUX.1-schnell";

    console.log(`[Inklings] Generating: ${sanitizedPrompt.slice(0, 50)}...`);

    const image = await client.textToImage({
      model,
      inputs: fullPrompt,
      parameters: {
        width,
        height,
        num_inference_steps: model.includes("schnell") ? 4 : 25,
        guidance_scale: 3.5,
      },
    });

    // Convert blob to base64
    const arrayBuffer = await image.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    return NextResponse.json({
      success: true,
      image: dataUrl,
      prompt: sanitizedPrompt,
    });
  } catch (err) {
    console.error("[Inklings] Generation error:", err);
    
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    
    if (errorMessage.includes("rate limit")) {
      return NextResponse.json(
        { error: "Whoa, too many drawings! Please wait a moment and try again." },
        { status: 429 }
      );
    }
    
    if (errorMessage.includes("authorization") || errorMessage.includes("401")) {
      return NextResponse.json(
        { error: "The coloring machine needs a valid HF_TOKEN to work!" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Oops! Something went wrong. Please try again!" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Inklings coloring page generator is ready!",
    model: process.env.HF_MODEL || "black-forest-labs/FLUX.1-schnell",
  });
}
