# Chitrakar

A UI design app for iPad (with Apple Pencil) and desktop. Web first, with a path
to native.

Priorities: **ease of use**, then **efficiency** (low power, tiny bundle), then
**portability** to a native iPad app.

- Specification: [docs/SPEC.md](docs/SPEC.md)

Status: specification and interactive UI prototype.

## Website

The app is live as a website, published from `main` by
`.github/workflows/pages.yml`, which builds the site and pushes it to the
`gh-pages` branch that GitHub Pages serves:
**https://shibam-apple.github.io/chitrakar01/**

The build (`scripts/build-site.mjs`) minifies the prototype into one file
(about 73 KB gzipped), adds an app manifest and icons so it can be added to the
iPad Home Screen, and a service worker so it opens offline without touching the
network. Build it locally with:

```sh
npm install --no-save esbuild@0.24.2 && node scripts/build-site.mjs   # → dist/
```

## Try the UI prototype

`prototype/index.html` is a single-file interactive prototype of the interface.
Open it in Safari on an iPad (with an Apple Pencil if you have one) or in any
desktop browser. No build step.
