# Riverbells Resort — Website

A cinematic, editorial React website for Riverbells Resort (Shahapur, Maharashtra), built with Vite, React Router, GSAP + ScrollTrigger, and Lenis smooth scroll.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL (usually http://localhost:5173).

## Build for production

```bash
npm run build
npm run preview
```

## Deploying (important — SPA routing)

This site uses client-side routing (React Router). `npm run dev` and `npm run preview` both handle this automatically, so it behaves like a normal single-page app locally. Most static hosts, however, need to be told to serve `index.html` for every path — otherwise a direct visit or refresh on `/stay`, `/experiences`, `/gallery`, or `/contact` will 404 and the site will feel like a regular multi-page site instead of an SPA.

Fallback rewrite rules are already included for the common hosts:

- **Netlify** — `public/_redirects` (copied into `dist/` on build)
- **Vercel** — `vercel.json` at the project root
- **Apache** — `public/.htaccess` (copied into `dist/` on build)
- **Nginx** — add `try_files $uri /index.html;` inside your `location / { }` block
- **GitHub Pages** — GH Pages has no server-side rewrite support; either deploy to Netlify/Vercel instead, or switch `BrowserRouter` to `HashRouter` in `src/main.jsx` if you must use GH Pages
- **Testing a production build locally** — use `npx serve -s dist` (the `-s` flag enables SPA fallback) rather than a plain static server

## Notes

- All photography is represented by styled gradient placeholders (`src/components/Placeholder.jsx`) since no real resort photos were supplied. Swap these out for real images by dropping files into `src/assets/images` and replacing the `<Placeholder tone="..." />` usages with `<img>` tags.
- The WhatsApp number, phone number, address and Google Maps link are wired throughout (`BookingForm.jsx`, `FinalCTA.jsx`, `Location.jsx`, `Footer.jsx`).
- Reduced-motion preferences are respected throughout (Lenis, GSAP timelines, and CSS).
