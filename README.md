# Budget Track

A simple finance tracker that works **offline**. Add income and expenses, view weekly/monthly/yearly charts, and export transactions to PDF. Data is stored on your device only (no login, no server).

## Features

- **Add transactions** – Income or expense with amount, category, date, and note
- **Charts** – Weekly, monthly, and yearly bar charts (income vs expense)
- **Export PDF** – Download filtered transactions as PDF
- **Per-user data** – Each device gets a unique ID; data is kept in `localStorage` (no login)
- **Offline** – After first load, works without internet (service worker caches assets)
- **Mobile-friendly** – Responsive UI and safe-area support

## How to run locally

Open `index.html` in a browser (double-click or drag into Chrome/Edge). For **offline support and PDF/charts**, serve the folder over HTTP once so the app can cache scripts:

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve -p 8080
```

Then open `http://localhost:8080`. After that, you can use it offline.

---

### Quick reference

| Step | What to do |
|------|------------|
| 1 | Create repo on GitHub → push project → enable Pages |
| 2 | Open **https://YOUR_USERNAME.github.io/BudgetTrack/** on your phone |
| 3 | Add to Home screen (Chrome: ⋮ → Add to Home screen; Safari: Share → Add to Home Screen) |
| 4 | Use the icon on your home screen like a normal app |

The `.nojekyll` file in the repo tells GitHub Pages to serve all files as-is.

## Files

- `index.html` – App structure and form
- `styles.css` – Layout and theme
- `app.js` – Logic, storage, charts, PDF export
- `sw.js` – Service worker for offline caching
- `manifest.json` – PWA manifest (for "Add to home screen" on mobile)

