import { z } from "zod";
import mongoose from "mongoose";
import { CATEGORIES, PRIORITIES, STATUSES } from "../utils/constants.js";

const blankToUndefined = (v) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const objectId = z.string().refine((v) => mongoose.isValidObjectId(v), "Invalid id");

export const createComplaintSchema = z.object({
  title: z.string({ error: "Title is required" }).trim().min(3, "Title must be at least 3 characters").max(120),
  category: z.enum(CATEGORIES, { error: "Invalid category" }),
  description: z
    .string({ error: "Description is required" })
    .trim()
    .min(5, "Description must be at least 5 characters")
    .max(2000),
  priority: z.preprocess(blankToUndefined, z.enum(PRIORITIES).optional()),
  duplicateOf: z.array(objectId).max(20).optional(),
});

export const editComplaintSchema = z
  .object({
    title: z.preprocess(blankToUndefined, z.string().trim().min(3).max(120).optional()),
    category: z.preprocess(blankToUndefined, z.enum(CATEGORIES).optional()),
    description: z.preprocess(blankToUndefined, z.string().trim().min(5).max(2000).optional()),
  })
  .refine((d) => d.title || d.category || d.description, {
    message: "Provide at least one field to update",
  });

export const updateStatusSchema = z.object({
  status: z.enum(STATUSES.filter((s) => s !== "cancelled"), {
    error: "Status must be pending, in-progress or resolved",
  }),
  note: z.preprocess(blankToUndefined, z.string().trim().max(500).optional()),
});

export const assignSchema = z.object({
  assigneeId: objectId,
});

const toInt = (def, min, max) =>
  z.preprocess(
    blankToUndefined,
    z.coerce.number().int().min(min).max(max).optional().default(def)
  );

// Pagination is opt-in: without page/limit the API returns a plain array
// (keeps the existing frontend working).
export const listQuerySchema = z.object({
  page: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).optional()),
  limit: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(100).optional()),
  status: z.preprocess(blankToUndefined, z.enum(STATUSES).optional()),
  category: z.preprocess(blankToUndefined, z.enum(CATEGORIES).optional()),
  priority: z.preprocess(blankToUndefined, z.enum(PRIORITIES).optional()),
  search: z.preprocess(blankToUndefined, z.string().trim().max(100).optional()),
});
