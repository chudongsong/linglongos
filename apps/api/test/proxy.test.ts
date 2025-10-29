import { app } from '@eggjs/mock/bootstrap';
import { strict as assert } from 'node:assert';
import md5 from 'md5';
import * as speakeasy from 'speakeasy';

async function getSessionCookie(): Promise<string> {
  const resBind = await app.httpRequest().get('/api/v1/auth/google-auth-bind');
  const secret: string = resBind.body.data.secret;
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

describe('Proxy Controller', () => {
  it('should bind bt panel and proxy GET request', async () => {
    const cookie = await getSessionCookie();
    const resBind = await app
      .httpRequest()
      .post('/api/v1/panels/set_proxy_panel')
      .set('Cookie', cookie)
      .send({ type: 'bt', url: 'https://jsonplaceholder.typicode.com', key: 'abc123' })
      .expect(201);
    assert(resBind.body.code === 201);

    const resGet = await app
      .httpRequest()
      .get('/api/v1/proxy/request')
      .set('Cookie', cookie)
      .query({ panelType: 'bt', url: '/posts/1', method: 'GET' })
      .expect(200);
    assert(resGet.body.code === 200);
    assert(resGet.body.data?.id === 1);
  });

  it('should passthrough non-200 status (404)', async () => {
    const cookie = await getSessionCookie();
    const resBind = await app
      .httpRequest()
      .post('/api/v1/panels/set_proxy_panel')
      .set('Cookie', cookie)
      .send({ type: 'bt', url: 'https://jsonplaceholder.typicode.com', key: 'abc123' })
      .expect(201);
    assert(resBind.body.code === 201);

    await app
      .httpRequest()
      .post('/api/v1/proxy/request')
      .set('Cookie', cookie)
      .send({ panelType: 'bt', url: '/posts/999999', method: 'GET' })
      .expect(404);
  });

  it('should include bt auth params on POST and verify token', async () => {
    const cookie = await getSessionCookie();
    const key = 'abc123';
    const resBind = await app
      .httpRequest()
      .post('/api/v1/panels/set_proxy_panel')
      .set('Cookie', cookie)
      .send({ type: 'bt', url: 'https://jsonplaceholder.typicode.com', key })
      .expect(201);
    assert(resBind.body.code === 201);

    const resPost = await app
      .httpRequest()
      .post('/api/v1/proxy/request')
      .set('Cookie', cookie)
      .send({ panelType: 'bt', url: '/posts', method: 'POST', params: { foo: 'bar' } })
      .expect(200);
    assert(resPost.body.code === 200);
    const data = resPost.body.data || {};
    assert(data.foo === 'bar');
    assert(typeof data.request_time === 'number');
    assert(typeof data.request_token === 'string');
    const expected = md5(key + data.request_time);
    assert(data.request_token === expected, 'bt request_token should match md5(key + request_time)');
  });

  it('should proxy GET via 1panel', async () => {
    const cookie = await getSessionCookie();
    const resBind = await app
      .httpRequest()
      .post('/api/v1/panels/set_proxy_panel')
      .set('Cookie', cookie)
      .send({ type: '1panel', url: 'https://jsonplaceholder.typicode.com', key: 'abc123' })
      .expect(201);
    assert(resBind.body.code === 201);

    const resGet = await app
      .httpRequest()
      .get('/api/v1/proxy/request')
      .set('Cookie', cookie)
      .query({ panelType: '1panel', url: '/posts/1', method: 'GET' })
      .expect(200);
    assert(resGet.body.code === 200);
    assert(resGet.body.data?.id === 1);
  });

  it('should build path without leading slash and use GET when override', async () => {
    const cookie = await getSessionCookie();
    await app
      .httpRequest()
      .post('/api/v1/panels/set_proxy_panel')
      .set('Cookie', cookie)
      .send({ type: 'bt', url: 'https://jsonplaceholder.typicode.com/', key: 'abc123' })
      .expect(201);
    const resGet = await app
      .httpRequest()
      .get('/api/v1/proxy/request')
      .set('Cookie', cookie)
      .query({ panelType: 'bt', url: 'posts/1', method: 'GET' })
      .expect(200);
    assert(resGet.body.code === 200);
  });

  it('should return 400 when panel misconfigured (empty url)', async () => {
    const cookie = await getSessionCookie();
    await app
      .httpRequest()
      .post('/api/v1/panels/set_proxy_panel')
      .set('Cookie', cookie)
      .send({ type: 'bt', url: '', key: 'abc123' })
      .expect(201);
    const res = await app
      .httpRequest()
      .get('/api/v1/proxy/request')
      .set('Cookie', cookie)
      .query({ panelType: 'bt', url: '/get', method: 'GET' })
      .expect(400);
    assert(res.body && res.body.code === 400);
  });
});