const Hapi = require('hapi'); // eslint-disable-line import/no-extraneous-dependencies
const { wait } = require('../lib/utils');
const { log, logError } = require('../lib/logger');

const DEFAULT_TIMEOUT = 0;
const DEFAULT_STATUS_CODE = 200;

const server = Hapi.server({
  host: 'localhost',
  port: 4343,
});

server.route({
  method: '*',
  path: '/',
  async handler(request, h) {
    const timeout = request.query.wait || DEFAULT_TIMEOUT;
    let statusCode = parseInt(request.query.statusCode, 10) || DEFAULT_STATUS_CODE;

    if (request.query.error > Math.round(Math.random() * 100)) statusCode = 500;

    const payload = { timeout, statusCode };
    const response = h.response(payload);
    response.code(statusCode);
    await wait(timeout);
    return response;
  },
});

async function start() {
  try {
    await server.start();
  } catch (err) {
    logError(err);
    process.exit(1);
  }
  log(`Server running at: ${server.info.uri}`);
}

start();
