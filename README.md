# IPTV Player

A modern, lightweight IPTV player for Windows built with Electron + React.

![screenshot](docs/screenshot.png)

## Features

- **Multiple playlists** — create and manage as many playlists as you need
- **3 import methods** — from URL, local file (.m3u/.m3u8/.txt), or paste text
- **Auto-refresh** — URL playlists can auto-update on a schedule (30m / 1h / 2h / 6h / custom)
- **Group filtering** — channels are automatically grouped by `group-title` tags
- **Favorites** — star channels for quick access
- **Search** — filter channels in real-time
- **HLS playback** — supports M3U8 streams via hls.js
- **Volume control + fullscreen**
- **Persistent state** — playlists and settings survive restarts

## Download

Go to the [Releases](../../releases) page and download the latest `IPTV-Player-Setup-x.x.x.exe`.

## Build from Source

### Prerequisites

- Node.js 18+
- npm

### Local Development

```bash
npm install
npm start          # starts React dev server + Electron
```

### Build Windows Installer

```bash
npm run build      # outputs to dist/
```

## GitHub Actions (Automated Build)

Every push to `main` automatically builds Windows installers via GitHub Actions.

To create a release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This triggers the release job which creates a GitHub Release with attached `.exe` files.

### Artifacts

| File | Description |
|------|-------------|
| `IPTV-Player-Setup-x.x.x.exe` | NSIS installer (recommended) |
| `IPTV-Player-x.x.x-portable.exe` | Portable — no install needed |

## Playlist Format Support

| Format | Example |
|--------|---------|
| M3U/M3U8 | Standard `#EXTM3U` + `#EXTINF` |
| Plain URL list | One URL per line |
| Name + URL | `Channel Name,http://...` |
| HLS streams | `.m3u8` URLs |
| Direct streams | HTTP video streams |

## Project Structure

```
iptv-player/
├── src/
│   ├── main.js              # Electron main process
│   ├── preload.js           # Secure IPC bridge
│   ├── App.js               # Root React component
│   ├── components/
│   │   ├── TitleBar         # Custom window controls
│   │   ├── Sidebar          # Playlist management
│   │   ├── ChannelList      # Channel browser with groups
│   │   ├── Player           # HLS video player
│   │   └── AddPlaylistModal # Import wizard
│   ├── utils/parser.js      # M3U/TXT playlist parser
│   └── store/index.js       # State persistence
├── public/
│   └── index.html
└── .github/workflows/
    └── build.yml            # CI/CD pipeline
```

## License

MIT
