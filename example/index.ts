import { JSONSchema4 } from 'json-schema';
import { Try } from '../src/utils';
import { compileFromFile } from '../src/index'

async function generate() {
  
  var fs = require('fs');
  var dir = './output';

  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
  var dir = './output/src';

  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
  var dir = './output/src/behaviours';

  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
  var args = process.argv.slice(2);
  if (!args[0]) {
    console.log("Missing input parameters");
}
  fs.writeFileSync('output/src/Kind.ts', await compileFromFile('output.json', args[0], args[1]))
  const filename = 'output.json'
  const contents = Try(
    () => fs.readFileSync(filename),
    () => {
      throw new ReferenceError(`Unable to read file "${filename}"`)
    }
  )
  const schema = Try<JSONSchema4>(
    () => JSON.parse(contents.toString()),
    () => {
      throw new TypeError(`Error parsing JSON in file "${filename}"`)
    }
  )
  for (const d in schema) {
    let kindUpper = schema[d].schema.name
    let kind = schema[d].schema.name
    kind = kind.toLowerCase()
    fs.writeFileSync(`output/src/behaviours/${kindUpper}Print.ts`, `
    export default async function () {
      console.log('Print');
    }
    `)
  }
  fs.writeFileSync(`output/src/index.ts`, `export * from './Kind';`)
  //writeFileSync('behaviours/schema.d.ts', await compileFromFile('person.json'))
}

generate()

