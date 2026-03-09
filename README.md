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

## Deploy on GitHub Pages, then use as app on phone

Follow these steps in order: deploy the app on GitHub Pages, then open it on your phone and add it to your home screen like a normal app.

### Step 1: Deploy on GitHub Pages

**1.1 Create a new repository on GitHub**

- Go to [github.com/new](https://github.com/new).
- Enter a name (e.g. `BudgetTrack`).
- Leave "Add a README" unchecked if your project already has files.
- Click **Create repository**.

**1.2 Push your project to GitHub**

In a terminal (PowerShell or Command Prompt), run these commands from your project folder. Replace `YOUR_USERNAME` with your GitHub username and `BudgetTrack` with your repo name if different.

```bash
cd C:\Backend-workspace\BudgetTrack
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/BudgetTrack.git
git push -u origin main
```

**1.3 Enable GitHub Pages**

- On GitHub, open your repository.
- Go to **Settings** → **Pages** (left sidebar).
- Under **Build and deployment**:
  - **Source:** Deploy from a branch
  - **Branch:** `main` → **/ (root)**
- Click **Save**.

**1.4 Get your app URL**

- Wait 1–2 minutes for the first deployment.
- Your app will be available at: **https://YOUR_USERNAME.github.io/BudgetTrack/**
- Replace `YOUR_USERNAME` with your GitHub username.  
  Example: `https://johndoe.github.io/BudgetTrack/`

---

### Step 2: Use it as an app on your phone

The app is a **Progressive Web App (PWA)**. After it is on GitHub Pages, you can install it on your phone so it opens like a normal app (full screen, icon on home screen).

**2.1 Open the app on your phone**

- On your phone, open the browser (**Chrome** on Android, **Safari** on iPhone).
- Go to your GitHub Pages URL: **https://YOUR_USERNAME.github.io/BudgetTrack/**
- Use mobile data or Wi-Fi; the page must load at least once online.

**2.2 Add to home screen (install the app)**

**On Android (Chrome):**

1. Tap the **⋮** menu (top right).
2. Tap **Add to Home screen** or **Install app**.
3. Confirm. A **Budget Track** icon appears on your home screen.
4. Tap the icon to open the app like any other app.

**On iPhone (Safari):**

1. Tap the **Share** button (square with arrow) at the bottom of Safari.
2. Scroll down and tap **Add to Home Screen**.
3. Tap **Add** (top right).
4. A **Budget Track** icon appears on your home screen. Tap it to open the app.

**2.3 After installing**

- Open the app from the home screen anytime.
- It runs in its own window (no browser bar).
- After the first load, it works **offline**; data is stored only on your device.

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
