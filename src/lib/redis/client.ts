import { Redis } from 'ioredis'

const redisUrl = process.env.REDIS_URL

export const redis = redisUrl ? new Redis(redisUrl, {
  maxRetriesPerRequest: null,
}) : {
  get: async () => null,
  setex: async () => null,
  incr: async () => null,
} as any
