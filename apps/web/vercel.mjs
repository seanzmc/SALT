const apiOrigin = process.env.SALT_API_ORIGIN;

if (!apiOrigin) {
  throw new Error("SALT_API_ORIGIN must be set for @salt/web Vercel rewrites.");
}

const normalizedApiOrigin = apiOrigin.replace(/\/+$/, "");

export const config = {
  buildCommand: "npm run build",
  outputDirectory: "dist",
  rewrites: async () => [
    {
      source: "/api/:path*",
      destination: `${normalizedApiOrigin}/api/:path*`
    },
    {
      source: "/:path*",
      destination: "/index.html"
    }
  ]
};
