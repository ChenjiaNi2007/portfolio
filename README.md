# Interactive Globe Portfolio

A cinematic personal portfolio you explore by piloting a small plane around a textured 3D Earth. Fly close to a pin to pop up a preview, press **L** to land and read the full project or photo detail — including a building-level Leaflet map of the exact location. A passport panel tracks the projects you've visited.

**No backend. No API keys. Static site.**

---

## Running locally

```bash
npm install
npm run dev        # http://localhost:5173
```

## Production build

```bash
npm run build      # outputs to dist/
```

The `dist/` folder is a fully static site — serve it from any static host.

---

## Adding your content

### Edit your profile

Open **`src/data/site.ts`** and replace the name, tagline, and social links:

```ts
export const site = {
  name: 'Jane Smith',
  tagline: 'Full-Stack Engineer · Open Source · Design Systems',
  links: {
    github: 'https://github.com/janesmith',
    linkedin: 'https://linkedin.com/in/janesmith',
    resume: '/resume.pdf',   // put resume.pdf in /public
  },
};
```

### Add a project or photo location

Open **`src/data/locations.ts`**. Each entry in the array is either a `ProjectLocation` or a `PhotoLocation`. Copy one of the placeholder objects, replace the fields, and delete the `// REPLACE` comment.

**ProjectLocation fields:**
| Field | Description |
|---|---|
| `id` | Unique string (any slug) |
| `type` | `'project'` |
| `title` | Display name |
| `city` | Shown as subtitle |
| `coordinates` | `{ lat, lng }` — decimal degrees |
| `summary` | One sentence (shown in the flyby popup) |
| `description` | Full paragraph (shown in the detail panel) |
| `tech` | Array of tech tag strings |
| `links` | Array of `{ label, url }` |
| `images` | Array of paths like `'/images/myproject-1.jpg'` |
| `important` | `true` → appears in the Passport panel |

**PhotoLocation fields:**
| Field | Description |
|---|---|
| `id` | Unique string |
| `type` | `'photo'` |
| `title`, `city`, `coordinates` | Same as above |
| `caption` | Text shown in popup and detail panel |
| `date` | Optional string, e.g. `'2024-08'` |
| `photos` | Array of `{ src, alt? }` objects |

### Add images

Put image files in **`/public/images/`** (create the folder if it doesn't exist). Reference them as `/images/filename.jpg` in the `images` or `photos` arrays.

Put your resume PDF at **`/public/resume.pdf`**.

---

## Deploying

### Vercel (recommended — one click)

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo.
3. Vercel auto-detects Vite. Leave all defaults. Click **Deploy**.
4. Done — your site is live at `https://yourproject.vercel.app`.

### Cloudflare Pages / Netlify

Same flow: import the repo, set build command to `npm run build`, output directory to `dist`. Both work out of the box.

### GitHub Pages

GitHub Pages serves from a sub-path (`/repo-name/`). Add one line to `vite.config.ts`:

```ts
export default defineConfig({
  plugins: [react()],
  base: '/your-repo-name/',   // ← add this
})
```

Then push `dist/` via `gh-pages` or use a GitHub Actions workflow.

---

## Controls

| Input | Action |
|---|---|
| W / ↑ | Fly forward |
| S / ↓ | Fly backward |
| A / ← | Turn left (banks the plane) |
| D / → | Turn right |
| Scroll wheel / Pinch | Zoom in / out |
| L | Land at nearest pin |
| Esc | Take off / close panel |
| Touch-drag | Steer on mobile |
| Pinch | Zoom on mobile |

---

## Tech stack

- **Vite + React + TypeScript** — SPA, static build
- **Three.js + @react-three/fiber + @react-three/drei** — 3D globe, plane, pins, atmosphere
- **react-leaflet + Leaflet** — building-level map in the detail panel (OpenStreetMap + Esri satellite, no API keys)
- **CSS Modules** — all UI chrome
- Earth textures from the Three.js example pack (vendored into `/public/textures/`)
