import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGenerateImageTool } from "./tools/generate-image.js";

const server = new McpServer({
  name: "organon-create-image",
  version: "0.1.0",
});

registerGenerateImageTool(server);

const transport = new StdioServerTransport();
await server.connect(transport);
