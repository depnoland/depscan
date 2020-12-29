import { scanDeps } from '../mod.ts'

const dependencies = await scanDeps('https://deno.land/x/harmony/examples/ping.ts', {
  recursive: true,
  debug: true
})

console.log(dependencies)
console.log(dependencies.length + ' dependencies found in this file')
