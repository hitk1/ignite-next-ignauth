import { useContext } from "react"
import { AuthContext } from "../contexts/AuthContexts"
import { withSSRAuth } from "../utils/withSSRAuth"

export default function Dashboard() {
    const { user } = useContext(AuthContext)

    return (
        <div>{user?.email}</div>
    )
}

export const getServerSideProps = withSSRAuth(async ctx => {

    return {
        props: {}
    }
})