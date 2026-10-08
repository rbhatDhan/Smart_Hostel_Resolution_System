# Smart Hostel Issue Reporting & Resolution System

A MERN-stack complaint management system for college hostels, with Gemini-powered
AI features layered on top of the existing complaint workflow.

- **Backend:** Node.js, Express 5, MongoDB (Mongoose), JWT auth
- **Frontend:** React (Vite), Tailwind CSS, Chart.js
- **AI:** Google Gemini API (server-side only — the key never touches the browser). Gemini's free tier requires no credit card, which is why this project uses it instead of a paid-only provider.

---

## ✨ AI Features

All AI calls happen in `backend/src/services/aiService.js` and are used by four
touchpoints in the app:

### 1. Auto-categorization & priority prediction
On the **Create Complaint** page, students can click **"Auto-fill Category & Priority
with AI"** after typing a description. Gemini reads the free-text description and
suggests the `category` (Electrical, Plumbing, WiFi, etc.) and `priority`
(low/medium/high), which auto-fill the form. The student can still override it manually.

- Frontend: `frontend/src/pages/CreateComplaint.jsx`
- Backend: `POST /api/ai/analyze-complaint`

### 2. Duplicate / similar complaint detection
Before a complaint is actually submitted, the frontend asks the backend to check it
against other **open** complaints (pending/in-progress) from the last 14 days in the
same category. Gemini compares the new description against that shortlist and flags
ones that look like the *same underlying issue* (e.g. five students separately
reporting the same WiFi outage). If matches are found, the student sees a modal
listing them and can either cancel or **"Submit Anyway."**

- Frontend: duplicate modal in `CreateComplaint.jsx`
- Backend: `POST /api/ai/check-duplicates`
- Stored on the complaint as `ai.duplicateOf` (array of complaint IDs) if the student
  submits anyway — visible to wardens as a "Possible duplicate" badge on **All Complaints**.

### 3. Smart SLA / urgency escalation
Every complaint is independently assessed **server-side** (regardless of what
priority the student picked) for genuine safety/health hazards — exposed wiring,
gas smell, major flooding, fire/security risk, etc. This runs automatically inside
`createComplaint` in `backend/src/controllers/complaintController.js`. If Gemini
flags it urgent:
- `priority` is force-set to `"urgent"`
- the SLA deadline is capped at **6 hours** instead of the normal 48–72 hours
- the reason is stored in `ai.urgencyReason` and shown as a red "AI flagged:
  safety-critical" badge to wardens on **All Complaints**

This is a safety net — even if a student under-reports severity, dangerous issues
still get escalated.

### 4. AI-generated analytics summary
On the **Analytics** page, wardens/admins can click **"Generate AI Summary."** The
backend aggregates the last 30 days of complaints into stats (counts by category,
average resolution time, SLA breaches, urgent count) and asks Gemini to write a
short plain-English narrative — e.g. what's trending, what needs attention, one
concrete recommendation. Only aggregated numbers are sent to the model, never raw
personal complaint data.

- Frontend: "AI Insights" panel at the top of `frontend/src/pages/Analytics.jsx`
- Backend: `GET /api/ai/summary?days=30` (warden/admin only)

**Reliability note:** every AI call is wrapped in `try/catch`. If the AI service is
unreachable (no API key, rate limit, network issue), the app degrades gracefully —
complaints can still be created and submitted manually, duplicate checks are simply
skipped, and the analytics summary shows an error message instead of crashing.

---

## ⏱️ How SLA (Service Level Agreement) works

Every complaint gets an `slaDeadline` set at creation time:

| Category | Default SLA |
|---|---|
| Electrical, Plumbing | 48 hours |
| Everything else | 72 hours |
| **Any category, if AI flags it urgent** | **capped at 6 hours** |

**What was already there:** the `Complaint` model had an `slaStatus` field
(`"on-time"` / `"delayed"`), but nothing in the original code ever recalculated it —
it was set to `"on-time"` on creation and never touched again, so it was always
wrong for anything that ran late.

**What this update fixes:** `backend/src/utils/sla.js` adds `computeSlaStatus()`,
which is now used in two places:
- **On every read** (`getMyComplaints`, `getAllComplaints`) — status is recomputed
  live: for still-open complaints it compares *now* vs. the deadline, so "delayed"
  shows up in real time without any cron job.
- **On resolve** (`updateComplaintStatus`) — once a complaint is marked resolved,
  the final verdict is locked in by comparing `resolvedAt` vs. `slaDeadline` and
  saved permanently.

This means wardens can see, at a glance, which open complaints are already overdue,
and Analytics can report an accurate SLA-breach count (fed into the AI summary too).

---

## 🐛 Bonus fix included

The **Create Complaint** form has always offered an `"urgent"` priority option in
its dropdown, but the `Complaint` schema's `priority` enum only allowed
`low/medium/high` — so selecting "Urgent" and submitting would have thrown a
validation error. The enum now includes `"urgent"` (`backend/src/models/Complaint.js`),
which also makes the AI urgency-escalation feature work correctly.

---

## 🔧 Setup

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env` (there's a `.env.example` to copy from):

```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000

