/** @type {import('next').NextConfig} */
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // No `preload` directive: submitting to the HSTS preload list is a
  // semi-permanent registration (removal takes months to propagate across
  // browsers), so that's a deliberate opt-in the team should make separately,
  // not a default baked into every deploy. Harmless to send over plain HTTP —
  // browsers only act on it when received over HTTPS.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // Lets the dev server accept requests (including HMR) from other devices on the
  // LAN, e.g. testing from a phone/tablet at http://192.168.1.122:3000.
  allowedDevOrigins: ["192.168.1.122"],
  // Baseline security headers applied to every route. A full CSP is intentionally
  // omitted — Next.js injects inline bootstrap scripts, so a correct CSP needs
  // nonce plumbing that is out of scope here.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
