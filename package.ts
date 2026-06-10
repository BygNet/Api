import { BunPm, definePackage } from '@opk/ts-pkg'

export default definePackage({
  pm: BunPm,
  name: '@bygnet/api',
  description: 'Elysia-based API for Byg Platform.',
  version: '1.13.3',
  module: 'src/main.ts',

  scripts: {
    dev: 'bun run --watch src/main.ts',
    format: 'prettier --ignore-path .prettierignore --write .',
    loadTest: 'autocannon -c 300 -p 10 -d 30 http://localhost:2255/latest-posts',

    // db scripts
    'db:generate': 'bunx drizzle-kit generate',
    'db:push': 'bunx drizzle-kit push',
    'db:migrate:sqlite': 'bun run src/data/migrateSqliteToPostgres.ts',
  },

  dependencies: {
    '@elysiajs/cors': '^1.4.1',
    '@elysiajs/html': '^1.4.0',
    '@elysiajs/swagger': '^1.3.1',
    '@opentelemetry/api-logs': '^0.218.0',
    '@opentelemetry/exporter-logs-otlp-http': '^0.218.0',
    '@opentelemetry/resources': '^2.7.1',
    '@opentelemetry/sdk-logs': '^0.218.0',
    '@opentelemetry/sdk-node': '^0.218.0',
    '@opk/ts-pkg': '^0.7.1',
    '@types/jsonwebtoken': '^9.0.10',
    argon2: '^0.44.0',
    'drizzle-orm': '^0.45.1',
    elysia: 'latest',
    jsonwebtoken: '^9.0.3',
    marked: '^18.0.3',
    postgres: '^3.4.8',
    rss: '^1.2.2',
    'web-push': '^3.6.7',
  },
  devDependencies: {
    '@bygnet/types': '^1.7.0',
    '@types/rss': '^0.0.32',
    '@types/web-push': '^3.6.4',
    'bun-types': 'latest',
    'drizzle-kit': '^0.31.8',
    prettier: '^3.7.4',
  },
})
