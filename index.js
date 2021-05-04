const http = require('http');
const httpServer = http.createServer();
const websocketServer = require('websocket').server;
httpServer.listen(8080, () => console.log('listening on 8080'));

const wsServer = new websocketServer({httpServer});

const clients = {};
const games = {};

wsServer.on('request', request => {
    const connection = request.accept(null, request.origin);
    connection.on('open', () => console.log('opened'))
    connection.on('close', () => console.log('closeed'));

    // generate new client id
    const clientId = guid();
    clients[clientId] = {
        connection
    }

    const payLoad = {
        method: 'connect',
        clientId: clientId
    }
    connection.send(JSON.stringify(payLoad));

    connection.on('message', data => {
        // recieved message from client
        const res = JSON.parse(data.utf8Data);
        console.log('Got message', res);
        
        if(res.method == "create") {
            // create the game
            const gameId = guid();
            games[gameId] = {
                id: gameId,
                balls: 20,
                clients: []
            }

            const payLoad = {
                method: 'create',
                game: games[gameId]
            }

            clients[res.clientId].connection.send(JSON.stringify(payLoad));
        }
        // a client want to join
        else if(res.method == "join") {
            const {clientId, gameId} = res;
            const game = games[gameId];

            if(game.clients.length >= 6) {
                // max player reach
                return;
            }
            const colors = ["Red","Green","Blue","yellow","cyan","gray"];
            game.clients.push({
                clientId: clientId,
                color: colors[game.clients.length]
            });
            

            const payLoad = {
                method: 'join',
                game: game
            }

            game.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad));
            })
        }
        else if(res.method == 'play') {
            const {clientId, gameId, ballId, color} = res;

            let state = games[gameId].state;
            if(!state) state = {}

            state[ballId] = color;
            games[gameId].state = state;

            const payLoad = {
                method: 'update',
                gameId,
                clientId,
                ballId: ballId,
                color: color
            }

            games[gameId].clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad))
            })

        }
    })
 
    
})


function S4() {
    return ((1+Math.random()) * 10000007).toString(16).substr(0,4);
}
function guid() {
    return S4() + '-' + S4() + '-' + S4();
}
