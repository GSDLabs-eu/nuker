const pug = require('pug');
const fs = require('fs');
const { log } = require('./logger');

const pugCompile = pug.compileFile('./templates/default.pug');

async function exportResults(responseData, outputPath) {
  const templateOptions = Object.assign({}, responseData, {
    chartJsPath: `${process.cwd()}/node_modules/chart.js/dist/Chart.bundle.js`,
  });

  const outputFile = pugCompile(templateOptions);
  fs.writeFile(outputPath, outputFile, (err) => {
    if (err) throw err;
    log('Results saved to file');
  });
}

module.exports = { exportResults };
