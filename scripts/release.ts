import assert from 'node:assert'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { $, spawn } from 'bun'
import { consola } from 'consola'
import { z } from 'zod'

const releaseSchema = z.object({ tagName: z.string() })
const commitSchema = z.object({ commit: z.object({ message: z.string() }) })
const diffSchema = z.object({ commits: z.array(commitSchema) })

await $`git pull`
await $`npm run knip`
await $`npm run test` // includes lint
await $`bumpp`

const packageJson = await import('../package.json', {
   with: { type: 'json' },
})
const version = packageJson.version
const skillPath = fileURLToPath(new URL('../skills/upfetch/SKILL.md', import.meta.url))
const skillContent = await readFile(skillPath, 'utf8')
const nextSkillContent = skillContent.replace(
   /^library_version:\s*['"][^'"]+['"]\s*$/m,
   `library_version: '${version}'`,
)
assert(
   nextSkillContent !== skillContent,
   `Could not update library_version in ${skillPath}`,
)
await writeFile(skillPath, nextSkillContent)

await $`npm run build`

const newNpmTag = version.replace(/[.\-0-9]/g, '') || 'latest'
assert(newNpmTag === 'beta' || newNpmTag === 'latest', 'Unexpected release tag')
const newGithubTag = `v${version}`
const proc = spawn(
   ['npm', 'publish', '--access', 'public', '--tag', newNpmTag],
   {
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
   },
)
const exitCode = await proc.exited
assert(
   exitCode === 0,
   `npm publish fai
   led with exit code ${exitCode}`,
)
consola.success(`Published version ${version}`)

const releases = await $`gh release list --limit 20 --json tagName`.json()
const previousGithubTag = z
   .array(releaseSchema)
   .parse(releases)
   .filter((release) => release.tagName !== newGithubTag)
   .find((release) => {
      return newNpmTag === 'beta'
         ? true // when the new release is beta, just grab the previous one
         : !release.tagName.includes(newNpmTag) // when the new release is stable, ignore previous beta releases
   })!.tagName
consola.info('Previous release tag:', previousGithubTag)

const diff =
   await $`gh api repos/L-Blondy/up-fetch/compare/${previousGithubTag}...HEAD`.json()
const notes = diffSchema
   .parse(diff)
   .commits.map(({ commit }) => commit.message)
   .filter(
      (message) =>
         message &&
         message !== 'docs' &&
         !message.startsWith('chore:') &&
         !message.startsWith('release:') &&
         !message.startsWith('ignore:') &&
         !message.startsWith('chore:') &&
         !message.startsWith('ci:') &&
         !message.startsWith('wip:') &&
         !message.startsWith('docs:') &&
         !message.startsWith('doc:'),
   )
   .map((message) => `- ${message}`)
   .join('\n')

// push the new tag
await $`git tag ${newGithubTag}`
await $`git push --tags`
await $`gh release create ${newGithubTag} --title "${newGithubTag}" --notes "${notes}" --latest=${newNpmTag === 'latest'}`

consola.info(`Github release created: ${newGithubTag}\n${notes}\n`)

await $`git add .`
await $`git commit -am "release: ${version}"`
await $`git push`