# AI features
GEMINI_API_KEY=your_gemini_api_key
# GEMINI_MODEL=gemini-2.0-flash-lite   (optional override)
```

**Getting a free Gemini API key (no credit card needed):**
1. Go to **https://aistudio.google.com/apikey**
2. Sign in with any Google account
3. Click **"Create API key"** → choose "Create API key in new project" (or an existing one)
4. Copy the key and paste it as `GEMINI_API_KEY` in `backend/.env`

That's it — no billing setup. The free tier easily covers demo/testing use (~30
requests/minute, 1,500/day on the default model). Without a key, the app still
works — the AI buttons/panels will just show a friendly "unavailable" message.

Run the backend:

```bash
npm run dev
```

You should see `MongoDB Connected: ...` and `Server running on port 5000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

`frontend/.env` already points at `VITE_API_URL=http://localhost:5000` — update this
if your backend runs elsewhere.

Open the printed local URL (usually `http://localhost:5173`).

---

## 🧪 How to test everything

### Get a student account and a warden/admin account
1. Register a normal account at `/register` (email must end in `@gmail.com`,
   password ≥ 6 chars, room number required) — this becomes a `student` by default.
2. Every new registration defaults to `role: "student"` — there's no signup flow for
   warden/admin. To test the warden/admin views (All Complaints, Analytics, AI
   summary), open your database in **MongoDB Atlas → Browse Collections → users**,
   find your test user, and manually change its `role` field to `"warden"` or
   `"admin"`. Log out and back in afterward so the new role is picked up.

### Test Feature 1 — Auto-categorization & priority
1. Log in as a student → **Create Complaint**.
2. Type a description like *"The bathroom tap has been leaking non-stop for two
   days"* — leave Category/Priority blank.
3. Click **"Auto-fill Category & Priority with AI."**
4. Expect: Category auto-fills to `Plumbing`, Priority to something like `medium`,
   and a small purple box shows the AI's one-line reasoning.
5. Try an urgent one: *"There are exposed sparking wires near the washroom sink,
   smells like something is burning"* → expect the red "flagged as safety-critical"
   banner and priority forced to `urgent`.

### Test Feature 2 — Duplicate detection
1. Submit a complaint, e.g. category `WiFi`, description *"WiFi has been down in
   the whole hostel since this morning."*
2. As a second student (or the same one), start a new complaint with a similar
   description, e.g. *"No internet connection anywhere in the building today."*
3. Click **Submit Complaint** — expect a modal: *"Similar complaints found"* listing
   the earlier one with a confidence %. Choose **Submit Anyway** or **Cancel**.
4. Log in as warden/admin → **All Complaints** — the new complaint should show a
   purple **"Possible duplicate"** badge.

### Test Feature 3 — SLA + urgency escalation
1. Submit an urgent-sounding complaint (see example above).
2. As warden/admin, open **All Complaints** — it should already show priority
   `urgent` and a red **"AI flagged: safety-critical"** badge, even without you
   touching Feature 1's button (this check runs automatically server-side on every
   submission).
3. Check MongoDB Atlas → `complaints` collection → the document should have
   `ai.isUrgent: true`, `ai.urgencyReason`, and an `slaDeadline` only ~6 hours out
   instead of 48–72.
4. To see `slaStatus` flip to `"delayed"`: manually edit a complaint's `slaDeadline`
   in Atlas to a past date/time, then refresh **All Complaints** as warden/admin —
   it should read `delayed` without any other change (this is the live SLA
   calculation, no cron job needed).

### Test Feature 4 — AI analytics summary
1. Make sure a few complaints exist (mix of resolved/pending, different categories).
2. Log in as warden/admin → **Analytics**.
3. Click **"Generate AI Summary"** in the purple "AI Insights" panel at the top.
4. Expect: a short paragraph analyzing the last 30 days, plus small stat chips
   (total complaints, avg resolution time, SLA breaches, AI-flagged urgent count).

### Testing "AI unavailable" gracefully
Temporarily remove/rename `GEMINI_API_KEY` in `backend/.env` and restart the
backend. Confirm:
- Create Complaint still works end-to-end without clicking the AI button.
- Clicking "Auto-fill" shows a friendly error instead of crashing.
- Submitting a complaint doesn't hang — duplicate check is skipped silently.
- Analytics still loads normally; the "Generate AI Summary" button shows an error.

---

## 📁 Project structure (what changed)

```
backend/
  src/
    services/aiService.js        ← NEW: Gemini API wrapper (3 AI functions)
    controllers/aiController.js  ← NEW: /api/ai/* route handlers
    routes/aiRoutes.js           ← NEW
    utils/sla.js                 ← NEW: live SLA status calculation
    controllers/complaintController.js  ← MODIFIED: urgency check + live SLA on read
    models/Complaint.js          ← MODIFIED: `ai` subdocument + `priority` enum fix
    app.js                       ← MODIFIED: mounts /api/ai
  .env.example                   ← NEW

frontend/
  src/pages/CreateComplaint.jsx  ← MODIFIED: AI auto-fill + duplicate modal
  src/pages/Analytics.jsx        ← MODIFIED: AI Insights panel
  src/pages/AllComplaints.jsx    ← MODIFIED: AI urgent/duplicate badges
```

---

## 📌 Notes for presenting this to recruiters

- The AI isn't a bolted-on chatbot — it's wired into the actual data model
  (`ai` subdocument on `Complaint`) and the actual SLA logic, not just a demo screen.
- Feature 3 is a good talking point: it shows you thought about *failure modes*
  (a scared/rushed student under-selecting priority) rather than just "add AI."
- Feature 4 turns existing chart data into a written insight — a natural way to
  demo LLM reasoning over structured data, not just text generation.
- All AI calls fail soft — worth mentioning that you deliberately designed for
  the AI service being flaky/unavailable, which is a realistic production concern.
