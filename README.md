# Skyway Parking Vercel Website

Static airport parking reservation website for Skyway Parking near Detroit Metro Airport / DTW.

The site is built with plain HTML, CSS, and JavaScript. It does not use React, a backend, a database, or real payment processing.

## Project Files

- `index.html` - static website markup
- `styles.css` - responsive styling and print receipt styling
- `script.js` - reservation pricing, validation, receipt rendering, localStorage, and late return estimator
- `assets/logo.png` - Skyway Parking logo used throughout the website
- `package.json` - Vercel build scripts

## Logo

Place the business logo at:

```text
assets/logo.png
```

The site references this path in the header, hero, reservation form, receipt, and footer. The build command copies the `assets` folder into `dist`.

## Run Locally

Install dependencies:

```bash
npm install
```

Start the local Vite dev server:

```bash
npm run dev
```

Open the local URL printed by Vite.

## Build

Create the production `dist` folder:

```bash
npm run build
```

The build output should include:

```text
dist/index.html
dist/styles.css
dist/script.js
dist/assets/logo.png
```

## Deploy on Vercel

Use these Vercel settings:

- Application Preset: Other
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Environment Variables: none

## Notes

The reservation flow is a front-end simulation. It calculates the parking price, validates the form, saves the submitted reservation to `localStorage`, and renders a printable confirmation receipt.
Deployment refresh.
