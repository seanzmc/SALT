const apiOrigin = process.env.SALT_API_ORIGIN;

if (!apiOrigin) {
  throw new Error("SALT_API_ORIGIN must be set for @salt/web Vercel rewrites.");
}

export const config = {
  buildCommand: "npm run build",
  outputDirectory: "dist",
  rewrites: [
    {
      source: "/api/(.*)",
      destination: `${apiOrigin}/api/$1`
    },
    {
      source: "/(.*)",
      destination: "/index.html"
    }
  ]
};
