import type { NextRequest } from "next/server";

const AUTH_SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

const AUTH_JWT_ALG = "dir";
const AUTH_JWT_ENC = "A256CBC-HS512";
const AUTH_JWT_FALLBACK_ENC = "A256GCM";
const AUTH_JWT_INFO_PREFIX = "Auth.js Generated Encryption Key";
const CLOCK_TOLERANCE_SECONDS = 15;
const HMAC_TAG_BYTES = 32;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

type AuthTokenPayload = {
  exp?: unknown;
  nbf?: unknown;
  role?: unknown;
};

type CompactJweHeader = {
  alg?: unknown;
  enc?: unknown;
  kid?: unknown;
  zip?: unknown;
};

export async function getEdgeAdminRole(req: NextRequest): Promise<string | null> {
  const sessionCookie = getSessionCookie(req);
  if (!sessionCookie) return null;

  try {
    const payload = await decryptAuthToken(sessionCookie.value, sessionCookie.name);
    if (!isActiveJwtPayload(payload)) return null;
    return normalizeRole(payload);
  } catch (error) {
    console.error("edge-session: failed to read admin role", error);
    return null;
  }
}

function getSessionCookie(req: NextRequest): { name: string; value: string } | null {
  for (const name of AUTH_SESSION_COOKIE_NAMES) {
    const wholeCookie = req.cookies.get(name)?.value;
    if (wholeCookie) return { name, value: wholeCookie };

    const chunks = req.cookies
      .getAll()
      .filter((cookie) => cookie.name.startsWith(`${name}.`))
      .sort((a, b) => Number(a.name.slice(name.length + 1)) - Number(b.name.slice(name.length + 1)))
      .map((cookie) => cookie.value);

    if (chunks.length > 0) return { name, value: chunks.join("") };
  }

  return null;
}

async function decryptAuthToken(token: string, cookieName: string): Promise<unknown> {
  const parts = token.split(".");
  if (parts.length !== 5) throw new Error("Invalid compact JWE");

  const [protectedHeader, encryptedKey, iv, ciphertext, tag] = parts;
  if (encryptedKey !== "") throw new Error("Unsupported Auth.js JWE key management");

  const header = parseProtectedHeader(protectedHeader);
  if (header.alg !== AUTH_JWT_ALG) throw new Error("Unsupported Auth.js JWE algorithm");
  if (header.zip) throw new Error("Compressed Auth.js JWTs are not supported in middleware");
  if (header.enc !== AUTH_JWT_ENC && header.enc !== AUTH_JWT_FALLBACK_ENC) {
    throw new Error("Unsupported Auth.js JWE encryption");
  }

  const key = await deriveAuthKey(header.enc, cookieName);
  if (typeof header.kid === "string") {
    const thumbprint = await calculateOctThumbprint(key);
    if (header.kid !== thumbprint) throw new Error("No matching Auth.js JWT key");
  }

  const plaintext =
    header.enc === AUTH_JWT_ENC
      ? await decryptCbcHmac(protectedHeader, key, iv, ciphertext, tag)
      : await decryptGcm(protectedHeader, key, iv, ciphertext, tag);

  return JSON.parse(textDecoder.decode(plaintext));
}

function parseProtectedHeader(value: string): CompactJweHeader {
  return JSON.parse(textDecoder.decode(base64urlDecode(value))) as CompactJweHeader;
}

async function decryptCbcHmac(
  protectedHeader: string,
  key: Uint8Array,
  iv: string,
  ciphertext: string,
  tag: string,
): Promise<Uint8Array> {
  const aad = textEncoder.encode(protectedHeader);
  const ivBytes = base64urlDecode(iv);
  const ciphertextBytes = base64urlDecode(ciphertext);
  const tagBytes = base64urlDecode(tag);
  const macKey = key.slice(0, HMAC_TAG_BYTES);
  const encKey = key.slice(HMAC_TAG_BYTES);
  const expectedTag = await signCbcTag(macKey, aad, ivBytes, ciphertextBytes);

  if (!constantTimeEqual(tagBytes, expectedTag)) throw new Error("Invalid Auth.js JWT tag");

  const cryptoKey = await crypto.subtle.importKey("raw", toArrayBuffer(encKey), "AES-CBC", false, ["decrypt"]);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv: toArrayBuffer(ivBytes) },
    cryptoKey,
    toArrayBuffer(ciphertextBytes),
  );
  return new Uint8Array(plaintext);
}

async function decryptGcm(
  protectedHeader: string,
  key: Uint8Array,
  iv: string,
  ciphertext: string,
  tag: string,
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey("raw", toArrayBuffer(key), "AES-GCM", false, ["decrypt"]);
  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: toArrayBuffer(base64urlDecode(iv)),
      additionalData: toArrayBuffer(textEncoder.encode(protectedHeader)),
      tagLength: 128,
    },
    cryptoKey,
    toArrayBuffer(concatBytes(base64urlDecode(ciphertext), base64urlDecode(tag))),
  );
  return new Uint8Array(plaintext);
}

async function signCbcTag(
  macKey: Uint8Array,
  aad: Uint8Array,
  iv: Uint8Array,
  ciphertext: Uint8Array,
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(macKey),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    toArrayBuffer(concatBytes(aad, iv, ciphertext, uint64be(aad.byteLength * 8))),
  );
  return new Uint8Array(signature).slice(0, HMAC_TAG_BYTES);
}

async function deriveAuthKey(enc: string, cookieName: string): Promise<Uint8Array> {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");

  const length = enc === AUTH_JWT_FALLBACK_ENC ? 32 : 64;
  const encodedSecret = textEncoder.encode(secret);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(encodedSecret),
    "HKDF",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: textEncoder.encode(cookieName),
      info: textEncoder.encode(`${AUTH_JWT_INFO_PREFIX} (${cookieName})`),
    },
    keyMaterial,
    length * 8,
  );

  return new Uint8Array(bits);
}

async function calculateOctThumbprint(key: Uint8Array): Promise<string> {
  const algorithm = key.byteLength === 64 ? "SHA-512" : "SHA-256";
  const jwk = `{"k":"${base64urlEncode(key)}","kty":"oct"}`;
  const digest = await crypto.subtle.digest(algorithm, textEncoder.encode(jwk));
  return base64urlEncode(new Uint8Array(digest));
}

function isActiveJwtPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const token = payload as AuthTokenPayload;
  const now = Math.floor(Date.now() / 1000);

  if (typeof token.exp === "number" && now - CLOCK_TOLERANCE_SECONDS >= token.exp) {
    return false;
  }
  if (typeof token.nbf === "number" && now + CLOCK_TOLERANCE_SECONDS < token.nbf) {
    return false;
  }

  return true;
}

function normalizeRole(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const token = payload as AuthTokenPayload;
  return typeof token.role === "string" ? token.role : null;
}

function base64urlDecode(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function base64urlEncode(value: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < value.byteLength; index += 1) {
    binary += String.fromCharCode(value[index]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function concatBytes(...chunks: readonly Uint8Array[]): Uint8Array {
  const length = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

function uint64be(value: number): Uint8Array {
  const output = new Uint8Array(8);
  const view = new DataView(output.buffer);
  view.setUint32(0, Math.floor(value / 2 ** 32));
  view.setUint32(4, value >>> 0);
  return output;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  return a.reduce((diff, byte, index) => diff | (byte ^ b[index]), 0) === 0;
}

function toArrayBuffer(value: Uint8Array): ArrayBuffer {
  return new Uint8Array(value).buffer;
}
