import { z } from "zod";
import { getAllowedEmailDomains } from "../config/env.js";

// "" -> undefined so optional form fields that were left blank are ignored
const blankToUndefined = (v) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const email = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .pipe(z.string().email("Enter a valid email address"));

const password = z
  .string({ error: "Password is required" })
  .min(6, "Password must be at least 6 characters")
  .max(72, "Password must be at most 72 characters"); // bcrypt limit

const phone = z.preprocess(
  blankToUndefined,
  z
    .string()
    .trim()
    .regex(/^[0-9+()\-\s]{6,20}$/, "Enter a valid phone number")
    .optional()
);

const roomNumber = z.preprocess(
  blankToUndefined,
  z.string().trim().min(1).max(20, "Room number is too long").optional()
);

export const registerSchema = z.object({
  name: z.string({ error: "Name is required" }).trim().min(2, "Name must be at least 2 characters").max(60),
  email: email.refine(
    (e) => getAllowedEmailDomains().includes(e.split("@")[1]),
    () => ({ message: `Only these email domains are allowed: ${getAllowedEmailDomains().join(", ")}` })
  ),
  password,
  roomNumber: z.string({ error: "Room number is required" }).trim().min(1, "Room number is required").max(20),
  // NOTE: a "role" field in the body is intentionally not part of the schema
  // and is therefore stripped - nobody can self-register as warden/admin.
});

export const loginSchema = z.object({
  email,
  password: z.string({ error: "Password is required" }).min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z.preprocess(blankToUndefined, z.string().trim().min(2).max(60).optional()),
  roomNumber,
  phone,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string({ error: "Current password is required" }).min(1, "Current password is required"),
    newPassword: password,
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "New password must be different from the current password",
    path: ["newPassword"],
  });

// Admin: create a user of any role (e.g. a warden)
export const adminCreateUserSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email,
  password,
  role: z.enum(["student", "warden", "admin"]),
  roomNumber,
  phone,
});

// Admin: change role / activate / deactivate
export const adminUpdateUserSchema = z
  .object({
    role: z.enum(["student", "warden", "admin"]).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => d.role !== undefined || d.isActive !== undefined, {
    message: "Provide role and/or isActive",
  });
