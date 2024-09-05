import pkg from '../package.json' with { type: "json" }
const version = pkg.version

if (version.includes('beta') || version.includes('-'))
   throw new Error('The package version is not valid for a stable release')
