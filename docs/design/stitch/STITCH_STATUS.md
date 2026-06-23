# Stitch MCP Live Test (2026-06-23)

| Check | Result |
|-------|--------|
| `stitch` in Cursor agent MCP tools | ❌ Not exposed in this chat session |
| Config in `demo/.cursor/mcp.json` | ✅ `mcp-remote` + `envFile` |
| `STITCH_GOOG_API_KEY` | ✅ Present in `mcp.secrets.env` |
| API `initialize` | ✅ Pass |
| API `tools/list` | ✅ Pass (create_project, list_projects, generate_screen_from_text, etc.) |
| `list_projects` | ✅ Pass |
| `list_screens` | ✅ API responds; **0 screens** in project |
| `generate_screen_from_text` | ❌ Fails ~60s in — HTTP2 framing error / connection drop |

## Stitch project

| Field | Value |
|-------|-------|
| Name | **SCMS Urban Services** |
| ID | `projects/16308196752677021907` |
| Theme | Civic Light — teal `#0d9488`, Inter font |
| Thumbnail | Present (project has design metadata) |
| Screens | None listed yet |

## Conclusion

- **Stitch API works** with your API key (auth + read operations confirmed).
- **Stitch MCP in Cursor** was not available to the agent during redesign; enable it under **Settings → MCP → stitch** and check **Output → MCP Logs**.
- **Screen generation** is the blocker — long-running calls drop before completing. Retry from Cursor with stitch enabled (120s timeout in mcp.json), or use [stitch.withgoogle.com](https://stitch.withgoogle.com) UI for project `16308196752677021907`.

## To enable Stitch MCP in Cursor

1. Settings → Features → Model Context Protocol → enable **stitch**
2. Toggle off/on if red; check MCP Logs for auth errors
3. Fully restart Cursor if needed
4. In Agent chat: *"Use Stitch MCP to list my projects"*
