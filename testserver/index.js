const http = require('http');
const url = require('url');

const DEFAULT_TIMEOUT = 0;
const DEFAULT_STATUS_CODE = 200;

const requestHandler = async (req, res) => {
  const { query } = url.parse(req.url, true);
  const timeout = query.wait || DEFAULT_TIMEOUT;
  let statusCode = parseInt(query.statusCode, 10) || DEFAULT_STATUS_CODE;

  if (query.error > Math.round(Math.random() * 100)) statusCode = 500;

  res.statusCode = statusCode;

  setTimeout(() => res.end(), timeout);
};

const host = 'localhost';
const port = 4343;
const server = http.createServer(requestHandler);

server.listen({ host, port }, () => {
  const address = server.address();
  console.log(`Server is listening on ${address.address}:${address.port}`);
});
