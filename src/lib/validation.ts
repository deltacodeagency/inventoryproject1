import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(1, { message: "Password is required" })
  .min(6, { message: "Password must be at least 6 characters" });
