const fs = require('fs');

const mime = require('mime-types');
const rp = require('request-promise');

const events = require('./events');
const { wait, getFileNameFromPath } = require('./utils');

async function networkRequest(config, seq) {
  const options = {
    method: config.requestMethod,
    uri: config.apiUrl,
    timeout: config.timeout,
    resolveWithFullResponse: true,
    time: true,
    // This makes http response codes other than 2xx reject the promise
    simple: true,
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

      const attachedFormFiles = Object.keys(config.formFiles).reduce((memo, next) => {
        const path = config.formFiles[next];
        const filename = getFileNameFromPath(path);
        return {
          ...memo,
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

  if (config.body) {
    options.body = config.body;
  }

  if (config.bodyPath) {
    options.body = fs.createReadStream(config.bodyPath, { encoding: 'binary' });
  }

  try {
    const response = await rp(options);
    return {
      success: true,
      responseTime: Math.round(response.timingPhases.total),
    };
  } catch (err) {
    events.emit('requestFailed', seq, config, err);
    return {
      success: false,
      // There is no response if the error is in the network layer
      responseTime: err.response && Math.round(err.response.timingPhases.total),
      err,
    };
  }
}

module.exports = async function makeRequests(config) {
  let completedCount = 0;
  // First request fired right away, so it's ignored when calculating time
  const timeOffset = (config.testDurationSeconds / (config.requestCount - 1)) * 1000;

  return new Promise((resolve) => {
    const allResults = [];

    // Requests return a 'success' boolean and either a response time or an error status code
    function completed(seq, response) {
      events.emit('progress', response);
      allResults[seq - 1] = response;
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
};
