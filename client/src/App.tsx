import { useState } from "react";
import Login from "./components/Login";
import Home from "./components/Home";

export default function App1() {
    const [username, setUsername] = useState<string>('')

    return (
        <div>
            <div className="">
                <h2>Hello {username}</h2>
            </div>
            <div className="">
                {username && <Home username={username} />}
                {!username && <Login onSubmit={setUsername} />}
            </div>
        </div>
    )
}