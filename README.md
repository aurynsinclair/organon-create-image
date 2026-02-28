# organon-create-image

MCP server for image generation using Gemini.

## Features

- **Text-to-image generation** via Gemini (default: `gemini-3-pro-image-preview`)
- Multiple aspect ratio support (1:1, 16:9, 9:16, etc.)
- Returns generated images both as files and inline via MCP image content type
- Supports both **AI Studio** (API key) and **Vertex AI** (service account) backends

## Prerequisites

- Node.js 18+
- One of the following:
  - **AI Studio**: A Gemini API key from [Google AI Studio](https://aistudio.google.com/)
  - **Vertex AI**: A Google Cloud project with Vertex AI API enabled + Application Default Credentials

## Setup

```bash
npm install
npm run build
```

## Configuration

### Environment Variables

| Variable          | Required | Default       | Description                                       |
| ----------------- | -------- | ------------- | ------------------------------------------------- |
| `GEMINI_API_KEY`  | Option 1 | —             | AI Studio API key (takes priority over Vertex AI) |
| `VERTEX_PROJECT`  | Option 2 | —             | Google Cloud project ID (Vertex AI)               |
| `VERTEX_LOCATION` | No       | `us-central1` | Vertex AI location                                |

> **Note:** Set either `GEMINI_API_KEY` or `VERTEX_PROJECT`. If both are set, `GEMINI_API_KEY` takes priority.

### Claude Code MCP Registration

**AI Studio** (recommended for access to preview models):

```json
{
  "mcpServers": {
    "create-image": {
      "command": "node",
      "args": ["/path/to/organon-create-image/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your-api-key"
      }
    }
  }
}
```

**Vertex AI:**

```json
{
  "mcpServers": {
    "create-image": {
      "command": "node",
      "args": ["/path/to/organon-create-image/dist/index.js"],
      "env": {
        "VERTEX_PROJECT": "your-gcp-project-id"
      }
    }
  }
}
```

## Tools

### `generate_image`

Generate an image from a text prompt.

**Parameters:**

| Parameter      | Type   | Required | Default                        | Description                                                                           |
| -------------- | ------ | -------- | ------------------------------ | ------------------------------------------------------------------------------------- |
| `prompt`       | string | Yes      | —                              | Text prompt for image generation (English recommended)                                |
| `aspect_ratio` | enum   | No       | `"1:1"`                        | Aspect ratio: `1:1`, `3:2`, `2:3`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `output_path`  | string | Yes      | —                              | File path to save the generated image (.png)                                          |
| `model`        | string | No       | `"gemini-3-pro-image-preview"` | Gemini model name (e.g. `gemini-2.5-flash-image`)                                     |

**Returns:** Generated image saved to `output_path`, plus inline image via MCP image content type.

## License

MIT
