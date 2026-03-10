import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login"
  },
  secret: process.env.NEXTAUTH_SECRET
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|_vercel|favicon.ico|uploads|login).*)"]
};
