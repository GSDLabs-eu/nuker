function wait(timeout) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

function parseFileName(path) {
  const fileName = path.replace(/^.*[\\/]/, '');
  return fileName;
}

module.exports = {
  wait,
  parseFileName,
};
