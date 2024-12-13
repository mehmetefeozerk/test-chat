const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = 80;

app.use(express.static('public'));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function getClientList() {
    const clients = [];
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client.admin != true) {
            clients.push(client.nickname || 'Anonymous');
        }
    });
    return clients;
}

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
    ws.on('message', (message) => {
        message = JSON.parse(message);

        if (message.type === 'set_nickname') {
            ws.nickname = message.nickname;
        gonderClients({ type: 'sunucu_giris', nickname: ws.nickname });
            console.log(`Client set nickname: ${ws.nickname}`);
        } else if (message.type === 'mesaj') {
            console.log(`${message.name}: ${message.message}`);
            gonderClients({ type: 'mesaj', message: message.message, name: message.name });
        } else if (message.type === 'admin') {
            ws.admin = true;
            if (message.command === 'get_clients') {
                ws.send(JSON.stringify({ type: 'client_list', clients: getClientList() }));
            } else if (message.command === 'disconnect_client') {
                wss.clients.forEach((client) => {
                    if (client.nickname === message.nickname && client.readyState === WebSocket.OPEN) {
                        client.close();
                    }
                });
            }
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
        gonderClients({ type: 'sunucu_sayi', count: getClientSayisi() });
        gonderClients({ type: 'disconnect_sunucu', nickname: ws.nickname });
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    gonderClients({ type: 'sunucu_sayi', count: getClientSayisi() });
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
    console.log(`Server is running on ${port}`);
});
