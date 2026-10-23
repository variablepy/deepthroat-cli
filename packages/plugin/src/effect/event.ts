import type { EventApi } from "@deepthroat/client/effect/api"

export interface EventDomain extends Pick<EventApi<unknown>, "subscribe"> {}
