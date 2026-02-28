import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn(function () {
    return { models: { generateContent: mockGenerateContent } };
  }),
}));

import { GoogleGenAI } from "@google/genai";
import { generateImage, _resetClientForTesting } from "./gemini.js";

function makeImageResponse(
  base64 = "AQID",
  mimeType = "image/png",
  text?: string,
) {
  const parts: Array<Record<string, unknown>> = [];
  if (text) parts.push({ text });
  parts.push({ inlineData: { data: base64, mimeType } });
  return { candidates: [{ content: { parts } }] };
}

describe("gemini", () => {
  beforeEach(() => {
    _resetClientForTesting();
    vi.mocked(GoogleGenAI).mockClear();
    mockGenerateContent.mockReset();
    delete process.env.GEMINI_API_KEY;
    delete process.env.VERTEX_PROJECT;
    delete process.env.VERTEX_LOCATION;
  });

  describe("client initialization", () => {
    it("GEMINI_API_KEY が設定されていれば AI Studio クライアントを作成する", async () => {
      process.env.GEMINI_API_KEY = "test-key";
      mockGenerateContent.mockResolvedValue(makeImageResponse());

      await generateImage("test", "1:1");

      expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: "test-key" });
    });

    it("VERTEX_PROJECT が設定されていれば Vertex AI クライアントを作成する", async () => {
      process.env.VERTEX_PROJECT = "my-project";
      mockGenerateContent.mockResolvedValue(makeImageResponse());

      await generateImage("test", "1:1");

      expect(GoogleGenAI).toHaveBeenCalledWith({
        vertexai: true,
        project: "my-project",
        location: "us-central1",
      });
    });

    it("VERTEX_LOCATION をカスタマイズできる", async () => {
      process.env.VERTEX_PROJECT = "my-project";
      process.env.VERTEX_LOCATION = "asia-northeast1";
      mockGenerateContent.mockResolvedValue(makeImageResponse());

      await generateImage("test", "1:1");

      expect(GoogleGenAI).toHaveBeenCalledWith({
        vertexai: true,
        project: "my-project",
        location: "asia-northeast1",
      });
    });

    it("環境変数が未設定ならエラーを投げる", async () => {
      await expect(generateImage("test", "1:1")).rejects.toThrow(
        "Either GEMINI_API_KEY (AI Studio) or VERTEX_PROJECT (Vertex AI) is required.",
      );
    });
  });

  describe("generateImage", () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = "test-key";
    });

    it("画像データを含むレスポンスを正しくパースする", async () => {
      mockGenerateContent.mockResolvedValue(
        makeImageResponse("aGVsbG8=", "image/jpeg", "A beautiful image"),
      );

      const result = await generateImage("a cat", "16:9");

      expect(result).toEqual({
        imageBase64: "aGVsbG8=",
        mimeType: "image/jpeg",
        text: "A beautiful image",
      });
    });

    it("model パラメータが generateContent に渡される", async () => {
      mockGenerateContent.mockResolvedValue(makeImageResponse());

      await generateImage("test", "1:1", "custom-model");

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({ model: "custom-model" }),
      );
    });

    it("レスポンスに parts がなければエラーを投げる", async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{ content: {} }],
      });

      await expect(generateImage("test", "1:1")).rejects.toThrow(
        "No response parts from Gemini API",
      );
    });

    it("画像データがなければ安全フィルターエラーを投げる", async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [
          { content: { parts: [{ text: "I cannot generate that" }] } },
        ],
      });

      await expect(generateImage("test", "1:1")).rejects.toThrow(
        "No image data in Gemini response",
      );
    });
  });
});
