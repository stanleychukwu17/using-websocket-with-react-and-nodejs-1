import { useEffect } from "react"
import useWebSocket from "react-use-websocket"

type HomeProps = {
    username: string
}

const mouseMove = (event: MouseEvent) => {
    console.log(event.clientX, event.clientY)
}

export default function Home({username}: HomeProps) {

    const WS_URL = "ws://localhost:9000"

    const { sendJsonMessage } = useWebSocket(WS_URL, {
        share: true,
        queryParams: { username },
        onMessage: (event) => console.log(event.data),
        shouldReconnect: () => true,
        reconnectInterval: 1000,
        reconnectAttempts: 20,
    })

    useEffect(() => {
        console.log(sendJsonMessage)
        window.addEventListener('mousemove', mouseMove)

        return () => {
            window.removeEventListener('mousemove', mouseMove)
        }
    }, [sendJsonMessage])

    return (
        <div>welcome back boy</div>
    )
}