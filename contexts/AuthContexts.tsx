import Router from 'next/router'
import { createContext, ReactNode, useEffect, useState } from "react";
import { setCookie, parseCookies, destroyCookie } from 'nookies'
import { api } from "../services/api";

type User = {
    email: string
    permissions: string[]
    roles: string[]
}

type SignInCredentials = {
    email: string
    password: string
}

type AuthContextData = {
    signIn(credentials: SignInCredentials): Promise<void>
    user: User
    isAuthenticated: boolean
}

type AuthProviderProps = {
    children: ReactNode
}

export const AuthContext = createContext({} as AuthContextData)

export const signOut = () => {
    destroyCookie(undefined, 'nextauth.token')
    destroyCookie(undefined, 'nextauth.refreshToken')

    Router.push('/')
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User>()
    const isAuthenticated = !!user

    useEffect(() => {
        try {
            const { 'nextauth.token': token } = parseCookies()

            if (!token) {
                api.get('/me')
                    .then(response => {
                        const { email, permissions, roles } = response.data

                        setUser({ email, permissions, roles })
                    })
                    .catch(() => {
                        signOut()
                    })
            }
        } catch (error) {
            console.log(error.message)
        }
    }, [])

    const signIn = async ({ email, password }: SignInCredentials) => {
        try {
            const response = await api.post('/sessions', { email, password })
            const { permissions, roles, token, refreshToken } = response.data

            setCookie(
                undefined,  //Importante -> Sempre que os cookies estiver sendo manipulados pelo lado do browser, esse parametro vai como undefined
                'ignauth.token',
                token,
                {
                    maxAge: 60 * 60 * 24 * 30, // É o tempo maximo que o dado será armazenado pelo navegador
                    path: '/'  // Indica quais caminhos/paginas/path/qualquer outra coisa, terão acesso a esse dado, '/' indica que tudo terá acesso
                }
            )
            setCookie(
                undefined,
                'ignauth.refreshToken',
                refreshToken,
                {
                    maxAge: 60 * 60 * 24 * 30,
                    path: '/'
                }
            )

            setUser({
                email,
                permissions,
                roles
            })

            api.defaults.headers['Authorization'] = `Bearer ${token}`

            Router.push('/dashboard')
        } catch (error) {
            console.log(error.message)
        }
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, signIn, user }}>
            {children}
        </AuthContext.Provider>
    )
}