import type { EventApi } from "@deepthroat/client/promise/api"

export interface EventDomain extends Pick<EventApi, "subscribe"> {}
