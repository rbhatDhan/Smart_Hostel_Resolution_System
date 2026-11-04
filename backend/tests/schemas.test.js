import { test } from "node:test";
import assert from "node:assert/strict";
import { registerSchema, loginSchema, changePasswordSchema, adminUpdateUserSchema } from "../src/schemas/authSchemas.js";
import { createComplaintSchema, updateStatusSchema, editComplaintSchema } from "../src/schemas/complaintSchemas.js";

const validRegister = { name: "Asha Rao", email: "Asha@Gmail.com", password: "secret1", roomNumber: "B-204" };

test("register: normalises email and strips a self-assigned role", () => {
  const r = registerSchema.parse({ ...validRegister, role: "admin" });
  assert.equal(r.email, "asha@gmail.com");
  assert.equal("role" in r, false); // privilege escalation attempt is dropped
});

test("register: rejects disallowed email domain, short password, missing room", () => {
  assert.equal(registerSchema.safeParse({ ...validRegister, email: "a@yahoo.com" }).success, false);
  assert.equal(registerSchema.safeParse({ ...validRegister, password: "123" }).success, false);
  assert.equal(registerSchema.safeParse({ ...validRegister, roomNumber: "" }).success, false);
});

test("register: allowed domains are configurable", () => {
  process.env.ALLOWED_EMAIL_DOMAINS = "college.edu";
  assert.equal(registerSchema.safeParse({ ...validRegister, email: "a@college.edu" }).success, true);
  assert.equal(registerSchema.safeParse(validRegister).success, false);
  delete process.env.ALLOWED_EMAIL_DOMAINS;
});

test("login: missing fields rejected", () => {
  assert.equal(loginSchema.safeParse({}).success, false);
  assert.equal(loginSchema.safeParse({ email: "x@y.com", password: "p" }).success, true);
});

test("change password: new must differ from current", () => {
  assert.equal(changePasswordSchema.safeParse({ currentPassword: "abcdef", newPassword: "abcdef" }).success, false);
  assert.equal(changePasswordSchema.safeParse({ currentPassword: "abcdef", newPassword: "ghijkl" }).success, true);
});

test("admin update user: needs role or isActive, role must be valid", () => {
  assert.equal(adminUpdateUserSchema.safeParse({}).success, false);
  assert.equal(adminUpdateUserSchema.safeParse({ role: "superuser" }).success, false);
  assert.equal(adminUpdateUserSchema.safeParse({ role: "warden" }).success, true);
  assert.equal(adminUpdateUserSchema.safeParse({ isActive: false }).success, true);
});

test("create complaint: blank priority is accepted (frontend sends '')", () => {
  const r = createComplaintSchema.parse({
    title: "Fan not working", category: "Electrical", description: "Ceiling fan stopped", priority: "",
  });
  assert.equal(r.priority, undefined);
});

test("create complaint: invalid category / short description rejected", () => {
  assert.equal(createComplaintSchema.safeParse({ title: "abc", category: "Food", description: "long enough" }).success, false);
  assert.equal(createComplaintSchema.safeParse({ title: "abc", category: "WiFi", description: "no" }).success, false);
});

test("update status: cancelled is not settable by staff", () => {
  assert.equal(updateStatusSchema.safeParse({ status: "cancelled" }).success, false);
  assert.equal(updateStatusSchema.safeParse({ status: "resolved", note: "Replaced the bulb" }).success, true);
});

test("edit complaint: needs at least one field", () => {
  assert.equal(editComplaintSchema.safeParse({}).success, false);
  assert.equal(editComplaintSchema.safeParse({ title: "New title" }).success, true);
});
