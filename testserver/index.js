const Hapi = require('hapi');
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
    const statusCode = parseInt(request.query.statusCode, 10) || DEFAULT_STATUS_CODE;
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
