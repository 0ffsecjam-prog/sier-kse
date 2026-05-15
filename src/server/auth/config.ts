import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config. NO Prisma, NO bcrypt — only what middleware needs.
 * The full config (with the Credentials authorize() that hits the DB) lives in auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "VIEWER";
      }
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const pathname = request.nextUrl.pathname;

      const isLoginPage = pathname === "/login";
      const isApiAuth = pathname.startsWith("/api/auth");
      const isAdminRoute = pathname.startsWith("/admin");

      if (isApiAuth) return true;
      if (isLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", request.nextUrl));
        return true;
      }
      if (!isLoggedIn) return false;
      if (isAdminRoute && auth?.user?.role !== "ADMIN") {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
