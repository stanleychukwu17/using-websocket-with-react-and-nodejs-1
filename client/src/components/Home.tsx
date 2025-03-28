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
    const WS_URL = "ws://localhost:9000"

    const { sendJsonMessage } = useWebSocket(WS_URL, {
        share: true,
        queryParams: { username },
        onMessage: (event) => {
            const newUpdates = JSON.parse(event.data)

            // console.log("message received", newUpdates)
            setMessages(newUpdates)
        },
        shouldReconnect: () => true,
        reconnectInterval: 1000,
        reconnectAttempts: 20,
    })

    const sendJsonMessageThrottled = useCallback(
        throttle( (message) => sendJsonMessage(message), throttleTime),
        [sendJsonMessage]
    )

    useEffect(() => {
        const mouseMove = (event: MouseEvent) => {
            sendJsonMessageThrottled({x: event.clientX, y: event.clientY})
        }
    
        window.addEventListener('mousemove', mouseMove)

        return () => {
            window.removeEventListener('mousemove', mouseMove)
        }
    }, [sendJsonMessageThrottled])

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