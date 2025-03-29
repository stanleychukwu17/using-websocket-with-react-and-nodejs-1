import express, { Request, Response } from 'express';

import http from "http" // HTTP server
import url from "url" // url parser, used to get the params from the url
import {WebSocketServer} from "ws" // WebSocket server
import {v4 as uuidV4} from "uuid" // UUID generator (used to generate unique id for each user)

const app = express();
const port = 9000;

// Create the HTTP server from the express app
const server = http.createServer(app)

// Initialize WebSocket server using the HTTP server
const wsServer = new WebSocketServer({ server })

// the "connections" objects will store all websocket connections
// the key will be the uuid of the user (i.e the user id generated)
const connections: { [uuid: string]: WebSocket } = {}

// the "users" object will hold all the users and the current state of their cursor
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


// broadcast: used to send a message to all users on the websocket connection
// anytime any of the users move their cursor, the new cursor position is sent to all users
const broadcast = () => {
    // loops through the connections object and sends the message to each connection
    Object.keys(connections).forEach(uuid => {
        const connection = connections[uuid]

        // console.log("sending", JSON.stringify(users))
        connection.send(JSON.stringify(users))
    })
}


// Handles WebSocket messages received for each connection
const updateUserCursor = (message_in_bytes: string, uuid: string) => {
    // whenever data is sent from the client, it comes in bytes. even in a normal http request
    // normally, in an express app, we usually use a middleware to convert the data to JSON
    // i.e app.use(express.json()); - this will convert the data to JSON
    // because of the middleware, we do not need to do: JSON.parse(message_in_bytes.toString()) for every request we receive

    // Parse the message into a JSON object, but first the bytes is converted to string
    const new_cursor_position: userType[typeof uuid]['cursor'] = JSON.parse(message_in_bytes.toString())
    const user = users[uuid]
    user.cursor = new_cursor_position
    // console.log("see message received", message)

    // sends the update cursor position to all users
    broadcast()
}

// Handles WebSocket disconnections whenever a user disconnects from the websocket
const handleClose = (uuid: string) => {
    console.log(`connection closed for ${users[uuid].username}`)
    delete connections[uuid]
    delete users[uuid]

    broadcast()
}


// Handles new request from the client to connect to the WebSocket
// you can use postman to test your connection, use the url: ws://localhost:${port}?username=stanley
// in postman, don't use a normal GET request, instead click on the yellow button with "New Request" and select "WebSocket"
wsServer.on("connection", (connection, request: http.IncomingMessage) => {
    // check if you allow connections from the origin below
    // const origin = request.headers.origin

    const {username} = url.parse(request.url!, true).query
    const uuid = uuidV4()
    // console.log(username, uuid)

    // if the request looks something like ?username=stanley&username=mike, we reject the connection request
    // we only want one username per connection
    if (typeof username !== "string") {
        connection.close(4000, 'Invalid username provided'); // 4000 is a custom WebSocket close code
        return
    }

    //@ts-ignore
    connections[uuid] = connection // add the connection to the connections object

    // since connection has been accepted, we add the user to the users object
    users[uuid] = {
        username: username as string,
        cursor: {
            x: 0,
            y: 0
        }
    }

    // whenever the connection receives a new message, we forward it to the "updateUserCursor" function
    connection.on("message", (message) => updateUserCursor(message as unknown as string, uuid))

    // when the connection is closed, we clean up the connections and users objects
    connection.on("close", () => {
        handleClose(uuid)
    })
})

// normal HTTP GET request to the root url
app.get('/', (req: Request, res: Response) => {
    res.send('Hello, TypeScript and Node.js! everything cool');
});

// Start the server to handle HTTP and WebSocket connections
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


// This ensures that your WebSocket and HTTP servers close gracefully in case of an unexpected shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');

    // Close WebSocket server
    wsServer.close();

    // Close HTTP server
    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0); // Exit the process after closing
    });
});