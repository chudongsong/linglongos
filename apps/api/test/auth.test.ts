import { app } from '@eggjs/mock/bootstrap';
import { strict as assert } from 'node:assert';
import * as speakeasy from 'speakeasy';

describe('Auth Controller', () => {
  it('should generate QR code without saving secret', async () => {
    const resBind = await app.httpRequest()
      .get('/api/v1/auth/google-auth-bind')
      .expect(200);

    assert(resBind.body?.data?.secret, 'secret should exist');
    assert(resBind.body?.data?.qrCodeUrl, 'qrCodeUrl should exist');
  });

  it('should confirm bind and verify 2FA, setting session cookie', async () => {
    const resBind = await app.httpRequest()
      .get('/api/v1/auth/google-auth-bind')
      .expect(200);

    assert(resBind.body?.data?.secret, 'secret should exist');
    const secret: string = resBind.body.data.secret;
    const token = speakeasy.totp({ secret, encoding: 'base32' });

    const resConfirm = await app.httpRequest()
      .post('/api/v1/auth/google-auth-confirm')
      .send({ secret, token })
      .expect(200);

    const raw = resConfirm.headers['set-cookie'] as string | string[] | undefined;
    const setCookie = Array.isArray(raw) ? raw : (raw ? [raw] : []);
    assert(setCookie.length > 0, 'should return set-cookie');
    assert(setCookie.some(c => /^ll_session=/.test(c)), 'should set ll_session cookie');
    // cookie signature and httpOnly
    assert(setCookie.some(c => /ll_session\.sig=/.test(c)), 'should have signed cookie');
    assert(setCookie.some(c => /HttpOnly/i.test(c)), 'cookie should be HttpOnly');
  });

  it('should return 401 when confirm with invalid token', async () => {
    const res = await app.httpRequest()
      .post('/api/v1/auth/google-auth-confirm')
      .send({ secret: 'invalid-secret', token: 'invalid-token' })
      .expect(401);
    assert(res.body && res.body.code === 401);
  });

  it('should return 401 when token is invalid for verify', async () => {
    const res = await app.httpRequest()
      .post('/api/v1/auth/google-auth-verify')
      .send({ token: 'invalid-token' })
      .expect(401);
    assert(res.body && res.body.code === 401);
  });
});