# BSG Calendar

A simple shift-scheduling app for the BSG behind-the-scenes groups — Byakuren (Young
Women), and Sokahan + Gajokai (the Young Men's group). Members carry a group tag (e.g.
`Koichi Onogi (s/g)`, `Sally (b)`) and shifts run on Sundays (with the occasional
Saturday). It is a sibling of `kcg-shift-scheduler` and reuses the same Supabase project
via `bsg_`-prefixed tables.

## Features

- 📅 **Calendar View** - See who's assigned to each day
- 👆 **Click to Assign** - Just click a date to assign or reassign
- ❌ **Cancel with Reason** - Track why shifts were cancelled
- 📜 **History Log** - Full audit trail of all changes
- 👥 **Contact List** - Team member info in one place
- 📆 **Google Calendar** - Read-only integration (optional)
- ⚡ **Real-time** - Changes sync instantly for all users
- 💰 **100% Free** - Netlify + Supabase free tiers

## Quick Start (15 minutes)

### Step 1: Set Up Supabase (Free Database)

BSG reuses the **same Supabase project as KCG**, with `bsg_`-prefixed tables so the two
apps don't collide. (For full isolation you can instead create a separate project and
just point `.env` at it.)

1. Open the existing KCG Supabase project (or create a new one)
2. Go to **SQL Editor** (left sidebar) and run the BSG schema. The canonical copy lives in
   `src/supabase.js`; it creates `bsg_members` (with a `group_tag` column), `bsg_shifts`,
   `bsg_history`, and the `bsg_active_members` view:

```sql
-- Members (group_tag: 'b' Byakuren, 's' Sokahan, 'g' Gajokai, 's/g' both)
CREATE TABLE bsg_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  color TEXT DEFAULT '#6366f1',
  group_tag TEXT DEFAULT 'b',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
CREATE INDEX idx_bsg_members_deleted_at ON bsg_members(deleted_at);

CREATE OR REPLACE VIEW bsg_active_members AS
  SELECT id, name, email, phone, color, group_tag, created_at
  FROM bsg_members WHERE deleted_at IS NULL;
GRANT SELECT ON bsg_active_members TO anon, authenticated;

CREATE TABLE bsg_shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES bsg_members(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE bsg_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES bsg_members(id) ON DELETE SET NULL,
  member_name TEXT NOT NULL,
  shift_date DATE,
  action TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE bsg_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE bsg_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bsg_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON bsg_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON bsg_shifts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON bsg_history FOR ALL USING (true) WITH CHECK (true);
```

3. Click **Run** to execute
4. If using a new project, go to **Settings** → **API** and copy (reusing KCG's project
   means you already have these):
   - **Project URL** (e.g., `https://xyz.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

### Step 2: Add Region Support

Run [`supabase/migrations/20260712120000_add_regions.sql`](supabase/migrations/20260712120000_add_regions.sql)
in the Supabase SQL Editor after the base schema. It creates the `bsg_region_cities` table,
seeds `central_texas` for Austin, Killeen, and Waco, and scopes members and shifts with a
`region_name` column. The Region dropdown reads this table, so add cities and regions there
before using them in the app.

### Step 3: Configure the App

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and paste your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
   ```

### Step 4: Run Locally (Optional)

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Step 5: Deploy to Netlify (Free)

**Option A: One-Click Deploy**
1. Push this code to GitHub
2. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import from Git**
3. Select your repo
4. Add environment variables in **Site settings** → **Environment variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**

**Option B: Netlify CLI**
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

## Google Calendar Integration (Optional)

To show Google Calendar events:

1. Go to [Google Calendar](https://calendar.google.com)
2. Click the ⚙️ gear → **Settings**
3. Select your calendar on the left
4. Scroll to **Integrate calendar**
5. Find **Public URL to this calendar** or **Embed code**
6. Copy the URL
7. Edit `src/App.jsx` and set:
   ```javascript
   const CONFIG = {
     googleCalendarUrl: 'https://calendar.google.com/calendar/embed?src=YOUR_CALENDAR_ID',
     // ...
   }
   ```

**Note**: Your Google Calendar must be set to **Public** for embedding to work.

## Customization

### Change App Name
Edit `src/App.jsx`:
```javascript
const CONFIG = {
  appName: 'Your Team Schedule',
  // ...
}
```

### Change Colors
Edit member colors in the Contacts page, or update the default colors in `src/App.jsx`.

### Add More Fields
Modify the Supabase tables and update the React components as needed.

## Tech Stack

- **Frontend**: React 18 + Vite
- **Calendar**: FullCalendar
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Netlify

## Free Tier Limits

| Service | Free Limit |
|---------|------------|
| Netlify | 100GB bandwidth/month, 300 build min/month |
| Supabase | 500MB database, 2GB bandwidth, 50k users |

More than enough for a small team of 5-10 people!

## Troubleshooting

**Calendar doesn't load?**
- Check browser console for errors
- Verify Supabase URL and key in `.env`

**Real-time not working?**
- Supabase real-time is enabled by default
- Check Supabase dashboard → Database → Replication

**Google Calendar not showing?**
- Make sure your calendar is public
- Check the embed URL format

## License

MIT - Use it however you want!
