const rp = require('request-promise');
const fs = require('fs');
const { wait } = require('./utils');
const { parseFileName } = require('./utils');
const mime = require('mime-types');

async function networkRequest(method, uri, payloadPaths, keyValuePairs) {
  const options = {
    method,
    uri,
    resolveWithFullResponse: true,
    simple: false,
    formData: {},
  };

  // Comment to be removed
  /* RP requires the following:
  var options = {
    method: 'POST',
    uri: 'http://posttestserver.com/post.php',
    formData: {
        // Like <input type="text" name="name">
        name: 'Jenn',
        // Like <input type="file" name="file">
        file: {
            value: fs.createReadStream('test/test.jpg'),
            options: {
                filename: 'test.jpg',
                contentType: 'image/jpg'
            }
        }
    },
  }; */

  payloadPaths.forEach((payloadPath) => {
    const fileStream = fs.createReadStream(payloadPath[1]);
    const filename = parseFileName(payloadPath[1]);
    options.formData[payloadPath[0]] = {
      value: fileStream,
      options: {
        filename,
        contentType: mime.lookup(filename),
      },
    };
  });

  keyValuePairs.forEach((keyValuePair) => {
    options.formData[keyValuePair[0]] = keyValuePair[1];
  });

  console.log('networkRequest called');
  const requestSentDate = Date.now();
  try {
    await rp(options);
    const responseReceivedDate = Date.now();
    const responseTime = responseReceivedDate - requestSentDate;
    return {
      failed: false,
      responseTime,
    };
  } catch (err) {
    console.log('Request rejected or timed out');
    return {
      failed: true,
      err,
    };
  }
}

async function performRequests(apiUri, payloadPaths, keyValuePairs, requestMethod, requestCount, testDurationSeconds) {
  let completedCount = 0;
  const timeOffset = (testDurationSeconds / requestCount) * 1000;

  return new Promise((resolve) => {
    const allResults = {
      successful: {},
      failed: {},
    };

    // requests return a 'failed' boolean and either a response time or an error description, both referred to as 'value'
    function completed(id, response) {
      if (response.failed) allResults.failed[id] = response.value;
      else allResults.successful[id] = response.responseTime;
      completedCount += 1;
      if (requestCount === completedCount) resolve(allResults);
    }
    // TODO:
    // in edge cases, when the number of requests are low relative to the duration, the last request won't wait for it's timeout to finish. this reqults in lower durations.
    // e.g. 2 requests in 20 seconds result in a 10 second request duration. req1 fires immediately, req2 @ 10secs
    async function execute() {
      for (let id = 1; id <= requestCount; id += 1) {
        networkRequest(requestMethod, apiUri, payloadPaths, keyValuePairs)
          .then(response => completed(id, response));
        await wait(timeOffset);
      }
    }
    execute();
  });
}

async function performTest(apiUri, payloadPaths, keyValuePairs, requestMethod, requestCount, testDurationSeconds) {
  const response = await performRequests(
    apiUri,
    payloadPaths,
    keyValuePairs,
    requestMethod,
    requestCount,
    testDurationSeconds,
  );
  const responseTimes = Object.values(response.successful);
  const failed = Object.keys(response.failed);
  const responseData = {
    requestCount,
    testDurationSeconds,
    apiUri,
    responseTimes,
    averageResponseTime: (responseTimes.reduce((a, b) => a + b) / responseTimes.length).toFixed(0),
    slowestResponse: Math.max(...responseTimes),
    fastestResponse: Math.min(...responseTimes),
    failed,
  };
  return responseData;
}

module.exports = performTest;
