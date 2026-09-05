# Design tool MCP Live Test (2026-06-23)

| Check | Result |
|-------|--------|
| Design MCP in Cursor agent tools | ❌ Not exposed in this chat session |
| Config in `demo/.cursor/mcp.json` | ✅ `mcp-remote` + `envFile` |
| Design tool API key in `mcp.secrets.env` | ✅ Present |
| API `initialize` | ✅ Pass |
| API `tools/list` | ✅ Pass (create_project, list_projects, generate_screen_from_text, etc.) |
| `list_projects` | ✅ Pass |
| `list_screens` | ✅ API responds; **0 screens** in project |
| `generate_screen_from_text` | ❌ Fails ~60s in — HTTP2 framing error / connection drop |

## Design project

| Field | Value |
|-------|-------|
| Name | **SCMS Urban Services** |
| ID | `projects/16308196752677021907` |
| Theme | Civic Light — teal `#0d9488`, Inter font |
| Thumbnail | Present (project has design metadata) |
| Screens | None listed yet |

## Conclusion

- **External design tool API works** with your API key (auth + read operations confirmed).
- **Design MCP in Cursor** was not available to the agent during redesign; enable it under Settings → MCP and check Output → MCP Logs.
- **Screen generation** is the blocker — long-running calls drop before completing. Retry from Cursor with the design MCP enabled (120s timeout in mcp.json), or use the external design tool UI for project `16308196752677021907`.

## To enable the design MCP in Cursor

1. Settings → Features → Model Context Protocol → enable the design MCP server configured in `demo/.cursor/mcp.json`
2. Toggle off/on if red; check MCP Logs for auth errors
3. Fully restart Cursor if needed
4. In Agent chat: *"Use the design MCP to list my projects"*
