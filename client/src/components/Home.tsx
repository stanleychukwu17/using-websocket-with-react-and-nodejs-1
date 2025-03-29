import { useCallback, useEffect, useState } from "react"
import useWebSocket from "react-use-websocket"
import throttle  from "lodash.throttle"

type HomeProps = {
    username: string
}
type receivedMessagesType = {
    [uuid: string] : {
        username: string,
        cursor: {
            x: number,
            y: number
        }
    }
}

// throttle time in ms, we use 50ms for a smother experience
const throttleTime = 50


export default function Home({username}: HomeProps) {
    const [messages, setMessages] = useState<receivedMessagesType>({})
    const WS_URL = "ws://localhost:9000" // websocket url

    // establishes a new websocket connection
    // sendJsonMessage is returned for the new websocket connection
    // we will use the sendJsonMessage to send json messages to websocket server
    const { sendJsonMessage } = useWebSocket(WS_URL, {
        // this is useful if you want to share the same websocket connection between multiple components, but in this case, we only have one component
        // so it is useless, otherwise if you want to share the same websocket connection between multiple components, separate this connection to a high order component or use a state management library
        share: true,

        // this is useful if you want to pass parameters to the websocket server (i.e ws://localhost:9000?username=John)
        queryParams: { username },

        // onMessage handles new messages received from the websocket server
        onMessage: (event) => {
            const newUpdates = JSON.parse(event.data)

            // console.log("message received", newUpdates)
            setMessages(newUpdates)
        },

        // shouldReconnect is useful if you want to reconnect to the websocket server when the connection closes unexpectedly (e.g: maybe the server closes the connection)
        shouldReconnect: () => true,
        reconnectInterval: 1000, // in ms
        reconnectAttempts: 20,
    })

    // the throttle function is useful if you want to limit the number of messages sent to the websocket server
    // how it works: if the function is called multiple times within the throttle time, it will only call the function once
    const sendJsonMessageThrottled = useCallback(
        throttle( (message) => sendJsonMessage(message), throttleTime),
        [sendJsonMessage]
    )

    useEffect(() => {
        // on mouseMove, we send the mouse position to the websocket server
        const mouseMove = (event: MouseEvent) => {
            sendJsonMessageThrottled({x: event.clientX, y: event.clientY})
        }
    
        window.addEventListener('mousemove', mouseMove)

        return () => {
            window.removeEventListener('mousemove', mouseMove)
        }
    }, [sendJsonMessageThrottled])

    // display the current state of the users connected to the websocket
    return (
        <div>
            {Object.keys(messages).map((uuid) => {
                return (
                    <div key={uuid}>
                        <div>Name: {messages[uuid].username}</div>
                        <div>X: {messages[uuid].cursor.x}</div>
                        <div>Y: {messages[uuid].cursor.y}</div>
                    </div>
                )
            })}
        </div>
    )
}