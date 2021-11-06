import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { parseCookies } from "nookies";

export const withSSRAuth = <T>(fn: GetServerSideProps<T>) => {
    return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<T>> => {
        const cookies = parseCookies(ctx)

        if (cookies['nextauth.token'])
            return {
                redirect: {
                    destination: '/',
                    permanent: false
                }
            }

        return await fn(ctx)
    }
}