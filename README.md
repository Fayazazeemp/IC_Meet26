# Islamic Campus Students Gatheringup 2026 — Registration App

A mobile-first registration web app for the Islamic Campus Students Gatheringup with:
- Phone-based lookup with pre-fill from 58 students CSV
- One registration per phone number (enforced at DB level)
- Photo upload + circle crop for badge
- Downloadable event delegate badge (PNG)
- WhatsApp group join button
- Admin dashboard with search, stats, CSV export

---

## 🚀 Deploy in 4 Steps

### Step 1 — Set up Supabase (free, ~5 min)

1. Go to [supabase.com](https://supabase.com) → **Start your project** (free)
2. Create a new project, choose any region, set a DB password
3. Once created, go to **SQL Editor** → **New Query**
4. Paste the contents of `supabase_setup.sql` and click **Run**
5. Go to **Project Settings → API**
6. Copy:
   - **Project URL** → `https://xxxx.supabase.co`
   - **anon public** key → long JWT string

---

### Step 2 — Configure environment variables

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_ADMIN_PASSWORD=your-secret-password
VITE_WHATSAPP_LINK=https://chat.whatsapp.com/your-actual-link
```

---

### Step 3 — Deploy to Vercel (free, ~2 min)

**Option A: Vercel (recommended)**

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repo
4. In **Environment Variables**, add all 4 variables from `.env.local`
5. Click **Deploy** → done! You get a live URL instantly.

**Option B: Netlify**

1. Push to GitHub
2. Go to [netlify.com](https://netlify.com) → **Add new site → Import from Git**
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables in **Site Settings → Environment Variables**
6. Deploy

---

### Step 4 — Test it

1. Open your deployed URL
2. Enter a phone number from the CSV (e.g. `+918590902744`) — should pre-fill
3. Enter an unknown number — should show blank form
4. Complete registration → generate badge → download PNG
5. Try the same phone again → should block with "already registered"
6. Open Admin (🔒 button, top right) with your password → see the registration

---

## 🛠 Local Development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase keys
npm run dev
```

App runs at `http://localhost:5173`

---

## 📁 Project Structure

```
src/
├── App.jsx                  # Main app: phone screen, form, success
├── main.jsx                 # React entry point
├── index.css                # Global styles + CSS variables
├── lib/
│   └── supabase.js          # DB client + all query helpers
├── data/
│   └── students.js          # 58 pre-loaded students from CSV
└── components/
    ├── BadgeGenerator.jsx   # Canvas badge + photo crop
    └── AdminDashboard.jsx   # Admin view, search, export, delete

supabase_setup.sql           # Run once in Supabase SQL editor
.env.example                 # Template for environment variables
```

---

## 🔐 Security Notes

- The `anon` Supabase key is safe to expose in frontend code — it's designed for that.
- Row Level Security (RLS) is enabled — only the defined policies allow access.
- For a more secure admin, you can later add Supabase Auth and restrict SELECT/DELETE to authenticated users only.
- Change `VITE_ADMIN_PASSWORD` to something strong before going live.

---

## 🧩 Customisation

| What | Where |
|------|-------|
| Event name / title | `src/App.jsx` — headings |
| Badge design | `src/components/BadgeGenerator.jsx` — `drawBadge()` |
| WhatsApp link | `VITE_WHATSAPP_LINK` in `.env.local` |
| Admin password | `VITE_ADMIN_PASSWORD` in `.env.local` |
| Add more students | `src/data/students.js` — add to STUDENTS array |
| Form fields | `src/App.jsx` — form screen section |
