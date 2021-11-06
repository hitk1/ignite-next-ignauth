import axios, { AxiosError } from 'axios'
import { parseCookies, setCookie } from 'nookies'
import { signOut } from '../contexts/AuthContexts'

let cookies = parseCookies()
let isRefreshing = false
let failedRequestsQueue = [] //Requisições pendentes

export const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
        Authorization: `Bearer ${cookies['nextauth.token']}`
    }
})

/* No Axios Interceptors, não é permitido uso de async/await */
api.interceptors.response.use(
    success => success,
    (error: AxiosError) => {
        if (error.response.status === 401) {
            if (error.response.data?.code === 'token.expired') {        //Estratégia de refresh token
                cookies = parseCookies()
                const { 'nextauth.refreshToken': refreshToken } = cookies
                const originalConfig = error.config

                if (!isRefreshing) {
                    isRefreshing = true

                    api.post(
                        '/refresh',
                        {
                            refreshToken
                        }
                    ).then(response => {
                        const {
                            token,
                            refreshToken: newRefreshToken
                        } = response.data

                        setCookie(
                            undefined,
                            'nextauth.token',
                            token,
                            {
                                maxAge: 60 * 60 * 24 * 30,
                                path: '/'
                            }
                        )

                        setCookie(
                            undefined,
                            'nextauth.refreshToken',
                            newRefreshToken,
                            {
                                maxAge: 60 * 60 * 24 * 30,
                                path: '/'
                            }
                        )

                        //Aqui também é preciso atualizar os valores de token do axios
                        api.defaults.headers['Authorization'] = `Bearer ${token}`

                        //Quando o token for atualizado, é só executar todas as requisições que estão pendentes novamente, com o novo token
                        failedRequestsQueue.forEach(request => request.resolve(token))  //Neste caso, "resolve" é o nome da função declarada abaixo para os casos de sucesso
                        failedRequestsQueue = []
                    })
                        .catch(error => {
                            failedRequestsQueue.forEach(request => request.reject(error))  //Neste caso, "reject" é o nome da função declarada abaixo para os casos de erros
                            failedRequestsQueue = []
                        })
                        .finally(() => {
                            isRefreshing = false
                        })
                }

                //Estratégia de criação de fila das requisições pendentes, até que os token sejam atualizados
                return new Promise((resolve, reject) => {
                    failedRequestsQueue.push({
                        resolve: (token: string) => {
                            originalConfig.headers['Authorization'] = `Bearer ${token}`

                            /*
                                A ideia aqui é atualizar o token para todas as requisições pendentes
                                e resolver a função com uma nova chamada com as mesmas configurações da chamada que esta pendente
                                mas dessa vez com o token atualiza, que em teoria, seriam executadas com sucesso
                            */
                            resolve(api(originalConfig))
                        },
                        reject: error => reject(error),
                    })
                })
            } else {
                signOut()
            }
        }

        //É importante que se o erro nao cair nas trativas acima, que ele "siga seu curso"
        return Promise.reject(error)
    }
)