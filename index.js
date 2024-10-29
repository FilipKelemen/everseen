import fs from "node:fs";
import * as readline from "node:readline";

export default async function* parseIterator(fileToReadPath, levels, containedMessageText) {
  const fileStream = fs.createReadStream(fileToReadPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  const writeFileStream = fs.createWriteStream("out.log", {
    flags: "a"
  });
  for await (const row of rl) {
    const rowToJSON = parseDataFromRow(row)
    if(rowMatchesRules(rowToJSON,levels,containedMessageText)) {
      yield JSON.stringify(rowToJSON);
    }
  }
  rl.close();
  fileStream.removeAllListeners();
  writeFileStream.close();
}

function parseDataFromRow(row) {
  const [dateMatch,timeMatch,tzMatch,levelMatch, messageMatch] = [
    row.match(/\d{4}-\d{2}-\d{2}/),
    row.match(/\d{2}:\d{2}:\d{2}.\d{3}/),
    row.match(/\+\d{2}:\d{2}/),
    row.match(/DEBUG|INFO|ERROR/),
    row.match(/(?:DEBUG|INFO|ERROR)\s+(.*)/),
  ]
    const [date,time,tz,level, message] = [
      dateMatch ? dateMatch[0] : null,
      timeMatch ? timeMatch[0] : null,
      tzMatch ? tzMatch[0] : null,
      levelMatch ? levelMatch[0] : null,
      messageMatch ? messageMatch[1] : null,
    ];
    return {
      date,
      time,
      tz,
      level,
      message
    }
}

// for await (const s of parseIterator('in.log', ['error', 'info'],
//   ['special'])) {
//   console.log(s)
// }

function rowMatchesRules(row, levels, containedMessageText) {
  let matchesLevels = true
  let matchesMessage = true
  if(levels && levels.length > 0) {
    matchesLevels = rowMatchesLevels(row, levels)
  }
  if(containedMessageText && containedMessageText.length > 0) {
    matchesMessage = rowMatchesMessage(row, containedMessageText)
  }
  return matchesLevels && matchesMessage
}

function rowMatchesLevels(row, levels) {
  const regex = new RegExp(`^(${levels.join("|")})$`,"i")
  return regex.test(row.level)
}

function rowMatchesMessage(row, containedMessageText) {
  const regex = new RegExp(`${containedMessageText.join("|")}`,"i")
  return regex.test(row.message)
}

