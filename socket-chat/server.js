const cors = require('cors')

const io = require('socket.io')({
    cors: {
        origin: "http://192.68.1.6:5500",
        methods: ['GET','POST']
    }
})

users = {}

io.on('connection', socket => {
    socket.on('new-user', name => {
        users[socket.id] = name
        socket.broadcast.emit('user-connected', name)
    })
    socket.on('send-message', message => {
        socket.broadcast.emit('get-msg', {message : message, name: users[socket.id]})
    })
    socket.on('disconnect', () => {
        socket.broadcast.emit('user-disconnect', users[socket.id])
        delete users[socket.id]
    })
})

io.listen(3000)
