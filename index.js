const fs = require('fs');
const rp = require('request-promise');
const pug = require('pug');
const pugPile = pug.compileFile('template.pug');

//  CONFIG VARIABLES 
const apiUrl = 'http://localhost:9191/matchface'
const imageLocation = 'example.jpg';
const numberOfRequests = 10;
const testDuration = 10;
//

async function networkRequest(id) {
  const image = fs.createReadStream(imageLocation);
  const options = {
    method: 'POST',
    uri: apiUrl,
    resolveWithFullResponse: true,
    simple: false,
    formData: {
      file: {
        value: image,
        options: {
          filename: 'image.jpg',
          contentType: 'image/jpg'
        }
      }
    }
  };
  console.log(`networkRequest ${id} called`);
  const requestSentDate = Date.now();
  try {
    await rp(options);
    const responseReceivedDate = Date.now();
    const responseTime = responseReceivedDate - requestSentDate;
    return {
      failed: false,
      id,
      responseTime,
    }; 
  } catch(err) {
      console.log(`Request ${id} rejected or timed out`)
      return {
        failed: true,
        id,
        err,
      }
    }
}

async function makeRequests(requestNumber, duration) {

  let completedCount = 0;
  const timeout = duration / requestNumber * 1000;

  function wait (timeout) {
    return new Promise((resolve) => setTimeout(resolve, timeout));
  }

  return new Promise(resolve => {
    let allResults = {
      successful : {},
      failed : {},
    } 
    
    // requests return a 'failed' boolean, the id and either a response time or an error description both referred to as 'value'
    function completed(response) {
      if(response.failed) allResults.failed[response.id] = response.value;
      else allResults.successful[response.id] = response.responseTime;
      completedCount++;
      if (numberOfRequests === completedCount) {resolve(allResults)}
    }
    // in edge cases, when the number of requests are low relative to the duration, the last request won't wait for it's timeout to finish. this reqults in lower durations.
    // e.g. 2 requests in 20 seconds result in a 10 second request duration. req1 fires immediately, req2 @ 10secs
    async function execute() {
      for (var i = 1; i <= numberOfRequests; i++) {
      networkRequest(i)
      .then(completed)
      await wait(timeout);
      }
    }
    execute();
  })  
}

async function loadTest() {
  const  response = await makeRequests(numberOfRequests, testDuration);
  const responseTimes = Object.values(response.successful);
  const failed = Object.keys(response.failed);
  const responseData = {
    numberOfRequests,
    testDuration,
    apiUrl,
    responseTimes,
    averageResponseTime: (responseTimes.reduce((a, b) => a + b) / responseTimes.length).toFixed(0),
    slowestResponse: Math.max(...responseTimes),
    fastestResponse: Math.min(...responseTimes),
    failed,
  };

  fs.writeFile('results.html', (pugPile(responseData)), function (err) {
    if (err) throw err;
    console.log(`Successful: ${responseData.responseTimes.length}`);
    console.log(`Failed: ${responseData.failed.length}`);
    console.log('Results saved to HTML');
  });
}

loadTest();
