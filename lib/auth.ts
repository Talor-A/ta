import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { env } from 'cloudflare:workers'

const db = env.DB;
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite"
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable email verification for personal use
  },
  baseURL: process.env.BASE_URL || "http://localhost:5173",
});
