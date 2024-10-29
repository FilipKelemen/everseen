import * as fs from "node:fs";

async function fetchData() {
  let error = null;
  let data = null;
  const populateErrorAndData = () => {
    if (Math.random() < 0.2)
      error = new Error('fetch error')
    else
      data = {fake: 'data'}
  }
  const delay = new Promise(resolve => setTimeout(resolve, 1000))
  await delay
  populateErrorAndData()
  console.log([error, data])
  return [error, data]
}
async function processData(data) {
  let error = null;
  let returnData = null
  const populateErrorAndData = () => {
    if (Math.random() < 0.2)
      error = Error('process error')
    else
      returnData = { fake: 'processed' + data.fake }
  }
  const delay = new Promise(resolve => setTimeout(resolve, 1000))
  await delay
  populateErrorAndData()
  console.log([error, returnData])
  return [error, returnData]
}

function handleResponse(err, data) {
  if (err) {
    console.error('Error processing data', err)
  } else {
    fs.writeFile('out.json', JSON.stringify(data), err => {
      if (err) console.error('Error writing data', err)
      else console.log('Done')
    })
  }
}

async function process() {
  const [fetchDataError, fetchDataData] = await fetchData()
  if (fetchDataError) handleResponse(fetchDataError)
  else {
    const [processDataError, processDataData] = await processData(fetchDataData)
    handleResponse(processDataError, processDataData)
  }
}

process()

