import assert from 'node:assert'
import { $ } from 'bun'
import { consola } from 'consola'
import { z } from 'zod'

const releaseSchema = z.object({ tagName: z.string() })
const commitSchema = z.object({ commit: z.object({ message: z.string() }) })
const diffSchema = z.object({ commits: z.array(commitSchema) })

await $`git pull`
await $`npm run knip`
await $`npm run test` // includes lint
await $`bumpp`
await $`npm run build`

const packageJson = await import('../package.json', {
   with: { type: 'json' },
})
const version = packageJson.version
const newNpmTag = version.replace(/[.\-0-9]/g, '') || 'latest'
assert(newNpmTag === 'beta' || newNpmTag === 'latest', 'Unexpected release tag')
const newGithubTag = `v${version}`
await $`npm publish --quiet --access public --tag ${newNpmTag}`
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
