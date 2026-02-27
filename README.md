# organon-create-image

MCP server for image generation using Gemini on Vertex AI.

## Features

- **Text-to-image generation** via Gemini (`gemini-2.5-flash-image`)
- Multiple aspect ratio support (1:1, 16:9, 9:16, etc.)
- Returns generated images both as files and inline via MCP image content type

## Prerequisites

- Node.js 18+
- Google Cloud project with Vertex AI API enabled
- Application Default Credentials configured:
  ```bash
  gcloud auth application-default login
  ```

## Setup

```bash
npm install
npm run build
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `VERTEX_PROJECT` | Yes | — | Google Cloud project ID |
| `VERTEX_LOCATION` | No | `us-central1` | Vertex AI location |
| `GEMINI_MODEL` | No | `gemini-2.5-flash-image` | Model name |

### Claude Code MCP Registration

Add to your Claude Code `settings.json`:

```json
{
  "mcpServers": {
    "organon-create-image": {
      "command": "node",
      "args": ["/path/to/organon-create-image/dist/index.js"],
      "env": {
        "VERTEX_PROJECT": "your-gcp-project-id",
        "VERTEX_LOCATION": "us-central1"
      }
    }
  }
}
```

## Tools

### `generate_image`

Generate an image from a text prompt.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `prompt` | string | Yes | — | Text prompt for image generation (English recommended) |
| `aspect_ratio` | enum | No | `"1:1"` | Aspect ratio: `1:1`, `3:2`, `2:3`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `output_path` | string | Yes | — | File path to save the generated image (.png) |

**Returns:** Generated image saved to `output_path`, plus inline image via MCP image content type.

## License

MIT
