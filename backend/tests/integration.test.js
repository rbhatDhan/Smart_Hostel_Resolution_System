// Full end-to-end API test against a real MongoDB.
// Skipped unless TEST_MONGO_URI is set, e.g.
//   TEST_MONGO_URI=mongodb://127.0.0.1:27017/hostel_test npm test
// WARNING: the target database is wiped at the start of the run.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const URI = process.env.TEST_MONGO_URI;
const opts = { skip: !URI && "set TEST_MONGO_URI to run integration tests" };

process.env.JWT_SECRET = "integration-secret-integration-secret-12345";
process.env.NODE_ENV = "test";
process.env.CRON_SECRET = "cron-secret";
process.env.BCRYPT_ROUNDS = "4";
delete process.env.GEMINI_API_KEY; // AI must degrade gracefully

let app, server, base, User, Complaint, Notification, runSlaCheck;
const tokens = {};
const ids = {};

const api = async (path, { method = "GET", body, token, headers = {} } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, body: json };
};

before(async () => {
  if (!URI) return;
  await mongoose.connect(URI);
  await mongoose.connection.dropDatabase();

  ({ default: app } = await import("../src/app.js"));
  ({ default: User } = await import("../src/models/User.js"));
  ({ default: Complaint } = await import("../src/models/Complaint.js"));
  ({ default: Notification } = await import("../src/models/Notification.js"));
  ({ runSlaCheck } = await import("../src/services/slaService.js"));

  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (!URI) return;
  server?.close();
  await mongoose.connection.close();
});

