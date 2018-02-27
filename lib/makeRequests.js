const rp = require('request-promise');
const fs = require('fs');
const mime = require('mime-types');
const { wait, getFileNameFromPath } = require('./utils');
const { log, debug } = require('./logger');

async function networkRequest(
  apiUrl,
  queries,
  formFields,
  formFiles,
  bodyText,
  bodyPath,
  headers,
  requestMethod,
  requestCount,
  seq,
) {
  const options = {
    method: requestMethod,
    uri: apiUrl,
    resolveWithFullResponse: true,
    simple: false,
  };

  if (queries.length !== 0) {
    options.qs = {};
    queries.forEach((keyValuePair) => {
      options.qs[keyValuePair.key] = keyValuePair.value;
    });
  }

  if (headers.length !== 0) {
    options.headers = {};
    headers.forEach((keyValuePair) => {
      options.headers[keyValuePair.key] = keyValuePair.value;
    });
  }

  if (formFiles.length !== 0 || formFields.length !== 0) {
    const formKey = formFiles.length ? 'formData' : 'form';

    options[formKey] = {};
    formFiles.forEach((payloadPath) => {
      const filename = getFileNameFromPath(payloadPath.value);
      options[formKey][payloadPath.key] = {
        value: fs.createReadStream(payloadPath.value),
        options: {
          filename,
          contentType: mime.lookup(filename),
        },
      };
    });
    formFields.forEach((keyValuePair) => {
      options[formKey][keyValuePair.key] = keyValuePair.value;
    });
  }

  if (bodyPath !== '') {
    options.encoding = null;
    options.body = fs.createReadStream(bodyPath, { encoding: 'binary' });
  }

  if (bodyText !== '') {
    options.body = bodyText;
  }

  debug(`Sending request ${seq}/${requestCount} to endpoint ${apiUrl}`);
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
    debug(`Request ${seq} was rejected or timed out.`);
    return {
      failed: true,
      err,
    };
  }
}

async function makeRequests({
  apiUrl,
  queries,
  formFields,
  formFiles,
  bodyText,
  bodyPath,
  headers,
  requestMethod,
  requestCount,
  testDurationSeconds,
}) {
  log(`Performing network requests. This will take ${testDurationSeconds} seconds.`);
  log(`Endpoint is ${apiUrl}`);
  let completedCount = 0;
  // First request fired right away, so it's ignored when calculating time
  const timeOffset = (testDurationSeconds / (requestCount - 1)) * 1000;

  return new Promise((resolve) => {
    const allResults = {
      successful: {},
      failed: {},
    };

    // Requests return a 'failed' boolean and either a response time or an error description, both referred to as 'value'
    function completed(seq, response) {
      if (response.failed) allResults.failed[seq] = response;
      else allResults.successful[seq] = response.responseTime;
      completedCount += 1;
      if (requestCount === completedCount) resolve(allResults);
    }
    // Sends a network request right away, then the rest along the remaining time
    async function execute() {
      for (let seq = 1; seq <= requestCount; seq += 1) {
        if (seq > 1) await wait(timeOffset);
        networkRequest(
          apiUrl,
          queries,
          formFields,
          formFiles,
          bodyText,
          bodyPath,
          headers,
          requestMethod,
          requestCount,
          seq,
        )
          .then(response => completed(seq, response));
      }
    }
    execute();
  });
}

module.exports = { makeRequests };
