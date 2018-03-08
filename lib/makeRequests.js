const rp = require('request-promise');
const fs = require('fs');
const mime = require('mime-types');
const { wait, getFileNameFromPath } = require('./utils');
const { log, debug } = require('./logger');

async function networkRequest(
  apiUrl,
  query,
  formFields,
  formFiles,
  bodyString,
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

  if (Object.keys(query).length !== 0) {
    options.qs = query;
  }

  if (Object.keys(headers).length !== 0) {
    options.headers = headers;
  }

  if (Object.keys(formFiles).length !== 0 || Object.keys(formFields).length !== 0) {
    const formKey = Object.keys(formFiles).length ? 'formData' : 'form';
    options[formKey] = {};

    const attachedFormFiles = Object.keys(formFiles).reduce((finalObject, next) => {
      const path = formFiles[next];
      const filename = getFileNameFromPath(path);
      return {
        ...finalObject,
        [next]: {
          value: fs.createReadStream(path),
          options: {
            filename,
            contentType: mime.lookup(filename),
          },
        },
      };
    }, {});

    Object.assign(options[formKey], attachedFormFiles);
    Object.assign(options[formKey], formFields);
  }

  if (bodyString && bodyPath) {
    log('Request body defined both as a string and a file');
    process.exit(1);
  } else if (bodyString) {
    options.body = bodyString;
  } else if (bodyPath) {
    options.body = fs.createReadStream(bodyPath, { encoding: 'binary' });
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
  query,
  formFields,
  formFiles,
  bodyString,
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
          query,
          formFields,
          formFiles,
          bodyString,
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
