import { z } from 'zod'

async function script() {
   const previousVersion = await fetch(
      'https://api.github.com/repos/L-Blondy/up-fetch/releases/latest',
   )
      .then((res) => {
         if (!res.ok) throw new Error(res.statusText)
         return res.json()
      })
      .then((data) => data.tag_name)

   const commitMessages = await fetch(
      `https://api.github.com/repos/L-Blondy/up-fetch/compare/${previousVersion}...HEAD`,
   )
      .then((res) => {
         if (!res.ok) throw new Error(res.statusText)
         return res.json()
      })
      .then((data) => data.commits || [])
      .then((commits) => commits.map(({ commit }) => commit.message))
      .then((messages) => z.array(z.string()).parse(messages))

   const relevantMessages = commitMessages.filter(
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

   const packageJson = await import('../package.json', {
      with: { type: 'json' },
   })

   await fetch('https://api.github.com/repos/L-Blondy/up-fetch/releases', {
      method: 'POST',
      headers: {
         'X-GitHub-Api-Version': '2022-11-28',
         Accept: 'application/vnd.github+json',
         Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
         tag_name: `v${packageJson.default.version}`,
         name: `v${packageJson.default.version}`,
         body:
            relevantMessages.map((message) => `- ${message}`).join('\n') ||
            'No notable changes',
         make_latest: String(!packageJson.default.version.includes('-')),
      }),
   }).then(async (res) => {
      if (!res.ok) throw new Error(`${res.statusText}: ${await res.text()}`)
      return res
   })

   // biome-ignore lint/suspicious/noConsole: <explanation>
   console.info('✅ Release notes created successfully')
}

script()
