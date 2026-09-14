<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/61cbc53c-94aa-445d-af58-c9e65863218d

## Structure

- This repo — the frontend (Vite + React), deployed as its own Vercel project.
- [cafeBackend](https://github.com/giteshnegi06/cafeBackend) — the Express
  API, its own repo, deployed separately at
  https://cafe-backend-sigma-pearl.vercel.app.

The two talk over HTTP: the frontend calls the API at `VITE_API_URL` (see
`.env.example`). Nothing about how one is deployed constrains the other.

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Copy `.env.example` to `.env` — `VITE_API_URL` already points at the
   deployed backend. To run against a local backend instead, clone
   [cafeBackend](https://github.com/giteshnegi06/cafeBackend), run its
   `npm run dev` (port 3001), and swap `VITE_API_URL` to
   `http://localhost:3001/api`.
4. Run the frontend:
   `npm run dev`
