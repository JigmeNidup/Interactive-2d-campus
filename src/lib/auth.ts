import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth.config";
import { query } from "@/lib/db";
import { loginSchema } from "@/lib/validators";

interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: string;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        try {
          const result = await query<UserRow>(
            "SELECT id, email, name, password_hash, role FROM users WHERE email = $1",
            [email],
          );
          const user = result.rows[0];
          if (!user) return null;

          const matches = await bcrypt.compare(password, user.password_hash);
          if (!matches) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (err) {
          console.error("[auth] authorize error", err);
          return null;
        }
      },
    }),
  ],
});
