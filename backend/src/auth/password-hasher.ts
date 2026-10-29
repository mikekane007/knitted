import { pbkdf2, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const deriveKey = promisify(pbkdf2);
const IDENTITY_V3_MARKER = 1;
const PRF_HMAC_SHA512 = 2;
const ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const SUBKEY_LENGTH = 32;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const subkey = await deriveKey(password, salt, ITERATIONS, SUBKEY_LENGTH, 'sha512');
  const header = Buffer.alloc(13);
  header[0] = IDENTITY_V3_MARKER;
  header.writeUInt32BE(PRF_HMAC_SHA512, 1);
  header.writeUInt32BE(ITERATIONS, 5);
  header.writeUInt32BE(SALT_LENGTH, 9);
  return Buffer.concat([header, salt, subkey]).toString('base64');
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  try {
    const decoded = Buffer.from(encoded, 'base64');
    if (decoded[0] !== IDENTITY_V3_MARKER || decoded.length < 14) {
      return false;
    }

    const prf = decoded.readUInt32BE(1);
    const iterations = decoded.readUInt32BE(5);
    const saltLength = decoded.readUInt32BE(9);
    if (prf !== PRF_HMAC_SHA512 || iterations < 1 || saltLength < 1) {
      return false;
    }

    const saltEnd = 13 + saltLength;
    if (decoded.length <= saltEnd) {
      return false;
    }
    const salt = decoded.subarray(13, saltEnd);
    const expected = decoded.subarray(saltEnd);
    const actual = await deriveKey(password, salt, iterations, expected.length, 'sha512');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
