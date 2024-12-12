const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = 3000;

app.use(express.static('public'));

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

function getClientSayisi() {
    let clients = 0;
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            clients = clients + 1;
        }
    });
    return clients;
}

wss.on('connection', (ws) => {
        gonderClients({type:'sunucu_sayi',count:getClientSayisi()});
    ws.on('message', (message) => {
        message = JSON.parse(message);
console.log(message);
if(message.type == 'mesaj'){
    console.log(message.message+' '+message.name);
gonderClients({type:'mesaj', message:message.message, name:message.name});
}
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
        gonderClients({type:'sunucu_sayi',count:getClientSayisi()});
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

function gonderClients(data) {
    const jsonData = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(jsonData);
        }
    });
}

// Start the server
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
