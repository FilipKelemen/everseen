import * as http from "node:http";
import startProcess from "./logParser.js";
import {SERVER_CONFIG} from "./config.js";
import * as cluster from "node:cluster";
import {getJWTForUser, verifyToken} from "./jwt.js";

const PORT = 5000
const throttle = getThrottlingFunction()
if (cluster.default.isPrimary) {
  console.log(`Process ${process.pid} is running`);
  for (let i = 0; i < SERVER_CONFIG.numWorkers; i++) {
    cluster.default.fork();
  }
  cluster.default.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} exited`);
  });
} else {
  const server = http.createServer( (req, res) => {
    console.log(`Process ${process.pid} is running`);
    try{
      if (req.method === 'POST' && req.url === '/logparser') {
        protect(req,res)
        throttle(() => {handleLogParser(req, res)}, res);
      } else if (req.url === '/health') {
        protect(req,res)
        handleHealth(res)
      } else if (req.url === '/auth') {
        handleAuth(req,res)
      }  else {
        res.writeHead(404, {'Content-type': 'application/json'});
        res.end(JSON.stringify({error: "Not found"}));
      }
    } catch (err) {
      res.writeHead(400, {'Content-type': 'application/json'});
      res.end(JSON.stringify({error: err.message}));
    }
  });

  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
  });
}


function getThrottlingFunction() {
  let numberOfRequestsMadeLastInterval = 0;
  setInterval(() => {
    numberOfRequestsMadeLastInterval = 0
  },10000)
  return (callback,res) => {
    if(numberOfRequestsMadeLastInterval >= SERVER_CONFIG.maxRateOfRequestsPerSeconds){
      res.writeHead(400, {'Content-type': 'application/json'});
      res.end(JSON.stringify({error: "Too many requests"}));
    } else {
      numberOfRequestsMadeLastInterval++;
      callback()
    }
  }
}

function handleHealth(res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(cluster));
}

function handleLogParser(req,res) {
  let body = ''
  req.on('data', (chunk) => {
    body += chunk;
  })
  req.on('end', () => {
    try {
      const data = JSON.parse(body)
      startProcess(data.f, data.l, new Array(data.s).flat(0))
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({
        message: 'Process finished',
      }));
    } catch (err) {
      res.writeHead(404, {'Content-type': 'application/json'});
      res.write(JSON.stringify({error: err.message}));
    }
  })
}

function handleAuth(req,res) {
  let body = ''
  req.on('data', (chunk) => {
    body += chunk;
  })
  req.on('end', () => {
    try {
      const data = JSON.parse(body)
      if(!data.username || !data.password){
        res.writeHead(400, {'Content-type': 'application/json'});
        res.end(JSON.stringify({error: "Incorrect payload"}));
      }
      const jwt = getJWTForUser(data)
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({
        jwt: jwt,
      }));
    } catch (err) {
      res.writeHead(404, {'Content-type': 'application/json'});
      res.end(JSON.stringify({error: err.message}));
    }
  })
}

function protect(req,res) {
  const authorizationHeader = req.headers['authorization'];
  if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
    const token = authorizationHeader.slice(7).trim();
    if(!verifyToken(token)) {
      res.writeHead(403, {'Content-type': 'application/json'});
      res.end(JSON.stringify({error: "Forbidden"}));
    }
  } else {
    res.writeHead(403, {'Content-type': 'application/json'});
    res.end(JSON.stringify({error: "Forbidden"}));
  }
}