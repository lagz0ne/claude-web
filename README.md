# claude-web

Web interface for the [Claude Agent SDK](https://docs.anthropic.com/en/docs/claude-code/sdk). Runs Claude sessions in the browser with real-time WebSocket streaming, permission prompts, and multi-session support.

## Setup

```bash
bun install
```

## Configuration

Create a `config.json` in the project root:

```json
{
  "port": 3111,
  "baseDir": "/path/to/your/projects",
  "presets": [
    { "name": "my-project", "prompt": "focus on the backend API" }
  ]
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `port` | `3111` (or `$PORT`) | Server port |
| `baseDir` | server cwd | Root directory — subdirectories appear as workspaces |
| `presets` | `[]` | Named workspaces with optional system prompt hints |

All fields are optional. Without `config.json`, the server uses defaults.

## Usage

```bash
# Development (server + frontend with HMR)
bun run dev

# Production
bun run start
```

Open `http://localhost:3111` to start a session.
