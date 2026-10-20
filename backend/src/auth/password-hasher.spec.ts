import { hashPassword, verifyPassword } from './password-hasher';

describe('ASP.NET Identity V3 password hash compatibility', () => {
  it('verifies a password hash generated with the same V3 format', async () => {
    const password = 'a-long-test-password';
    const encoded = await hashPassword(password);

    await expect(verifyPassword(password, encoded)).resolves.toBe(true);
    await expect(verifyPassword('incorrect-password', encoded)).resolves.toBe(false);
  });

  it('rejects malformed and unsupported hashes', async () => {
    await expect(verifyPassword('password', 'not-a-password-hash')).resolves.toBe(false);
    await expect(verifyPassword('password', Buffer.from([1, 0, 0, 0, 1]).toString('base64')))
      .resolves.toBe(false);
  });
});
