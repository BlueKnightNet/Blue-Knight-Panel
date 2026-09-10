# BlueKnight Theme Backgrounds

This directory contains the sorted background wallpapers for the 10 dynamic adaptive themes in BlueKnight Panel.

| File | Theme Key | Visual Mood | Overlay Tone | Card Blur |
| :--- | :--- | :--- | :--- | :--- |
| theme-bg-1.jpg | theme-1 | Crystal Cyan / Arctic Frost | rgba(15, 23, 42, 0.14) | 17px |
| theme-bg-2.jpg | theme-2 | Deep Velvet / Magenta Glow | rgba(15, 6, 12, 0.48) | 17px |
| theme-bg-3.jpg | theme-3 | Midnight Indigo / Starlight Blue | rgba(10, 14, 26, 0.44) | 17px |
| theme-bg-4.jpg | theme-4 | Clean Platinum / Minimal Day | rgba(15, 23, 42, 0.10) | 17px |
| theme-bg-5.jpg | theme-5 | Crimson Obsidian / Dark Blood | rgba(20, 8, 10, 0.46) | 17px |
| theme-bg-6.jpg | theme-6 | Amber Sunset / Golden Dusk | rgba(16, 12, 12, 0.48) | 17px |
| theme-bg-7.jpg | theme-7 | Emerald Forest / Matrix Dark | rgba(18, 8, 10, 0.46) | 17px |
| theme-bg-8.jpg | theme-8 | Electric Cobalt / Neon Cyan | rgba(15, 23, 42, 0.12) | 17px |
| theme-bg-9.jpg | theme-9 | Aurora Teal / Glacier Mist | rgba(15, 23, 42, 0.14) | 17px |
| theme-bg-10.jpg | theme-10 | Cyberpunk Violet / Neon Purple | rgba(12, 8, 18, 0.48) | 17px |

### Serving Architecture
- Cloudflare Workers: Embedded in worker.js via THEME_BG_DATA_URIS for standalone deployment.
- Cloudflare Pages / Netlify / Vercel: Served statically via public/assets/ with global edge caching.
- Node.js Containers (Render, Fly.io, Railway, Koyeb, Glitch): Served via server.js with disk streaming.
