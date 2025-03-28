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
type userType = {
    [uuid: string]: {
        username: string,
        cursor: {
            x: number,
            y: number
        }
    }
}

const users: userType = {}


// sends a message to all connected clients
const broadcast = () => {
    Object.keys(connections).forEach(uuid => {
        const connection = connections[uuid]
        connection.send(JSON.stringify(users))
        console.log("sending", JSON.stringify(users))
    })
}


// Handle WebSocket messages for each connection
const handleMessage = (message_in_bytes: string, uuid: string) => {
    // whenever data is sent from the client, it comes in bytes. even in a normal http request
    // remember, in a normal express app, we usually use a middleware to convert the data to JSON
    // i.e app.use(express.json()); - this will convert the data to JSON
    // because of the middleware, we do not need to do: JSON.parse(message_in_bytes.toString()) for every request we receive

    // Parse the message into a JSON object
    const message: userType[typeof uuid]['cursor'] = JSON.parse(message_in_bytes.toString())
    const user = users[uuid]
    user.cursor = message

    broadcast()
}

// Handle WebSocket disconnections for each connection
const handleClose = (uuid: string) => {
    console.log(`connection closed for ${users[uuid].username}`)
    delete connections[uuid]
    delete users[uuid]

    broadcast()
}


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

    connection.on("message", (message) => handleMessage(message as unknown as string, uuid))

    connection.on("close", () => {
        handleClose(uuid)
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