import assert from 'node:assert'
import { $ } from 'bun'
import { consola } from 'consola'
import { z } from 'zod'
import { up } from '../src/up'

async function script() {
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
   assert(
      newNpmTag === 'beta' || newNpmTag === 'latest',
      'Unexpected release tag',
   )
   const newGithubTag = `v${version}`
   await $`npm publish --quiet --access public --tag ${newNpmTag}`
   consola.success(`Published version ${version}`)
   consola.info('Fetching the previous github release tag')
   const previousGithubTag = await fetchPrevGithubTag({
      newNpmTag,
      newGithubTag,
   })
   consola.info('fetching relevant commit messages since the previous release')
   const description = await generateReleaseDescription(previousGithubTag)
   // push the new tag
   await $`git tag ${newGithubTag}`
   await $`git push --tags`
   consola.info(`Creating a github release: ${newGithubTag}\n${description}`)
   await createGithubRelease({
      newGithubTag,
      latest: newNpmTag === 'latest',
      description,
   })
   await $`git add .`
   await $`git commit -am "release: ${version}"`
   await $`git push`
}

await script()

const upfetch = up(fetch, () => ({
   baseUrl: 'https://api.github.com/L-Blondy/up-fetch',
   headers: {
      'X-GitHub-Api-Version': '2022-11-28',
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
   },
}))

async function fetchPrevGithubTag(props: {
   newNpmTag: 'beta' | 'latest'
   newGithubTag: string
}) {
   const releases = await upfetch('/releases', {
      schema: z.array(z.object({ tag_name: z.string() })),
   })
   const previousRelease =
      props.newNpmTag === 'beta'
         ? // when the new release is beta, just grab the previous one
           releases.find((release) => release.tag_name !== props.newGithubTag)
         : // when the new release is stable, ignore previous beta releases
           releases.find(
              (release) =>
                 release.tag_name !== props.newGithubTag &&
                 !release.tag_name.includes('beta'),
           )
   assert(previousRelease, 'No previous release found')
   return previousRelease.tag_name
}

async function generateReleaseDescription(previousGithubTag: string) {
   // All commit messages since the last release
   const commitMessages = await upfetch(
      `/compare/${previousGithubTag}...HEAD`,
      {
         schema: z
            .object({
               commits: z.array(
                  z.object({ commit: z.object({ message: z.string() }) }),
               ),
            })
            .transform(({ commits }) => {
               return commits
                  .map(({ commit }) => commit.message)
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
            }),
      },
   )

   const releaseNotes =
      commitMessages.map((message) => `- ${message}`).join('\n') ||
      'No notable changes'

   return releaseNotes
}

async function createGithubRelease(props: {
   newGithubTag: string
   latest: boolean
   description: string
}) {
   await upfetch('/releases', {
      method: 'POST',
      body: {
         tag_name: props.newGithubTag,
         name: props.newGithubTag,
         body: props.description,
         discussion_category_name: props.latest ? 'announcements' : undefined,
         make_latest: String(props.latest),
      },
      async parseRejected(response) {
         return new Error(JSON.stringify(await response.json(), null, 3))
      },
   })
}
