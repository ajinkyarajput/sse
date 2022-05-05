const redis = require('redis');
const { onReceiveMessageFromRedis } = require('./socket')

const RedisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    password: process.env.REDIS_PASSWORD,
    port: process.env.REDIS_PORT || '6379',
}
const CHANNEL_NAME_TO_PUBLISH_SSE_MESSAGES = 'sse-messages'
let redisClientToPublishMessages, redisClientToSubscribeChannel

async function createConnectionAndSubscribeRedis() {
    if (!redisClientToSubscribeChannel) {
        redisClientToPublishMessages = redis.createClient(RedisConfig)
        redisClientToSubscribeChannel = redisClientToPublishMessages.duplicate() // Subscribing to a channel requires a dedicated stand-alone connection
        await redisClientToPublishMessages.connect()
        await redisClientToSubscribeChannel.connect()
    }

    redisClientToSubscribeChannel.on('error', function (err) {
        console.error(err)
    })

    redisClientToSubscribeChannel.subscribe(CHANNEL_NAME_TO_PUBLISH_SSE_MESSAGES, onReceiveMessageFromRedis)
}

function publishMessageToConnectedSockets(data, { role, userId } = {}) {
    redisClientToPublishMessages.publish(CHANNEL_NAME_TO_PUBLISH_SSE_MESSAGES, JSON.stringify({ data, role, userId }))
}

function publishMessageToConnectedSocketsByRole(data, role) {
    publishMessageToConnectedSockets(data, { role })
}

function publishMessageToConnectedSocketsByUser(data, userId) {
    publishMessageToConnectedSockets(data, { userId })
}


module.exports = { createConnectionAndSubscribeRedis, publishMessageToConnectedSockets, publishMessageToConnectedSocketsByRole, publishMessageToConnectedSocketsByUser }