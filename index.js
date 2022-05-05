const express = require('express');
const app = express();
const PORT = 3000;
const { socketConnectionRequest } = require('./socket')
const { createConnectionAndSubscribeRedis, publishMessageToConnectedSockets, publishMessageToConnectedSocketsByRole, publishMessageToConnectedSocketsByUser } = require('./redis-sse')

createConnectionAndSubscribeRedis()
app.get('/send-message-to-role', (req, res, next) => {
    publishMessageToConnectedSocketsByRole(`This event is triggered at ${new Date()}`, req.query.role)
    res.sendStatus(200)
});
app.get('/send-message-to-user', (req, res, next) => {
    publishMessageToConnectedSocketsByUser(`This event is triggered at ${new Date()}`, +req.query.userId)
    res.sendStatus(200)
});
app.get('/send-message-to-client', (req, res, next) => {
    publishMessageToConnectedSockets(`This event is triggered at ${new Date()}`)
    res.sendStatus(200)
});
const users = [{ "id": 1, "email": "user1@sse.com", "roles": ["employer"] }, { "id": 2, "email": "user2@sse.com", "roles": ["employee"] }, { "id": 3, "email": "user3@sse.com", "roles": ["employee"] }, { "id": 4, "email": "user4@sse.com", "roles": ["employer"] }]

const auth = (req, res, next) => {
    const email = req.headers['email']
    let user = users.find(u => u.email === email)
    if (!user) {
        const uniqueId = Date.now()
        user = { "id": uniqueId, "email": `@sse.com">guest${uniqueId}@sse.com`, "roles": ["guest"] }
    }
    req.user = user
    next()
}

app.get('/socket-connection-request', auth, socketConnectionRequest);
app.listen(PORT, (err) => {
    if (err) {
        console.error(err)
        return
    }
    console.log(`Express Server listening at ${PORT}`)
})