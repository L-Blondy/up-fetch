import assert from 'node:assert'
// @ts-expect-error bun types are not installed
import { $ } from 'bun'
import { consola } from 'consola'
import { z } from 'zod'

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
   const versionTag = version.replace(/[.\-0-9]/g, '') || 'latest'
   assert(
      versionTag === 'beta' || versionTag === 'latest',
      'Unexpected release tag',
   )
   const newGithubTag = `v${version}`
   await $`npm publish --quiet --access public --tag ${versionTag}`
   consola.success(`Published version ${version}`)
   consola.info('Fetching the previous github release tag')
   const previousGithubTag = await fetchPrevGithubTag(versionTag)
   consola.info('fetching relevant commit messages since the previous release')
   const description = await generateReleaseDescription(previousGithubTag)
   // push the new tag
   await $`git tag ${newGithubTag}`
   await $`git push --tags`
   consola.info(`Creating a github release: ${newGithubTag}\n${description}`)
   await createGithubRelease({
      githubTag: newGithubTag,
      latest: versionTag === 'latest',
      description,
   })
   await $`git add .`
   await $`git commit -am "release: ${version}"`
   await $`git push`
}

await script()

function fetchPrevGithubTag(versionTag: 'beta' | 'latest') {
   return fetch('https://api.github.com/repos/L-Blondy/up-fetch/releases', {
      headers: { Accept: 'application/vnd.github+json' },
   })
      .then((res) => {
         if (!res.ok) throw new Error(res.statusText)
         return res.json()
      })
      .then((releases) => {
         const previousRelease =
            // when the new release is beta, the previous release is the first one
            // otherwise, when the new release is stable, the previous release is the last latest
            versionTag === 'beta'
               ? releases[0]
               : releases.find((release) => !release.tag_name.includes('beta'))
         return previousRelease.tag_name
      })
}

async function generateReleaseDescription(previousGithubTag: string) {
   const response = await fetch(
      `https://api.github.com/repos/L-Blondy/up-fetch/compare/${previousGithubTag}...HEAD`,
      { headers: { Accept: 'application/vnd.github+json' } },
   )
   assert(response.ok, response.statusText)
   const data = await response.json()
   const commits = data.commits || []
   const messages = commits.map(({ commit }) => commit.message)
   return (
      z
         .array(z.string())
         .parse(messages)
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
         .join('\n') || 'No notable changes'
   )
}

async function createGithubRelease(props: {
   githubTag: string
   latest: boolean
   description: string
}) {
   const response = await fetch(
      'https://api.github.com/repos/L-Blondy/up-fetch/releases',
      {
         method: 'POST',
         headers: {
            'X-GitHub-Api-Version': '2022-11-28',
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
         },
         body: JSON.stringify({
            tag_name: props.githubTag,
            name: props.githubTag,
            body: props.description,
            discussion_category_name: props.latest
               ? 'announcements'
               : undefined,
            make_latest: String(props.latest),
         }),
      },
   )
   assert(
      response.ok,
      `${response.statusText}: ${JSON.stringify(await response.text(), null, 3)}`,
   )
}
