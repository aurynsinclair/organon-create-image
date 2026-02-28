#!/usr/bin/env node
/**
 * Test script for Gemini image generation models.
 *
 * Usage:
 *   node scripts/test-model.mjs [model-name]
 *
 * Examples:
 *   node scripts/test-model.mjs gemini-2.5-flash-image
 *   node scripts/test-model.mjs gemini-3-pro-image-preview
 *
 * Authentication (picks the first available):
 *   1. GEMINI_API_KEY         → AI Studio (google.generativeai)
 *   2. VERTEX_PROJECT         → Vertex AI (requires ADC or GOOGLE_APPLICATION_CREDENTIALS)
 *
 * Environment variables:
 *   GEMINI_API_KEY  (option 1) - AI Studio API key
 *   VERTEX_PROJECT  (option 2) - GCP project ID
 *   VERTEX_LOCATION (optional) - default: us-central1
 *   GEMINI_MODEL    (optional) - default model if not passed as argv
 */

import { GoogleGenAI } from "@google/genai";

const model =
  process.argv[2] || process.env.GEMINI_MODEL || "gemini-2.5-flash-image";
const apiKey = process.env.GEMINI_API_KEY;
const project = process.env.VERTEX_PROJECT;
const location = process.env.VERTEX_LOCATION || "us-central1";

let ai;
let backend;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
  backend = "AI Studio";
} else if (project) {
  ai = new GoogleGenAI({ vertexai: true, project, location });
  backend = `Vertex AI (${project} / ${location})`;
} else {
  console.error(
    "ERROR: Set GEMINI_API_KEY (AI Studio) or VERTEX_PROJECT (Vertex AI).",
  );
  process.exit(1);
}

console.log(`Backend: ${backend}`);
console.log(`Model:   ${model}`);
console.log();

try {
  console.log("Sending request...");
  const t0 = Date.now();

  const response = await ai.models.generateContent({
    model,
    contents: "Generate a simple red circle on a white background.",
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const parts = response.candidates?.[0]?.content?.parts || [];

  let hasImage = false;
  let imageBytes = 0;
  let text = "";

  for (const part of parts) {
    if (part.inlineData) {
      hasImage = true;
      imageBytes = part.inlineData.data?.length || 0;
    }
    if (part.text) {
      text = part.text;
    }
  }

  console.log(`SUCCESS (${elapsed}s)`);
  console.log(
    `  Image: ${hasImage ? `yes (${((imageBytes * 0.75) / 1024).toFixed(0)} KB base64-decoded)` : "no"}`,
  );
  if (text) console.log(`  Text:  ${text}`);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`FAILED: ${msg}`);
  process.exit(1);
}
