const pug = require('pug');
const fs = require('fs');
const { log } = require('./logger');

const pugCompile = pug.compileFile('./templates/default.pug');

function exportResults(responseData) {
  fs.writeFile('results.html', (pugCompile(responseData)), (err) => {
    if (err) throw err;
    log('Results saved to HTML');
  });
}

module.exports = { exportResults };
