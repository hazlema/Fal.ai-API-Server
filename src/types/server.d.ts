interface CookieOptions {
    maxAge?: number
    expires?: Date
    httpOnly?: boolean
    secure?: boolean
    domain?: string
    path?: string
    sameSite?: "Strict" | "Lax" | "None"
}

interface ExtendedServe {
    (options: ServeOptions): Server
    getAllCookies(req: Request): Record<string, string>
    setCookie(res: Response, name: string, value: string, options?: CookieOptions): Response
	cookieExists(req: Request, name: string): boolean
	getCookie(req: Request, name: string): string 
}
