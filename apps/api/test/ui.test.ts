import { app } from '@eggjs/mock/bootstrap';
import { strict as assert } from 'node:assert';

describe('Ui Controller', () => {
  it('should redirect /ui to /public/index.html', async () => {
    const res = await app.httpRequest()
      .get('/ui')
      .expect(302);
    const loc = res.headers['location'];
    assert(loc === '/public/index.html');
  });
});