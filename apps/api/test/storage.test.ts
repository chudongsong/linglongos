import { app } from '@eggjs/mock/bootstrap';
import { strict as assert } from 'node:assert';

describe('StorageService', () => {
  it('should set and get 2FA secret', async () => {
    const ctx = app.mockContext();
    const secret = 'TEST_SECRET_' + Date.now();
    ctx.service.storage.setTwoFASecret(secret);
    const got = ctx.service.storage.getTwoFASecret();
    assert.strictEqual(got, secret);
  });

  it('should create session and validate expiration', async () => {
    const ctx = app.mockContext();
    const sid = ctx.service.storage.createSession(10);
    assert(typeof sid === 'string' && sid.length > 0);
    assert(ctx.service.storage.isValidSession(sid) === true);
    await new Promise(r => setTimeout(r, 20));
    assert(ctx.service.storage.isValidSession(sid) === false);
  });

  it('should bind and get panel config', async () => {
    const ctx = app.mockContext();
    ctx.service.storage.bindPanelKey('bt', 'https://example.com', 'key123');
    const p = ctx.service.storage.getPanel('bt');
    assert(p && p.url === 'https://example.com' && p.key === 'key123');
  });
});