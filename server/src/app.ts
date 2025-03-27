import express, { Request, Response } from 'express';

import http from "http"
import url from "url"
import {WebSocketServer} from "ws"
import {v4 as uuidV4} from "uuid"

const app = express();
const port = 9000;

// Create the HTTP server from the express app
const server = http.createServer(app)

// Initialize WebSocket server
const wsServer = new WebSocketServer({ server })


// connections will hold all the connections
const connections: { [uuid: string]: WebSocket } = {}
// users will hold all the users and the current state of their cursor
const users: { [uuid: string]: {username: string, cursor: {x: number, y: number}} } = {}


// Handle WebSocket connections
// you can use postman to test your connection, use the url: ws://localhost:${port}?username=stanley
// in postman, don't use a normal GET request, instead click on the yellow button with "New Request" and select "WebSocket"
wsServer.on("connection", (connection, request: http.IncomingMessage) => {
    // const origin = request.headers.origin
    const {username} = url.parse(request.url!, true).query
    const uuid = uuidV4()

    // if the request looks something like ?username=stanley&username=mike, we reject the connection request
    // we only want one username per connection
    if (typeof username !== "string") {
        connection.close(4000, 'Invalid username provided'); // 4000 is a custom WebSocket close code
        return
    }


    //@ts-ignore
    connections[uuid] = connection

    users[uuid] = {
        username: username as string,
        cursor: {
            x: 0,
            y: 0
        }
    }

    connection.on("message", (message) => handleMessage(message, uuid))

    connection.on("close", () => {
        handleClose(uuid)
        console.log("connection closed")
        delete connections[uuid]
        delete users[uuid]
    })
    console.log(username, uuid)
})

app.get('/', (req: Request, res: Response) => {
    res.send('Hello, TypeScript and Node.js! everything cool');
});

// Start the server to handle HTTP and WebSocket connections
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


// This ensures that your WebSocket and HTTP servers close gracefully
// when you stop the application (e.g., with Ctrl + C in the terminal).
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    wsServer.close(); // Close WebSocket server
    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0); // Exit the process after closing
    });
});