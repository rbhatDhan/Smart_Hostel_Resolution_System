import { test } from "node:test";
import assert from "node:assert/strict";
import { computeSlaHours, computeSlaStatus, getSlaDetails, formatDuration } from "../src/utils/sla.js";

const hoursFromNow = (h) => new Date(Date.now() + h * 3600 * 1000);

test("SLA hours by category", () => {
  assert.equal(computeSlaHours("Electrical"), 48);
  assert.equal(computeSlaHours("Plumbing"), 48);
  assert.equal(computeSlaHours("WiFi"), 72);
});

test("urgent complaints are capped at 6h", () => {
  assert.equal(computeSlaHours("Cleaning", true), 6);
  assert.equal(computeSlaHours("Electrical", true), 6);
});

test("open complaint inside deadline is on-time", () => {
  assert.equal(computeSlaStatus({ status: "pending", slaDeadline: hoursFromNow(5) }), "on-time");
});

test("open complaint past deadline is delayed and breached", () => {
  const c = { status: "in-progress", slaDeadline: hoursFromNow(-3) };
  assert.equal(computeSlaStatus(c), "delayed");
  assert.equal(getSlaDetails(c).isBreached, true);
});

test("resolved complaint is judged by resolvedAt, not now", () => {
  const onTime = { status: "resolved", slaDeadline: hoursFromNow(-1), resolvedAt: hoursFromNow(-2) };
  const late = { status: "resolved", slaDeadline: hoursFromNow(-2), resolvedAt: hoursFromNow(-1) };
  assert.equal(computeSlaStatus(onTime), "on-time");
  assert.equal(computeSlaStatus(late), "delayed");
});

test("cancelled complaints never count as breaches", () => {
  assert.equal(computeSlaStatus({ status: "cancelled", slaDeadline: hoursFromNow(-100) }), "on-time");
});

test("formatDuration", () => {
  assert.equal(formatDuration(45), "45 min");
  assert.equal(formatDuration(125), "2h 5m");
  assert.equal(formatDuration(60 * 26), "1d 2h");
});
