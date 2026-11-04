import { test } from "node:test";
import assert from "node:assert/strict";
import { canTransition } from "../src/utils/complaintStatus.js";

test("valid staff transitions", () => {
  assert.ok(canTransition("pending", "in-progress"));
  assert.ok(canTransition("pending", "resolved"));
  assert.ok(canTransition("in-progress", "resolved"));
  assert.ok(canTransition("resolved", "in-progress")); // re-open
});

test("invalid transitions are rejected", () => {
  assert.ok(!canTransition("cancelled", "pending"));
  assert.ok(!canTransition("cancelled", "resolved"));
  assert.ok(!canTransition("resolved", "pending"));
  assert.ok(!canTransition("pending", "cancelled")); // students cancel via their own endpoint
  assert.ok(!canTransition("unknown", "resolved"));
});
