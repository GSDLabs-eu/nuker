const { makeRequests } = require('./lib/makeRequests');
const { buildOutput } = require('./lib/buildOutput');
const events = require('./lib/events');

async function loadTest(test) {
  events.emit('started', test);

  const output = buildOutput(await makeRequests(test));
  Object.assign(output, {
    apiUrl: test.apiUrl,
    requestCount: test.requestCount,
    testDurationSeconds: test.testDurationSeconds,
  });

  events.emit('completed', output);
  return output;
}

module.exports = loadTest;
