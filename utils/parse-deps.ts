import { ACCEPT, USER_AGENT  } from '../consts/headers.ts'
//import { EXTRACT_IMPORT_URL, SENTENCE_SPLICE } from '../consts/regexps.ts'
import { Dependency } from '../types/dependency.ts'
import { parse } from "https://deno.land/x/swc@0.2.1/mod.ts"

function parseDeps (url: string, debug = false): Promise<Dependency[]> {
  // deno-lint-ignore no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    if (debug) console.log('scan started: ' + url)

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'accept': ACCEPT, 'user-agent': USER_AGENT }
    }).then((res) => res.text()).catch(reject)

    if (debug) console.log('ㄴsource downloaded')
    
    if (!response) return
    const deps: Dependency[] = []
    try {
      const ast = parse(response, {
        target: "es2019",
        syntax: "typescript",
        comments: false,
      })
      for (const body of ast.body) {
        if (body.type != 'ImportDeclaration'
          && body.type != 'ExportAllDeclaration'
          && body.type != 'ExportNamedDeclaration') continue
        if (body.source == null) continue
        const dep = body.source.value
        if (debug) console.log('ㄴdependency found: ' + dep)
        if (!dep.startsWith('http://') && !dep.startsWith('https://')) {
          deps.push({ isScaned: false, url: new URL(dep, url).toString() })
        } else deps.push({ isScaned: false, url: dep })
      }
    } catch (err) { reject(err) }
    /*const sentences = response.split(SENTENCE_SPLICE)
    for (const index in sentences) {
      const sentence = sentences[index].trim()

      if (!sentence.startsWith('import') && !sentence.startsWith('export')) continue
      for (let i = Number(index); i < sentences.length; i++) {
        const dep = sentences[i].split(EXTRACT_IMPORT_URL)[1]
        if (!dep) continue
        if (!dep.endsWith('.js') && !dep.endsWith('.ts')) continue
        if (debug) console.log('ㄴdependency found: ' + dep)
        if (!dep.startsWith('http://') && !dep.startsWith('https://')) {
          deps.push({ isScaned: false, url: new URL(dep, url).toString() })
        } else deps.push({ isScaned: false, url: dep })
        break
      }
    }*/

   resolve(deps)
  })
}

async function parseDepsDeep (deps: Dependency[], debug = false): Promise<Dependency[]> {
  for (const index in deps) {
    if (!deps[index].isScaned) {
      deps[index].isScaned = true
      const scaned = (await parseDeps(deps[index].url, debug))
        .filter((dep) => !deps.find((d) => d.url === dep.url))
      deps.push(...scaned)
    }
  }

  if (deps.filter((dep) => !dep.isScaned).length < 1) return deps
  return await parseDepsDeep(deps, debug)
}

/**
 * Scan dependancies from given url
 * @param url url for scaning
 * @param options scan options
 * @param options.recursive scan recursively when true
 * @param options.debug log scan progress
 */
// Scan dependancies from given url
export async function scanDeps (url: string, options = { recursive: true, debug: false }) {
  const scaned = options.recursive ? await parseDepsDeep([{ isScaned: false, url }], options.debug) : await parseDeps(url, options.debug)
  const deps: string[] = []
  scaned.forEach((dep) => deps.push(dep.url))
  return deps
}
