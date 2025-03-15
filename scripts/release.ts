import assert from 'node:assert'
import { execSync } from 'node:child_process'
import packageJson from '../package.json' with { type: 'json' }

const tag = packageJson.version.replace(/[.\-0-9]/g, '')
assert(tag === 'beta' || tag === '')

execSync('git pull')
try {
   execSync('npm run knip')
} catch (_) {
   throw new Error('"npm run knip" failed')
}
execSync('npm run lint')
execSync('npm run test')
execSync('npm run build')
tag
   ? execSync(`npm publish --quiet --access public --tag ${tag}`)
   : execSync('npm publish --quiet --access public')
