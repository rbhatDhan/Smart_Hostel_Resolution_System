// HTTP-level tests that do not need a database: they exercise the security
// pipeline (auth, RBAC, validation, error format, cron secret) before any query runs.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = "test-secret-test-secret-test-secret-123";
process.env.NODE_ENV = "test";
process.env.CRON_SECRET = "cron-test-secret";

const { default: app } = await import("../src/app.js");

let server;
let base;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

const call = (path, { method = "GET", body, headers = {} } = {}) =>
  fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });

test("health endpoint reports degraded when DB is not connected", async () => {
  const res = await call("/health");
  assert.equal(res.status, 503);
  assert.equal((await res.json()).db, "disconnected");
});

test("security headers are set (helmet)", async () => {
  const res = await call("/");
  assert.ok(res.headers.get("x-content-type-options"));
  assert.equal(res.headers.get("x-powered-by"), null);
});

test("protected routes reject missing and invalid tokens", async () => {
  assert.equal((await call("/api/complaints/my")).status, 401);
  assert.equal((await call("/api/notifications")).status, 401);
  const bad = await call("/api/complaints/my", { headers: { Authorization: "Bearer nope" } });
  assert.equal(bad.status, 401);
  // token signed with the wrong secret
  const forged = jwt.sign({ id: "507f1f77bcf86cd799439011", role: "admin" }, "wrong-secret");
  assert.equal((await call("/api/auth/users", { headers: { Authorization: `Bearer ${forged}` } })).status, 401);
});

test("register validation returns 400 with field errors", async () => {
  const res = await call("/api/auth/register", { method: "POST", body: { email: "x@yahoo.com" } });
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.ok(json.message);
  assert.ok(Array.isArray(json.errors));
});

test("login with missing body no longer crashes (400, not 500)", async () => {
  const res = await call("/api/auth/login", { method: "POST", body: {} });
  assert.equal(res.status, 400);
});

test("malformed JSON returns 400", async () => {
  const res = await fetch(base + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{bad json",
  });
  assert.equal(res.status, 400);
});

test("unknown route returns JSON 404", async () => {
  const res = await call("/api/does-not-exist");
  assert.equal(res.status, 404);
  assert.ok((await res.json()).message);
});

test("cron endpoint requires the secret", async () => {
  assert.equal((await call("/api/cron/sla")).status, 401);
  assert.equal((await call("/api/cron/sla", { headers: { Authorization: "Bearer wrong" } })).status, 401);
});

test("CORS rejects unknown origins", async () => {
  const res = await call("/api/auth/login", {
    method: "POST",
    body: { email: "a@b.com", password: "x" },
    headers: { Origin: "https://evil.example" },
  });
  assert.equal(res.status, 403);
});
