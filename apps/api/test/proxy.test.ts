import { app } from '@eggjs/mock/bootstrap';
import { strict as assert } from 'node:assert';
import md5 from 'md5';
import * as speakeasy from 'speakeasy';

async function getSessionCookie(): Promise<string> {
  const resBind = await app.httpRequest().get('/api/v1/auth/google-auth-bind');
  const secret: string = resBind.body.data.secret;
  const token = speakeasy.totp({ secret, encoding: 'base32' });
  const resVerify = await app
    .httpRequest()
    .post('/api/v1/auth/google-auth-verify')
    .send({ token });
  const raw = resVerify.headers['set-cookie'] as string | string[] | undefined;
  const setCookie = Array.isArray(raw) ? raw : (raw ? [raw] : []);
  assert(setCookie.length > 0, 'should set cookie');
  const cookieParts = setCookie
    .map(c => c.split(';')[0])
    .filter(c => /^ll_session(\.sig)?=/.test(c));
  assert(cookieParts.length >= 1, 'should contain ll_session cookie');
  return cookieParts.join('; ');
}

describe('Proxy Controller', () => {
  it('should bind bt panel and proxy GET request', async () => {
    const cookie = await getSessionCookie();
    const resBind = await app
      .httpRequest()
      .post('/api/v1/proxy/bind-panel-key')
      .set('Cookie', cookie)
      .send({ type: 'bt', url: 'https://httpbin.org', key: 'abc123' })
      .expect(200);
    assert(resBind.body.code === 200);

    const resGet = await app
      .httpRequest()
      .get('/api/v1/proxy/request')
      .set('Cookie', cookie)
      .query({ panelType: 'bt', url: '/get', method: 'GET' })
      .expect(200);
    assert(resGet.body.code === 200);
    assert(resGet.body.data?.url?.includes('/get'));
  });

  it('should passthrough non-200 status (418)', async () => {
    const cookie = await getSessionCookie();
    const resBind = await app
      .httpRequest()
      .post('/api/v1/proxy/bind-panel-key')
      .set('Cookie', cookie)
      .send({ type: 'bt', url: 'https://httpbin.org', key: 'abc123' })
      .expect(200);
    assert(resBind.body.code === 200);

    await app
      .httpRequest()
      .post('/api/v1/proxy/request')
      .set('Cookie', cookie)
      .send({ panelType: 'bt', url: '/status/418', method: 'GET' })
      .expect(418);
  });

  it('should include bt auth params on POST and verify token', async () => {
    const cookie = await getSessionCookie();
    const key = 'abc123';
    const resBind = await app
      .httpRequest()
      .post('/api/v1/proxy/bind-panel-key')
      .set('Cookie', cookie)
      .send({ type: 'bt', url: 'https://httpbin.org', key })
      .expect(200);
    assert(resBind.body.code === 200);

    const resPost = await app
      .httpRequest()
      .post('/api/v1/proxy/request')
      .set('Cookie', cookie)
      .send({ panelType: 'bt', url: '/post', method: 'POST', params: { foo: 'bar' } })
      .expect(200);
    assert(resPost.body.code === 200);
    const json = resPost.body.data?.json || {};
    assert(json.foo === 'bar');
    assert(typeof json.request_time === 'number');
    assert(typeof json.request_token === 'string');
    const expected = md5(key + json.request_time);
    assert(json.request_token === expected, 'bt request_token should match md5(key + request_time)');
  });

  it('should proxy GET via 1panel', async () => {
    const cookie = await getSessionCookie();
    const resBind = await app
      .httpRequest()
      .post('/api/v1/proxy/bind-panel-key')
      .set('Cookie', cookie)
      .send({ type: '1panel', url: 'https://httpbin.org', key: 'abc123' })
      .expect(200);
    assert(resBind.body.code === 200);

    const resGet = await app
      .httpRequest()
      .get('/api/v1/proxy/request')
      .set('Cookie', cookie)
      .query({ panelType: '1panel', url: '/get', method: 'GET' })
      .expect(200);
    assert(resGet.body.code === 200);
    assert(resGet.body.data?.url?.includes('/get'));
  });

  it('should build path without leading slash and use GET when override', async () => {
    const cookie = await getSessionCookie();
    await app
      .httpRequest()
      .post('/api/v1/proxy/bind-panel-key')
      .set('Cookie', cookie)
      .send({ type: 'bt', url: 'https://httpbin.org/', key: 'abc123' })
      .expect(200);
    const resGet = await app
      .httpRequest()
      .get('/api/v1/proxy/request')
      .set('Cookie', cookie)
      .query({ panelType: 'bt', url: 'get', method: 'GET' })
      .expect(200);
    assert(resGet.body.code === 200);
  });

  it('should return 400 when panel misconfigured (empty url)', async () => {
    const cookie = await getSessionCookie();
    await app
      .httpRequest()
      .post('/api/v1/proxy/bind-panel-key')
      .set('Cookie', cookie)
      .send({ type: 'bt', url: '', key: 'abc123' })
      .expect(200);
    const res = await app
      .httpRequest()
      .get('/api/v1/proxy/request')
      .set('Cookie', cookie)
      .query({ panelType: 'bt', url: '/get', method: 'GET' })
      .expect(400);
    assert(res.body && res.body.code === 400);
  });
});