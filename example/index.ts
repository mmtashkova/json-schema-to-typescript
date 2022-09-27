import { writeFileSync } from 'fs'
import { compileFromFile } from '/Users/mariatashkova/work/vcd-ext/json-schema-to-typescript/json-schema-to-typescript'

async function generate() {
  writeFileSync('kind.d.ts', await compileFromFile('kind.json'))
}

generate()
