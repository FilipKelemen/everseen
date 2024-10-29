import parseIterator from "./index.js";

const argTypes = {
  "-f": "files",
  "-l": "levels",
  "-s": "messages"
}

function getParsedArguments(processArgs) {
  const populatedArgs = {
    files: [],
    levels: [],
    messages: []
  }

  for (let i = 0; i < processArgs.length; i += 2) {
    if(argTypes[processArgs[i]]) {
      populatedArgs[argTypes[processArgs[i]]].push(processArgs[i + 1])
    }
  }
  return populatedArgs;
}

export default function startProcess(files,levels,messages) {
  files.forEach(async (file) => {
    for await (const s of parseIterator(file, levels, messages)) {
      console.log(s)
    }
  })
}
if(process.argv[1] === import.meta.filename) {
  const args = process.argv.slice(2);
  const {files,levels, messages} = getParsedArguments(args)
  startProcess(files,levels, messages)
}

