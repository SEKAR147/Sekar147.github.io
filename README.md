# Portfolio Site

Plain HTML/CSS/JS, no build step. Layout is inspired by al-folio-style academic
sites (circular photo, news feed, tagged publication list). Files:

- `index.html` — content
- `style.css` — styling, light/dark theme via CSS variables
- `script.js` — theme toggle, mobile nav
- `vercel.json` — clean URLs config (only used if you deploy on Vercel)
- `assets/Sekar_M_CV.pdf` — your resume, linked from the "cv" section
- `assets/img/profile.jpg` — circular hero photo
- `assets/img/banner.jpg` — wide photo strip between hero and news

## Before you deploy — fill these in

Open `index.html` and search for `YOUR-`:

- `YOUR-GITHUB-USERNAME` — GitHub link (`#about` social row)
- `YOUR-LINKEDIN-USERNAME` — LinkedIn link (`#about` social row)
- Google Scholar link — currently points at the generic scholar.google.com
  homepage; swap in your actual profile URL once you have one

Content (bio, publications, education, experience, skills) is copied directly
from `SK_New_Resume_Aug.pdf`. The News section and project statuses are things
that will go stale fast (paper decisions, teaching terms) — update those as
things change.

To swap either photo later, just replace `assets/img/profile.jpg` or
`assets/img/banner.jpg` with a same-named file — no HTML changes needed.

## Option A: GitHub Pages (sekar.github.io style)

1. Create a new GitHub repo named exactly `<your-username>.github.io`
   (e.g. if your username is `sekarm`, the repo must be `sekarm.github.io`).
2. From this folder:
   ```
   git init
   git add index.html style.css script.js vercel.json .gitignore README.md assets
   git commit -m "Initial portfolio"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-username>.github.io.git
   git push -u origin main
   ```
3. Go to the repo on GitHub → Settings → Pages → under "Build and deployment",
   Source = "Deploy from a branch", Branch = `main` / `/(root)`. Save.
4. Site goes live at `https://<your-username>.github.io` within a minute or two.

No further config needed — a `<username>.github.io` repo is served from the
root automatically.

## Option B: Vercel

1. Push this folder to any GitHub repo (name doesn't matter for Vercel).
2. Go to vercel.com → Add New → Project → import that repo.
3. Framework preset: "Other" (it's static, no build command needed).
   Leave Build Command and Output Directory blank.
4. Deploy. You'll get a `<project>.vercel.app` URL immediately; add a custom
   domain later from Project Settings → Domains if you want one.

Or without GitHub, straight from this folder via CLI:
```
npm i -g vercel
vercel
```
Follow the prompts (link/create project, keep defaults) and it deploys directly.

## Local preview before deploying

Just open `index.html` in a browser — it's fully static, no server required.
For a local server (avoids any file:// quirks):
```
python -m http.server 8000
```
then visit `http://localhost:8000`.
