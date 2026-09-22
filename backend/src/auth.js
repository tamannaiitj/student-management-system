import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const secret = process.env.JWT_SECRET;
if (!secret || secret === 'replace-with-a-long-random-secret') {
  throw new Error('Set JWT_SECRET in your .env file before starting the server.');
}

const tokenLifetimeHours = Number(process.env.JWT_EXPIRES_IN_HOURS || 8);
const base64Url = (value) => Buffer.from(value).toString('base64url');

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const calculated = scryptSync(password, salt, 64);
  return timingSafeEqual(calculated, Buffer.from(hash, 'hex'));
}

export function createToken(user) {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({ sub: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + (tokenLifetimeHours * 3600) }));
  const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export function readToken(token) {
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) return null;
  const expected = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return claims.exp > Math.floor(Date.now() / 1000) ? claims : null;
  } catch {
    return null;
  }
}
