import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = "gemini-3-pro-image-preview";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    const project = process.env.VERTEX_PROJECT;

    if (apiKey) {
      client = new GoogleGenAI({ apiKey });
    } else if (project) {
      const location = process.env.VERTEX_LOCATION ?? "us-central1";
      client = new GoogleGenAI({ vertexai: true, project, location });
    } else {
      throw new Error(
        "Either GEMINI_API_KEY (AI Studio) or VERTEX_PROJECT (Vertex AI) is required.",
      );
    }
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
  model?: string,
): Promise<GenerateImageResult> {
  const resolvedModel = model ?? DEFAULT_MODEL;
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: resolvedModel,
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

export function _resetClientForTesting(): void {
  client = null;
}
