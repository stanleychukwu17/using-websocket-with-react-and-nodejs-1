import { useState } from "react"

type LoginProps = {
    onSubmit: React.Dispatch<React.SetStateAction<string>>
}

export default function Login({onSubmit}: LoginProps) {
    const [username, setUsername] = useState<string>('')

    return (
        <div>
            <form
                action=""
                onSubmit={(e) => {
                    e.preventDefault()
                    onSubmit(username)
                }}
            >
                <div className=""><label htmlFor="">What would you like to be called?</label></div>
                <div className="">
                    <input
                        type="text" placeholder='username'
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                <div className=""><button type='submit'>Login</button></div>
            </form>
        </div>
    )
}