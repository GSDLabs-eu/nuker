const Hapi = require('hapi');
const { wait } = require('../lib/utils');

const server = Hapi.server({
  host: 'localhost',
  port: 4343,
});

server.route({
  method: '*',
  path: '/',
  handler: async function handler(request, h) {
    const timeout = request.query.wait || 0;
    const statusCode = parseInt(request.query.statusCode, 10) || 200;
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
    console.log(err);
    process.exit(1);
  }
  console.log('Server running at:', server.info.uri);
}

start();
