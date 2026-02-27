# Changelog

## 0.4.0 (2026-02-27)

- Add `model` parameter to `generate_image` tool for per-request model selection
  - Default: `gemini-3-pro-image-preview`
  - Allows using `gemini-3-pro-image-preview` or other models without server restart
- Remove `GEMINI_MODEL` environment variable (use the `model` parameter instead)

## 0.3.0 (2026-02-27)

- Add AI Studio (API key) backend support via `GEMINI_API_KEY`
  - Enables access to preview models like `gemini-3-pro-image-preview`
  - Takes priority over Vertex AI when both are configured
- `VERTEX_PROJECT` is no longer unconditionally required

## 0.2.0 (2026-02-27)

- Change default model from `gemini-3-pro-image-preview` to `gemini-2.5-flash-image`
  - `gemini-3-pro-image-preview` requires project-level access approval on Vertex AI
  - `gemini-2.5-flash-image` is GA and broadly accessible

## 0.1.0 (2026-02-27)

- Initial release
- `generate_image` tool: text-to-image generation via Gemini on Vertex AI
- Supports multiple aspect ratios
- Returns images as files and inline via MCP image content type
