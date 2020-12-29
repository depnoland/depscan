import { scanDeps } from '../mod.ts'

const dependancies = await scanDeps('https://deno.land/x/harmony/examples/ping.ts', {
  recursive: true,
  debug: true
})

console.log(dependancies)
console.log(dependancies.length + ' dependancies found in this file')
