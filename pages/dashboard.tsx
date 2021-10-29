import { useContext } from "react"
import { AuthContext } from "../contexts/AuthContexts"

export default function Dashboard() {
    const { user } = useContext(AuthContext)

    return (
        <div>{user?.email}</div>
    )
}