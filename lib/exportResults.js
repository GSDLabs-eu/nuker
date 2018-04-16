const pug = require('pug');
const fs = require('fs');
const { log } = require('./logger');
const { Chart } = require('chart.js');

const pugCompile = pug.compileFile('./templates/default.pug');

// Return the code (string) that generates the charts on window.onload. Gets passed into an HTML script tag.
/* eslint-disable no-unused-vars */
/* eslint-env browser */
function generateChartScript(responseData) {
  const codeFragment1 = `const data = ${JSON.stringify(responseData)};`;
  const codeFragment2 = function onLoad(data) {
    data.forEach((testResult, index) => {
      const chart = new Chart(document.getElementById(`chartPic${index}`).getContext('2d'), {
        type: 'line',
        data: {
          labels: Array.from(new Array(testResult.responseTimes.length), (val, i) => i + 1),
          datasets: [{
            data: testResult.responseTimes,
            borderWidth: 1,
          }],
        },
        options: {
          maintainAspectRatio: false,
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: 'Response times',
            fontSize: 16,
          },
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero: true,
                suggestedMax: testResult.averageResponseTime * 2,
              },
            }],
          },
        },
      });
    });
  }.toString();
  const codeFragment3 = 'window.onload = () => onLoad(data);';

  return `${codeFragment1}${codeFragment2}${codeFragment3}`;
}
/* eslint-enable no-unused-vars */

async function exportResults(responseData, outputPath) {
  const chartScript = generateChartScript(responseData);
  const chartJsPath = `${process.cwd()}/node_modules/chart.js/dist/Chart.bundle.js`;
  const outputFile = pugCompile({ data: responseData, chartJsPath, chartScript });
  fs.writeFile(outputPath, outputFile, (err) => {
    if (err) throw err;
    log('Results saved to file');
  });
}

module.exports = { exportResults };
