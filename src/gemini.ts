import { GoogleGenAI } from "@google/genai";

interface GeminiConfig {
  project: string;
  location: string;
  model: string;
}

function getConfig(): GeminiConfig {
  const project = process.env.VERTEX_PROJECT;
  if (!project) {
    throw new Error(
      "VERTEX_PROJECT environment variable is required. " +
        "Set it to your Google Cloud project ID.",
    );
  }
  return {
    project,
    location: process.env.VERTEX_LOCATION ?? "us-central1",
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-image",
  };
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const config = getConfig();
    client = new GoogleGenAI({
      vertexai: true,
      project: config.project,
      location: config.location,
    });
  }
  return client;
}

export interface GenerateImageResult {
  imageBase64: string;
  mimeType: string;
  text?: string;
}

export async function generateImage(
  prompt: string,
  aspectRatio: string,
): Promise<GenerateImageResult> {
  const config = getConfig();
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: config.model,
    contents: prompt,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio,
      },
    },
  });

  let imageBase64: string | undefined;
  let mimeType = "image/png";
  let text: string | undefined;

  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) {
    throw new Error("No response parts from Gemini API");
  }

  for (const part of parts) {
    if (part.text) {
      text = part.text;
    } else if (part.inlineData) {
      imageBase64 = part.inlineData.data;
      mimeType = part.inlineData.mimeType ?? "image/png";
    }
  }

  if (!imageBase64) {
    throw new Error(
      "No image data in Gemini response. " +
        "The model may have refused to generate the image due to safety filters.",
    );
  }

  return { imageBase64, mimeType, text };
}
