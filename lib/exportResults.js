const pug = require('pug');
const fs = require('fs');
const { log } = require('./logger');
const { Chart } = require('chart.js');

const pugCompile = pug.compileFile('./templates/default.pug');

// Return the code (string) that generates the charts on window.onload. Gets passed into an HTML script tag.
function chartConstructor(responseData) {
  const setData = `const data = ${JSON.stringify(responseData)};`;
  const generateCharts = function onLoad(data) {
    data.forEach((testResult, index) => {
      // eslint-disable-next-line no-unused-vars
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
  const callGenerateCharts = 'window.onload = () => onLoad(data)';

  return `
${setData}
${generateCharts}
${callGenerateCharts}`;
}

async function exportResults(responseData, outputPath) {
  const chartCode = chartConstructor(responseData);
  const chartJsPath = `${process.cwd()}/node_modules/chart.js/dist/Chart.bundle.js`;
  const outputFile = pugCompile({ data: responseData, chartJsPath, chartCode });
  fs.writeFile(outputPath, outputFile, (err) => {
    if (err) throw err;
    log('Results saved to file');
  });
}

module.exports = { exportResults };
