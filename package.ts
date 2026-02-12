import { definePackage } from '@a35hie/ts-pkg'

export default definePackage({
  name: '@bygnet/api',
  description: 'Elysia-based API for Byg Platform.',
  version: '1.2.1',
  module: 'src/main.ts',

  scripts: {
    dev: 'bun run --watch src/main.ts',
    format: 'prettier --ignore-path .prettierignore --write .',
    loadTest: 'autocannon -c 300 -p 10 -d 30 http://localhost:5001/latest-posts',

    // db scripts
    'db:generate': 'bunx drizzle-kit generate && bunx drizzle-kit generate --config drizzle.config.pg.ts',
    'db:push': 'bunx drizzle-kit push && bunx drizzle-kit push --config drizzle.config.pg.ts',
    'db:push:dev': 'bunx drizzle-kit push',
    'db:push:prod': 'bunx drizzle-kit push --config drizzle.config.pg.ts',
  },

  dependencies: {
    '@a35hie/ts-pkg': '^0.3.1',
    '@elysiajs/cors': '^1.4.1',
    '@elysiajs/html': '^1.4.0',
    '@elysiajs/swagger': '^1.3.1',
    '@types/jsonwebtoken': '^9.0.10',
    argon2: '^0.44.0',
    'drizzle-orm': '^0.45.1',
    elysia: 'latest',
    jsonwebtoken: '^9.0.3',
    postgres: '^3.4.8',
  },
  devDependencies: {
    '@bygnet/types': '^1.3.0',
    'bun-types': 'latest',
    'drizzle-kit': '^0.31.8',
    prettier: '^3.7.4',
  },
})
