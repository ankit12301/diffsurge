import { z } from "zod";

// ──────────────────────────────────────────────────────────────────
// Project Schemas
// ──────────────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be less than 100 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug must be less than 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial();

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ──────────────────────────────────────────────────────────────────
// Replay Schemas
// ──────────────────────────────────────────────────────────────────

export const createReplaySchema = z.object({
  name: z
    .string()
    .min(1, "Replay name is required")
    .max(100, "Replay name must be less than 100 characters"),
  environment_id: z.string().min(1, "Environment is required"),
  start_date: z.string().datetime("Invalid start date"),
  end_date: z.string().datetime("Invalid end date"),
  sample_size: z
    .number()
    .int("Sample size must be an integer")
    .min(1, "Sample size must be at least 1")
    .max(10000, "Sample size must be at most 10,000")
    .optional(),
  filters: z
    .object({
      methods: z
        .array(z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]))
        .optional(),
      paths: z.array(z.string()).optional(),
      status_codes: z.array(z.number().int()).optional(),
    })
    .optional(),
});

export type CreateReplayInput = z.infer<typeof createReplaySchema>;

// ──────────────────────────────────────────────────────────────────
// Environment Schemas
// ──────────────────────────────────────────────────────────────────

export const createEnvironmentSchema = z.object({
  name: z
    .string()
    .min(1, "Environment name is required")
    .max(100, "Environment name must be less than 100 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug must be less than 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
  base_url: z
    .string()
    .url("Must be a valid URL")
    .startsWith("http", "URL must start with http:// or https://"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

export type CreateEnvironmentInput = z.infer<typeof createEnvironmentSchema>;

export const updateEnvironmentSchema = createEnvironmentSchema.partial();

export type UpdateEnvironmentInput = z.infer<typeof updateEnvironmentSchema>;

// ──────────────────────────────────────────────────────────────────
// Team Member Schemas
// ──────────────────────────────────────────────────────────────────

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "member"]),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

// ──────────────────────────────────────────────────────────────────
// API Key Schemas
// ──────────────────────────────────────────────────────────────────

export const createApiKeySchema = z.object({
  name: z
    .string()
    .min(1, "API key name is required")
    .max(100, "API key name must be less than 100 characters"),
  expires_at: z.string().datetime("Invalid expiration date").optional(),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

// ──────────────────────────────────────────────────────────────────
// Schema Upload
// ──────────────────────────────────────────────────────────────────

export const uploadSchemaSchema = z.object({
  version: z
    .string()
    .min(1, "Version is required")
    .regex(
      /^\d+\.\d+\.\d+$/,
      "Version must be in semantic versioning format (e.g., 1.0.0)",
    ),
  schema: z
    .record(z.string(), z.unknown())
    .refine((data) => Object.keys(data).length > 0, {
      message: "Schema cannot be empty",
    }),
});

export type UploadSchemaInput = z.infer<typeof uploadSchemaSchema>;

// ──────────────────────────────────────────────────────────────────
// Auth Schemas
// ──────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    confirm_password: z.string(),
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be less than 100 characters"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ──────────────────────────────────────────────────────────────────
// Filter Schemas
// ──────────────────────────────────────────────────────────────────

export const trafficFilterSchema = z.object({
  project_id: z.string().optional(),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).optional(),
  status_code: z.number().int().min(100).max(599).optional(),
  path: z.string().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export type TrafficFilterInput = z.infer<typeof trafficFilterSchema>;
