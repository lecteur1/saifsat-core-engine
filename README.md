# ⚡ SaifSat Universal Core Player

Ultra-lightweight, Zero-CPU-Freeze Streaming Engine for Web, IPTV & Legacy Hardware.

- **Zero-CPU Stall:** Offloads video rendering and demuxing to hardware acceleration layers (WebGL Canvas).
- **Strict RAM Capping (25MB):** Actively purges played fragments, preventing browser crashes on low-spec systems.
- **Anti-AdBlock Monetization:** Isolated inside an impermeable Shadow DOM.
- **Lenient Stream Recovery:** Auto-detects stalled manifests without freezing the UI.

## Quick Start

```html
<!-- Core Dependencies -->
<script src="[https://cdn.jsdelivr.net/npm/hls.js@latest](https://cdn.jsdelivr.net/npm/hls.js@latest)"></script>
<script src="[https://cdn.jsdelivr.net/npm/mux.js@latest/dist/mux.min.js](https://cdn.jsdelivr.net/npm/mux.js@latest/dist/mux.min.js)"></script>

<!-- SaifSat Engine -->
<script src="[https://cdn.jsdelivr.net/gh/lecteur1/saifsat-core-engine@main/web/saifsat-player.js](https://cdn.jsdelivr.net/gh/lecteur1/saifsat-core-engine@main/web/saifsat-player.js)"></script>

<!-- Player Container -->
<div id="player-container" style="width: 100%; max-width: 860px; height: 480px;"></div>

<script>
  const player = new SaifSatPlayer({
    container: '#player-container',
    lowLatency: true,
    maxBufferLength: 10
  });

  player.loadSource('[https://ireplay.tv/test/blender.m3u8](https://ireplay.tv/test/blender.m3u8)');
</script>