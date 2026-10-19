# PULL

Extract complete source code and assets from any Vercel deployment. Built with [Ink](https://github.com/vadimdemedes/ink), React, and Node.js.

```
 ░███████   ░██     ░██ ░██       ░██      
 ░██    ░██ ░██     ░██ ░██       ░██      
 ░██    ░██ ░██     ░██ ░██       ░██      
 ░███████   ░██     ░██ ░██       ░██      
 ░██        ░██     ░██ ░██       ░██      
 ░██        ░██     ░██ ░██       ░██      
 ░██         ░███████   ░████████ ░████████
```

## Quick Install

Via curl:

```bash
curl -fsSL https://raw.githubusercontent.com/carbonthecoder/PULL/main/website/public/install.sh | bash
```

Via Git:

```bash
git clone https://github.com/carbonthecoder/PULL.git
cd PULL
npm install
npm link
```

After `npm link`, run `pull` anywhere in your terminal.

## Commands

| Command | Action |
|---------|--------|
| `pull` | Open the terminal UI |
| `pull --web` | Open the obsidian black web dashboard on `http://localhost:3000` |
| `pull update` | Pull latest commits and rebuild CLI binary |

```
 ░███████   ░██     ░██ ░██       ░██      
 ░██    ░██ ░██     ░██ ░██       ░██      
 ░██    ░██ ░██     ░██ ░██       ░██      
 ░███████   ░██     ░██ ░██       ░██      
 ░██        ░██     ░██ ░██       ░██      
 ░██        ░██     ░██ ░██       ░██      
 ░██         ░███████   ░████████ ░████████

               extract source code from any vercel deployment

   ╭─ vercel token ──────────────────────────────────────────╮
   │ ›                                                        │
   ╰──────────────────────────────────────────────────────────╯

   ╭─ deployment id or url ──────────────────────────────────╮
   │ ›                                                        │
   ╰──────────────────────────────────────────────────────────╯

               ↑↓ switch fields · ↵ download · esc clear · ^c quit
```

1. **Tab** or **↑↓** to focus the **vercel token** field.
2. Paste your token (create one at [vercel.com/account/tokens](https://vercel.com/account/tokens)).
3. **Tab** or **↓** to focus the **deployment id or url** field.
4. Paste a deployment ID (`dpl_xxx`) or a full Vercel dashboard URL (`vercel.com/scope/project/id/source`).
5. Press **Enter**. PULL validates credentials and begins extracting files.

If a field is empty when pressing Enter, PULL highlights the missing field.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` / `↓` | Switch between input fields |
| `Tab` | Toggle focus between fields |
| `Enter` | Start download (validates both inputs) |
| `Esc` | Clear current field, or toggle if empty |
| `←` / `→` | Move cursor within field |
| `Backspace` | Delete character |
| `^c` | Quit |

## Live Progress

Once initiated, PULL shows a live extraction view:

```
  pulling source files

  ⠹ fetching file tree...

  progress                                  42%
  ████████████████████████░░░░░░░░░░░░░░░░░░░░░

  ↓ pulled          12     → skipped      48     × failed        0     of 318

  src/components/App.tsx

  press esc to cancel
```

- Live progress bar with completion percentage
- Real-time counters for pulled, skipped, and failed files
- Currently downloading path indicator
- Press **Esc** to abort and return to prompt

## Completion View

When extraction finishes:

```
 ░███████   ░██     ░██ ░██       ░██      
 ░██    ░██ ░██     ░██ ░██       ░██      
 ░██    ░██ ░██     ░██ ░██       ░██      
 ░███████   ░██     ░██ ░██       ░██      
 ░██        ░██     ░██ ░██       ░██      
 ░██        ░██     ░██ ░██       ░██      
 ░██         ░███████   ░████████ ░████████

  project     my-project
  output      pull/dpl_xxxxx

  pulled      270
  skipped      48
  size        5.79 MB

  press esc or ^c to exit
```

## Output Structure

```
pull/
└── dpl_xxxxx/
    └── (source files)
```

Re-running the command against the same deployment reuses existing files and resumes interrupted downloads.

## Local Web UI

Run `pull --web` or `npm run web` to start the local obsidian dashboard on `http://localhost:3000`:
- Interactive deployment lookup and token validation
- Live collapsible file tree view
- One-click ZIP archive generation and download
- Local source folder extraction

## How It Works

1. **Token**: Injected as an `Authorization: Bearer <token>` header across Vercel API endpoints.
2. **Deployment**: Parses raw `dpl_xxx` IDs, short hashes, or full dashboard URLs.
3. **Team Resolution**: Iterates personal and team scopes automatically to resolve private workspace deployments.
4. **Tree Traversal**: Fetches recursive tree hierarchy through `vercel.com/api/file-tree/<url>?base=src`.
5. **Asset Acquisition**: Downloads file payloads encoded in base64, writing decrypted streams to disk or ZIP buffers.
6. **Smart Caching**: Verifies file size and local presence to skip unmodified files on subsequent runs.

## Requirements

- Node.js >= 18.0.0

## License

MIT