test("registration always creates a student, even if role is sent", opts, async () => {
  const r = await api("/api/auth/register", {
    method: "POST",
    body: { name: "Stu One", email: "stu1@gmail.com", password: "secret12", roomNumber: "A-1", role: "admin" },
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.user.role, "student");
  assert.ok(r.body.token);
  tokens.s1 = r.body.token;
  ids.s1 = r.body.user._id;

  const r2 = await api("/api/auth/register", {
    method: "POST",
    body: { name: "Stu Two", email: "stu2@gmail.com", password: "secret12", roomNumber: "A-2" },
  });
  tokens.s2 = r2.body.token;
  ids.s2 = r2.body.user._id;

  const dup = await api("/api/auth/register", {
    method: "POST",
    body: { name: "Stu One", email: "STU1@gmail.com", password: "secret12", roomNumber: "A-1" },
  });
  assert.equal(dup.status, 409);
});

test("login: good, wrong password and unknown user", opts, async () => {
  const hash = await bcrypt.hash("Staff@123", 4);
  const warden = await User.create({ name: "Warden", email: "warden@x.com", password: hash, role: "warden" });
  const admin = await User.create({ name: "Admin", email: "admin@x.com", password: hash, role: "admin" });
  ids.w = warden._id.toString();
  ids.a = admin._id.toString();

  const w = await api("/api/auth/login", { method: "POST", body: { email: "warden@x.com", password: "Staff@123" } });
  assert.equal(w.status, 200);
  assert.equal(w.body.user.role, "warden");
  tokens.w = w.body.token;

  const a = await api("/api/auth/login", { method: "POST", body: { email: "admin@x.com", password: "Staff@123" } });
  tokens.a = a.body.token;

  assert.equal((await api("/api/auth/login", { method: "POST", body: { email: "warden@x.com", password: "bad-password" } })).status, 401);
  assert.equal((await api("/api/auth/login", { method: "POST", body: { email: "ghost@x.com", password: "whatever" } })).status, 401);
});

test("student creates a complaint -> student + staff are notified", opts, async () => {
  const r = await api("/api/complaints", {
    method: "POST",
    token: tokens.s1,
    body: { title: "Fan broken", category: "Electrical", description: "Ceiling fan stopped working", priority: "" },
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.complaint.status, "pending");
  assert.equal(r.body.complaint.statusHistory.length, 1);
  ids.c1 = r.body.complaint._id;

  const mine = await api("/api/notifications", { token: tokens.s1 });
  assert.equal(mine.body[0].type, "complaint_created");
  const staff = await api("/api/notifications", { token: tokens.w });
  assert.equal(staff.body[0].type, "complaint_created");
  assert.equal((await api("/api/notifications", { token: tokens.a })).body.length, 1);
});

test("RBAC: staff-only and owner-only routes are enforced", opts, async () => {
  // student cannot reach staff routes
  assert.equal((await api("/api/complaints", { token: tokens.s1 })).status, 403);
  assert.equal((await api(`/api/complaints/${ids.c1}`, { method: "PUT", token: tokens.s1, body: { status: "resolved" } })).status, 403);
  assert.equal((await api("/api/auth/users", { token: tokens.w })).status, 403); // warden is not admin
  assert.equal((await api("/api/ai/summary", { token: tokens.s1 })).status, 403);
  // staff cannot file complaints (students only)
  assert.equal((await api("/api/complaints", { method: "POST", token: tokens.w, body: { title: "x y z", category: "WiFi", description: "hello there" } })).status, 403);
  // another student cannot cancel / read / edit someone else's complaint (IDOR)
  assert.equal((await api(`/api/complaints/${ids.c1}/cancel`, { method: "PUT", token: tokens.s2 })).status, 403);
  assert.equal((await api(`/api/complaints/${ids.c1}`, { token: tokens.s2 })).status, 403);
  assert.equal((await api(`/api/complaints/${ids.c1}/edit`, { method: "PUT", token: tokens.s2, body: { title: "hacked" } })).status, 403);
  // owner and staff can read it
  assert.equal((await api(`/api/complaints/${ids.c1}`, { token: tokens.s1 })).status, 200);
  assert.equal((await api(`/api/complaints/${ids.c1}`, { token: tokens.w })).status, 200);
  // bad ids are 400, not 500
  assert.equal((await api("/api/complaints/not-an-id", { token: tokens.w })).status, 400);
});

test("status workflow: transitions, history, assignment, notifications", opts, async () => {
  const bad = await api(`/api/complaints/${ids.c1}`, { method: "PUT", token: tokens.w, body: { status: "banana" } });
  assert.equal(bad.status, 400);

  const progress = await api(`/api/complaints/${ids.c1}`, { method: "PUT", token: tokens.w, body: { status: "in-progress" } });
  assert.equal(progress.status, 200);
  assert.equal(progress.body.complaint.assignedTo._id, ids.w); // auto-assigned

  const resolved = await api(`/api/complaints/${ids.c1}`, { method: "PUT", token: tokens.w, body: { status: "resolved", note: "Replaced capacitor" } });
  assert.equal(resolved.status, 200);
  assert.equal(resolved.body.complaint.statusHistory.length, 3);
  assert.equal(resolved.body.complaint.resolutionNote, "Replaced capacitor");
  assert.ok(resolved.body.complaint.resolvedAt);

  // resolved -> pending is not allowed
  assert.equal((await api(`/api/complaints/${ids.c1}`, { method: "PUT", token: tokens.w, body: { status: "pending" } })).status, 400);
  // resolved complaints cannot be cancelled
  assert.equal((await api(`/api/complaints/${ids.c1}/cancel`, { method: "PUT", token: tokens.s1 })).status, 400);

  const notes = (await api("/api/notifications", { token: tokens.s1 })).body;
  assert.equal(notes[0].type, "complaint_resolved");
  assert.ok(notes.some((n) => n.type === "status_update"));
});

test("notifications: mark one / mark all / cannot touch others'", opts, async () => {
  const list = (await api("/api/notifications", { token: tokens.s1 })).body;
  const unread = list.filter((n) => !n.isRead);
  assert.ok(unread.length >= 2);

  assert.equal((await api(`/api/notifications/${unread[0]._id}/read`, { method: "PUT", token: tokens.s2 })).status, 404);
  const one = await api(`/api/notifications/${unread[0]._id}/read`, { method: "PUT", token: tokens.s1 });
  assert.equal(one.status, 200);
  assert.equal(one.body.isRead, true);

  assert.equal((await api("/api/notifications/read-all", { method: "PUT", token: tokens.s1 })).status, 200);
  const after = (await api("/api/notifications", { token: tokens.s1 })).body;
  assert.ok(after.every((n) => n.isRead));
});

test("student can cancel own pending complaint and edit window rules apply", opts, async () => {
  const c = await api("/api/complaints", { method: "POST", token: tokens.s2, body: { title: "Leaky tap", category: "Plumbing", description: "Tap is leaking badly" } });
  const id = c.body.complaint._id;

  const edit = await api(`/api/complaints/${id}/edit`, { method: "PUT", token: tokens.s2, body: { title: "Leaky tap in bathroom" } });
  assert.equal(edit.status, 200);
  assert.equal(edit.body.complaint.title, "Leaky tap in bathroom");

  const cancel = await api(`/api/complaints/${id}/cancel`, { method: "PUT", token: tokens.s2 });
  assert.equal(cancel.status, 200);
  assert.equal(cancel.body.complaint.status, "cancelled");
  assert.equal((await api(`/api/complaints/${id}/cancel`, { method: "PUT", token: tokens.s2 })).status, 400);
});

test("lists: plain array by default, envelope when paginated, filters work", opts, async () => {
  const plain = await api("/api/complaints", { token: tokens.w });
  assert.ok(Array.isArray(plain.body));
  assert.equal(plain.body.length, 2);

  const paged = await api("/api/complaints?page=1&limit=1", { token: tokens.w });
  assert.equal(paged.body.data.length, 1);
  assert.equal(paged.body.total, 2);
  assert.equal(paged.body.totalPages, 2);

  const filtered = await api("/api/complaints?status=resolved", { token: tokens.w });
  assert.equal(filtered.body.length, 1);

  assert.equal((await api("/api/complaints?status=bogus", { token: tokens.w })).status, 400);
  assert.equal((await api("/api/complaints/my", { token: tokens.s1 })).body.length, 1);
});

test("SLA monitor: warns once, breaches once, notifies student + staff", opts, async () => {
  const c = await api("/api/complaints", { method: "POST", token: tokens.s1, body: { title: "WiFi down", category: "WiFi", description: "No wifi in the whole block" } });
  const id = c.body.complaint._id;
  await Notification.deleteMany({});

  // due in 30 minutes -> warning (window is 120 min)
  await Complaint.updateOne({ _id: id }, { slaDeadline: new Date(Date.now() + 30 * 60000) });
  const r1 = await runSlaCheck();
  assert.equal(r1.warned, 1);
  assert.equal(r1.breached, 0);
  assert.equal((await runSlaCheck()).warned, 0); // idempotent

  const staffNotes = await Notification.find({ userId: ids.w });
  assert.equal(staffNotes.length, 1);
  assert.equal(staffNotes[0].type, "sla_warning");

  // deadline passes -> breach
  await Complaint.updateOne({ _id: id }, { slaDeadline: new Date(Date.now() - 60000) });
  const r2 = await runSlaCheck();
  assert.equal(r2.breached, 1);
  assert.equal((await runSlaCheck()).breached, 0); // idempotent

  assert.ok(await Notification.findOne({ userId: ids.s1, type: "sla_breach" }));
  assert.ok(await Notification.findOne({ userId: ids.w, type: "sla_breach" }));
  assert.ok(await Notification.findOne({ userId: ids.a, type: "sla_breach" }));
  assert.equal((await Complaint.findById(id)).slaStatus, "delayed");

  // resolved complaints are ignored
  const c2 = await api("/api/complaints", { method: "POST", token: tokens.s1, body: { title: "Dusty room", category: "Cleaning", description: "Room needs cleaning" } });
  await api(`/api/complaints/${c2.body.complaint._id}`, { method: "PUT", token: tokens.w, body: { status: "resolved" } });
  await Complaint.updateOne({ _id: c2.body.complaint._id }, { slaDeadline: new Date(Date.now() - 60000) });
  assert.equal((await runSlaCheck()).breached, 0);
});

test("cron endpoint runs the SLA check with the secret", opts, async () => {
  const r = await api("/api/cron/sla", { headers: { Authorization: "Bearer cron-secret" } });
  assert.equal(r.status, 200);
  assert.equal(typeof r.body.breached, "number");
});

test("admin: create warden, change role, deactivate (token dies immediately)", opts, async () => {
  const created = await api("/api/auth/users", { method: "POST", token: tokens.a, body: { name: "New Warden", email: "nw@x.com", password: "Warden@123", role: "warden" } });
  assert.equal(created.status, 201);
  assert.equal(created.body.user.role, "warden");

  assert.equal((await api(`/api/auth/users/${ids.a}`, { method: "PATCH", token: tokens.a, body: { role: "student" } })).status, 400); // self
  assert.equal((await api(`/api/auth/users/${ids.s2}`, { method: "PATCH", token: tokens.w, body: { role: "admin" } })).status, 403);

  const promoted = await api(`/api/auth/users/${ids.s2}`, { method: "PATCH", token: tokens.a, body: { role: "warden" } });
  assert.equal(promoted.body.user.role, "warden");
  // the old student token now carries warden rights (role read from DB, not the token)
  assert.equal((await api("/api/complaints", { token: tokens.s2 })).status, 200);

  await api(`/api/auth/users/${ids.s2}`, { method: "PATCH", token: tokens.a, body: { isActive: false } });
  assert.equal((await api("/api/complaints", { token: tokens.s2 })).status, 401);
  const login = await api("/api/auth/login", { method: "POST", body: { email: "stu2@gmail.com", password: "secret12" } });
  assert.equal(login.status, 403);
});

test("profile + change password", opts, async () => {
  const p = await api("/api/auth/profile", { method: "PUT", token: tokens.s1, body: { roomNumber: "C-9", phone: "" } });
  assert.equal(p.body.user.roomNumber, "C-9");

  assert.equal((await api("/api/auth/change-password", { method: "PUT", token: tokens.s1, body: { currentPassword: "wrongone", newPassword: "newsecret1" } })).status, 400);
  assert.equal((await api("/api/auth/change-password", { method: "PUT", token: tokens.s1, body: { currentPassword: "secret12", newPassword: "newsecret1" } })).status, 200);
  assert.equal((await api("/api/auth/login", { method: "POST", body: { email: "stu1@gmail.com", password: "newsecret1" } })).status, 200);
  const prof = await api("/api/auth/profile", { token: tokens.s1 });
  assert.equal("password" in prof.body, false);
});
