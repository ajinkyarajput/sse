var sockets = []
function socketConnectionRequest(req, res, next) {
    const headers = {
        'Content-Type': 'text/event-stream', // To tell client, it is an event stream
        'Connection': 'keep-alive', // To tell client not to close connection
    };
    res.writeHead(200, headers);

    const socketId = Symbol(Date.now())
    const socket = {
        socketId,
        res,
        roles: req.user.roles,
        userId: req.user.id,
    }
    console.log(`New connection established for user id= ${req.user.id} of connection Id =`, socketId)
    res.write('data: Connection Established, We\'ll now start receiving messages from the server.\n')
    sockets.push(socket)
    req.on('close', function () {
        console.log(socketId, `Connection closed`)
        sockets = sockets.filter((socketId) => socket.socketId !== socketId)
    })
}

function onReceiveMessageFromRedis(message) {
    const { data, role, userId } = JSON.parse(message)
    sockets.forEach((socket) => {
        if ((role && socket.roles.indexOf(role) === -1) || (userId && socket.userId !== userId)) {
            return
        }
        const { res } = socket
        res.write(`data: ${data}\n\n`)
    })
}

module.exports = { socketConnectionRequest, onReceiveMessageFromRedis }