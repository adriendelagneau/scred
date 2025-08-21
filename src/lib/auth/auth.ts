import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { magicLink, captcha } from "better-auth/plugins";

import { sendEmail } from "@/actions/email-actions";

import { db } from "../db";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  plugins: [
    nextCookies(),
    captcha({
      provider: "google-recaptcha",
      secretKey: process.env.RECAPTCHA_SECRET_KEY!,
    }),
    magicLink({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      sendMagicLink: async ({ email, token, url }, req) => {
        const username = email.split("@")[0]; // fallback display name
        await sendEmail({
          to: email,
          username,
          subject: "Your Magic Sign-In Link",
          text: "Click the button below to sign in. This link is valid for a limited time.",
          buttonText: "Sign In",
          linkUrl: url,
        });
      },
    }),
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
});
