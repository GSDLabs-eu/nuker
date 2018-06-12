const fs = require('fs');
const path = require('path');

const { Chart } = require('chart.js');
const pug = require('pug');

// Return the code (string) that generates the charts on window.onload. Gets passed into an HTML script tag.
function generateChartScript(output) {
  const codeFragment1 = `const data = ${JSON.stringify(output)};`;
  const codeFragment2 = function onLoad(data) {
    data.forEach((testResult, index) => {
      const chart = new Chart(document.getElementById(`chartPic${index}`).getContext('2d'), {
        type: 'line',
        data: {
          labels: Array.from({ length: testResult.requestCount }, (v, k) => k + 1),
          datasets: [{
            label: 'Response Times',
            yAxisID: 'A',
            data: testResult.timeline.successfulResponseTimes,
            showLine: false,
            pointRadius: 2,
            backgroundColor: 'rgb(70,153,207,1)',
            borderColor: 'rgb(70,153,207,1)',
            fill: false,
          }, {
            label: 'Failed requests',
            yAxisID: 'B',
            pointRadius: 0,
            steppedLine: true,
            data: testResult.timeline.errorCounts,
            backgroundColor: 'rgba(255,99,132,0.2)',
            borderColor: 'rgba(255,99,132,1)',
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
            text: 'Timeline',
            fontSize: 16,
          },
          scales: {
            yAxes: [{
              id: 'A',
              type: 'linear',
              position: 'left',
              scaleLabel: {
                display: true,
                labelString: 'Response times in ms (2xx)',
              },
              ticks: {
                beginAtZero: true,
                suggestedMax: testResult.slowestResponseTime * 1.1,
              },
            }, {
              id: 'B',
              type: 'linear',
              position: 'right',
              scaleLabel: {
                display: true,
                labelString: 'No. of failed requests',
              },
              ticks: {
                beginAtZero: true,
                suggestedMax: testResult.requestCount,
              },
              gridLines: {
                display: false,
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

module.exports = async function exportResults(output, outputPath) {
  const chartScript = generateChartScript(output);

  const chartJsPath = path.join(__dirname, '../node_modules/chart.js/dist/Chart.bundle.js');
  const templatePath = path.join(__dirname, '../templates/default.pug');
  const compile = pug.compileFile(templatePath);
  const outputFile = compile({ data: output, chartJsPath, chartScript });

  fs.writeFile(outputPath, outputFile, (err) => {
    if (err) throw err;
  });
};
