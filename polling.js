import * as http from "node:http";
import {SERVER_CONFIG} from "./config.js";

let numberOfTimesPollingTried = 0;
let lastResStatus
let intervalId
initPolling();

function initPolling() {
  intervalId = setInterval(handlePolling, SERVER_CONFIG.pollingIntervalInMs);
}

function handlePolling() {
  numberOfTimesPollingTried++;
  if(numberOfTimesPollingTried < SERVER_CONFIG.maxNumberOfPollingTries && lastResStatus !== 200) {
    callLogParser()
  } else {
    clearInterval(intervalId)
  }
}

function callLogParser() {
  const options = {
    port: 5000,
    path: '/logparser',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  const req = http.request(options,(res) => {
    let response = '';
    res.on('data', (chunk) => {
      response += chunk;
    });
    res.on('end', () => {
      lastResStatus = res.statusCode
    });
  })
  const data = JSON.stringify({
    "f": [
      "in.log",
      "someotherfile.log"
    ],
    "l": [
      "error",
      "info"
    ],
    "s": "special"
  });
  req.write(data);
  req.end();
}