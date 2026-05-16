import { Elysia } from 'elysia'
import RSS from 'rss'
import { BrowseController } from '@/browse/controller'
import { getPrimaryWebBase } from '@/utils/webBase'
import { marked } from 'marked'

const BaseUrl: string = getPrimaryWebBase()

export const rssRoutes = new Elysia({
  prefix: '/rss',
}).get('/:username', async ({ params, set }) => {
  const posts = await BrowseController.getPostsByUsername(params.username)

  const firstPost = posts[0]

  const user = {
    username: params.username,
    displayName: firstPost?.author || params.username,
    avatarUrl: null,
  }

  const feed = new RSS({
    title: `${user.displayName || user.username}'s Byg feed`,
    description: `Posts from @${user.username}`,
    feed_url: `${BaseUrl}/rss/${user.username}.xml`,
    site_url: `${BaseUrl}/${user.username}`,
    image_url: user.avatarUrl || undefined,
    language: 'en',
    ttl: 60,
  })

  for (const post of posts) {
    feed.item({
      title: post.title,
      description: await marked.parse(post.content || ''),
      url: `${BaseUrl}/posts/${post.id}`,
      guid: String(post.id),
      author: user.displayName || user.username,
      date: post.createdDate,
    })
  }

  set.headers['content-type'] = 'application/rss+xml; charset=utf-8'

  set.headers['cache-control'] = 'public, max-age=300'

  return feed.xml({
    indent: true,
  })
})
