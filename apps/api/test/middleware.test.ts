import { app } from '@eggjs/mock/bootstrap';
import { strict as assert } from 'node:assert';

async function getSessionCookie(): Promise<string> {
  const resBind = await app.httpRequest().get('/api/v1/auth/google-auth-bind');
  const secret: string = resBind.body.data.secret;
  const speakeasy = await import('speakeasy');
  const token = speakeasy.totp({ secret, encoding: 'base32' });
  const resConfirm = await app
    .httpRequest()
    .post('/api/v1/auth/google-auth-confirm')
    .send({ secret, token });
  const raw = resConfirm.headers['set-cookie'] as string | string[] | undefined;
  const setCookie = Array.isArray(raw) ? raw : (raw ? [raw] : []);
  assert(setCookie.length > 0, 'should set cookie');
  const cookieParts = setCookie
    .map(c => c.split(';')[0])
    .filter(c => /^ll_session(\.sig)?=/.test(c));
  assert(cookieParts.length >= 1, 'should contain ll_session cookie');
  return cookieParts.join('; ');
}

describe('Middleware chain', () => {
  it('should 401 without session and set common header only', async () => {
    const res = await app.httpRequest()
      .get('/api/v1/proxy/request')
      .expect(401);
    assert(res.headers['x-common-middleware'] === 'enabled');
    assert(!res.headers['x-bt-middleware'], 'bt header should be absent when auth fails');
    assert(res.body && res.body.code === 401 && res.body.error && res.body.error.details === 'AUTH_REQUIRED');
  });

  it('should pass auth and include both common and bt headers', async () => {
    const cookie = await getSessionCookie();
    await app
      .httpRequest()
      .post('/api/v1/panels/set_proxy_panel')
      .set('Cookie', cookie)
      .send({ type: 'bt', url: 'https://jsonplaceholder.typicode.com', key: 'abc123' })
      .expect(201);
    const res = await app.httpRequest()
      .get('/api/v1/proxy/request')
      .set('Cookie', cookie)
      .query({ panelType: 'bt', url: '/posts/1', method: 'GET' })
      .expect(200);
    assert(res.headers['x-common-middleware'] === 'enabled');
    assert(res.headers['x-bt-middleware'] === 'enabled');
  });
});