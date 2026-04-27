import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const inputUser = credentials.username.trim();
        const inputPass = credentials.password;

        const validUser = (process.env.ADMIN_USERNAME || "admin").trim();
        const validPass = process.env.ADMIN_PASSWORD || "Tesocol2026";
        const adminName = process.env.ADMIN_NAME || "Administrador";

        if (inputUser === validUser && inputPass === validPass) {
          return {
            id: "1",
            name: adminName,
            email: "admin@tesocol.com",
            role: "admin",
          };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 horas - reduce token regeneration on frequent page refreshes
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
