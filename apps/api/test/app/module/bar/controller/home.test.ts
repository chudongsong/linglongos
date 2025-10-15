import { strict as assert } from 'node:assert';
import { app } from '@eggjs/mock/bootstrap';

async function getSessionCookie(): Promise<string> {
  const resBind = await app.httpRequest().get('/api/v1/auth/google-auth-bind');
  const secret: string = resBind.body.data.secret;
  const speakeasy = await import('speakeasy');
  const token = speakeasy.totp({ secret, encoding: 'base32' });
  const resVerify = await app
    .httpRequest()
    .post('/api/v1/auth/google-auth-verify')
    .send({ token });
  const raw = resVerify.headers['set-cookie'] as string | string[] | undefined;
  const setCookie = Array.isArray(raw) ? raw : (raw ? [raw] : []);
  const cookieParts = setCookie
    .map(c => c.split(';')[0])
    .filter(c => /^ll_session(\.sig)?=/.test(c));
  return cookieParts.join('; ');
}

describe('test/app/module/bar/controller/home.test.ts', () => {
  it('should GET /', async () => {
    const cookie = await getSessionCookie();
    const res = await app.httpRequest().get('/').set('Cookie', cookie);
    assert.equal(res.status, 200);
    assert.equal(res.text, 'hello egg');
  });
});
