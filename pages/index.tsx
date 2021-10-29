import { FormEvent, useContext, useState } from "react"
import { useRouter } from 'next/router'
import { AuthContext } from "../contexts/AuthContexts"
import styles from '../styles/Home.module.scss'

export default function Home() {
  const { push } = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const { signIn } = useContext(AuthContext)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const data = {
      email, password
    }

    await signIn(data)
    push('/dashboard')
  }

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <input name="email" type="email" value={email} onChange={event => setEmail(event.target.value)} />
      <input name="password" type="password" value={password} onChange={event => setPassword(event.target.value)} />
      <button type="submit">Entrar</button>
    </form>
  )
}
