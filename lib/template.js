const pug = require('pug');
const fs = require('fs');

const pugCompile = pug.compileFile('./templates/default.pug');

function exportToFile(responseData) {
  fs.writeFile('results.html', (pugCompile(responseData)), (err) => {
    if (err) throw err;
    console.log(`Successful: ${responseData.responseTimes.length}`);
    console.log(`Failed: ${responseData.failed.length}`);
    console.log('Results saved to HTML');
  });
}

module.exports = exportToFile;
