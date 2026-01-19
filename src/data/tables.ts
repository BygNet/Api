let tables: any
const isProd: boolean =
  process.env.NODE_ENV === 'production'

if (isProd) {
  tables = await import('./tables.pg')
} else {
  tables = await import('./tables.sqlite')
}

export const { users, sessions, posts, images } = tables
