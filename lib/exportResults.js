const pug = require('pug');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const { log } = require('./logger');

const pugCompile = pug.compileFile('./templates/default.pug');

async function exportResults(responseData, outputPath, outputName) {
  const templateOptions = Object.assign({}, responseData, {
    chartJsPath: `${process.cwd()}/node_modules/chart.js/dist/Chart.bundle.js`,
  });

  if (!fs.existsSync(outputPath)) {
    // Creates the whole path, even missing parent folders
    mkdirp(outputPath);
  }

  const filePath = path.join(outputPath, outputName);
  const outputFile = pugCompile(templateOptions);
  fs.writeFile(filePath, outputFile, (err) => {
    if (err) throw err;
    log('Results saved to HTML');
  });
}

module.exports = { exportResults };
