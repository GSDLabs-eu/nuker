const rp = require('request-promise');
const fs = require('fs');
const mime = require('mime-types');
const { wait, getFileNameFromPath } = require('./utils');
const { log, logVerbose, logError } = require('./logger');

async function networkRequest(config, seq) {
  const options = {
    method: config.requestMethod,
    uri: config.apiUrl,
    resolveWithFullResponse: true,
    simple: false,
  };

  if (config.query) {
    options.qs = config.query;
  }

  if (config.headers) {
    options.headers = config.headers;
  }

  if (config.formFiles || config.formFields) {
    let formKey = 'form';

    if (config.formFiles) {
      formKey = 'formData';

      const attachedFormFiles = Object.keys(config.formFiles).reduce((finalObject, next) => {
        const path = config.formFiles[next];
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

      options[formKey] = { ...attachedFormFiles };
    }

    options[formKey] = Object.assign({}, options[formKey], config.formFields);
  }

  if (config.bodyString) {
    options.body = config.bodyString;
  } else if (config.bodyPath) {
    options.body = fs.createReadStream(config.bodyPath, { encoding: 'binary' });
  }

  logVerbose(`Sending request ${seq}/${config.requestCount} to endpoint ${config.apiUrl}`);
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
    logError(`Request ${seq} was rejected or timed out.`);
    return {
      failed: true,
      err,
    };
  }
}

async function makeRequests(config) {
  log(`Performing network requests. This will take ${config.testDurationSeconds} seconds.`);
  log(`Endpoint is ${config.apiUrl}`);
  let completedCount = 0;
  // First request fired right away, so it's ignored when calculating time
  const timeOffset = (config.testDurationSeconds / (config.requestCount - 1)) * 1000;

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
      if (config.requestCount === completedCount) resolve(allResults);
    }

    async function execute() {
      for (let seq = 1; seq <= config.requestCount; seq += 1) {
        if (seq > 1) await wait(timeOffset);
        networkRequest(config, seq)
          .then(response => completed(seq, response));
      }
    }
    execute();
  });
}

module.exports = { makeRequests };
