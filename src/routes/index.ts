import type { RouteApp } from './helpers'
import { registerAskRoutes } from './asks'
import { registerAuthRoutes } from './auth'
import { registerBrowseRoutes } from './browse'
import { registerCreateRoutes } from './create'
import { registerInteractionRoutes } from './interactions'
import { registerMessageRoutes } from './messages'
import { registerNotificationRoutes } from './notifications'
import { registerProfileRoutes } from './profile'
import { registerSearchRoutes } from './search'
import { registerShortLinkRoutes } from './shortLinks'
import { registerSystemRoutes } from './system'

export function registerRoutes(app: RouteApp): RouteApp {
  let registered = app

  for (const register of [
    registerAuthRoutes,
    registerSystemRoutes,
    registerBrowseRoutes,
    registerSearchRoutes,
    registerInteractionRoutes,
    registerShortLinkRoutes,
    registerCreateRoutes,
    registerNotificationRoutes,
    registerAskRoutes,
    registerMessageRoutes,
    registerProfileRoutes,
  ]) {
    registered = register(registered)
  }

  return registered
}
