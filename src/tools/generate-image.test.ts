import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../gemini.js", () => ({
  generateImage: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

import { registerGenerateImageTool } from "./generate-image.js";
import { generateImage } from "../gemini.js";
import * as fs from "node:fs/promises";

type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

interface MockMcpServer {
  registerTool: ReturnType<typeof vi.fn>;
}

function createMockServer(): MockMcpServer {
  return { registerTool: vi.fn() };
}

function getRegisteredHandler(server: MockMcpServer): ToolHandler {
  const [, , handler] = server.registerTool.mock.calls[0];
  return handler;
}

describe("generate-image tool", () => {
  let server: MockMcpServer;
  let handler: ToolHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    server = createMockServer();
    registerGenerateImageTool(server as never);
    handler = getRegisteredHandler(server);
  });

  it("registerTool を正しい名前で呼ぶ", () => {
    expect(server.registerTool).toHaveBeenCalledWith(
      "generate_image",
      expect.objectContaining({ title: "Generate Image" }),
      expect.any(Function),
    );
  });

  it("成功時: 画像を生成し、ファイルに保存し、MCP レスポンスを返す", async () => {
    vi.mocked(generateImage).mockResolvedValue({
      imageBase64: "AQID",
      mimeType: "image/png",
    });

    const result = (await handler({
      prompt: "a red circle",
      aspect_ratio: "1:1",
      output_path: "/tmp/test.png",
    })) as { content: Array<Record<string, string>> };

    expect(generateImage).toHaveBeenCalledWith("a red circle", "1:1", undefined);
    expect(fs.mkdir).toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalledWith("/tmp/test.png", expect.any(Buffer));
    expect(result.content).toHaveLength(2);
    expect(result.content[0]).toEqual({
      type: "text",
      text: expect.stringContaining("Image generated and saved to: /tmp/test.png"),
    });
    expect(result.content[1]).toEqual({
      type: "image",
      data: "AQID",
      mimeType: "image/png",
    });
  });

  it("model パラメータが generateImage に渡される", async () => {
    vi.mocked(generateImage).mockResolvedValue({
      imageBase64: "AQID",
      mimeType: "image/png",
    });

    await handler({
      prompt: "a cat",
      aspect_ratio: "16:9",
      output_path: "/tmp/cat.png",
      model: "custom-model",
    });

    expect(generateImage).toHaveBeenCalledWith("a cat", "16:9", "custom-model");
  });

  it("text 付きレスポンスに Model note が含まれる", async () => {
    vi.mocked(generateImage).mockResolvedValue({
      imageBase64: "AQID",
      mimeType: "image/png",
      text: "Here is a cat",
    });

    const result = (await handler({
      prompt: "a cat",
      aspect_ratio: "1:1",
      output_path: "/tmp/cat.png",
    })) as { content: Array<Record<string, string>> };

    expect(result.content[0].text).toContain("Model note: Here is a cat");
  });

  it("Error 発生時: isError フラグ付きレスポンスを返す", async () => {
    vi.mocked(generateImage).mockRejectedValue(
      new Error("Safety filter triggered"),
    );

    const result = (await handler({
      prompt: "bad prompt",
      aspect_ratio: "1:1",
      output_path: "/tmp/bad.png",
    })) as { content: Array<Record<string, string>>; isError: boolean };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Safety filter triggered");
  });

  it("非 Error 例外もハンドルする", async () => {
    vi.mocked(generateImage).mockRejectedValue("string error");

    const result = (await handler({
      prompt: "test",
      aspect_ratio: "1:1",
      output_path: "/tmp/test.png",
    })) as { content: Array<Record<string, string>>; isError: boolean };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("string error");
  });
});
