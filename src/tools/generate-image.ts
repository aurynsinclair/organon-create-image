import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { generateImage } from "../gemini.js";

const inputSchema = {
  prompt: z
    .string()
    .describe(
      "Text prompt for image generation. English recommended. " +
        "More specific and detailed prompts yield better results.",
    ),
  aspect_ratio: z
    .enum([
      "1:1",
      "3:2",
      "2:3",
      "3:4",
      "4:3",
      "4:5",
      "5:4",
      "9:16",
      "16:9",
      "21:9",
    ])
    .default("1:1")
    .describe("Aspect ratio of the output image. Default: 1:1."),
  output_path: z
    .string()
    .describe(
      "File path to save the generated image (.png). " +
        "Example: C:/Users/palan/Pictures/output.png",
    ),
  model: z
    .string()
    .optional()
    .describe(
      "Gemini model name for image generation. " +
        "Default: gemini-3-pro-image-preview. " +
        "Example: gemini-2.5-flash-image",
    ),
};

export function registerGenerateImageTool(server: McpServer): void {
  server.registerTool(
    "generate_image",
    {
      title: "Generate Image",
      description:
        "Generate an image from a text prompt using Gemini. " +
        "The image is saved to the specified file path and also returned inline. " +
        "Supports various aspect ratios.",
      inputSchema,
    },
    async ({ prompt, aspect_ratio, output_path, model }) => {
      try {
        const dir = path.dirname(output_path);
        await fs.mkdir(dir, { recursive: true });

        const result = await generateImage(prompt, aspect_ratio, model);

        const buffer = Buffer.from(result.imageBase64, "base64");
        await fs.writeFile(output_path, buffer);

        const textLines = [
          `Image generated and saved to: ${output_path}`,
          `Prompt: ${prompt}`,
          `Aspect ratio: ${aspect_ratio}`,
        ];
        if (result.text) {
          textLines.push(`Model note: ${result.text}`);
        }

        return {
          content: [
            { type: "text" as const, text: textLines.join("\n") },
            {
              type: "image" as const,
              data: result.imageBase64,
              mimeType: result.mimeType,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Image generation failed: ${message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
