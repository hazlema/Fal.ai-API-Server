import { serve as bunServe, type Server, type ServeOptions } from "bun"

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

/**
 * Parses the cookies from the request header.
 *
 * @param {Request} req - The request object.
 * @return {Record<string, string>} - An object containing the parsed cookies.
 */
const getAllCookies = (req: Request): Record<string, string> => {
    const cookieHeader = req.headers.get("Cookie") || ""
    return Object.fromEntries(
        cookieHeader.split(";").map((cookie) => {
            const [key, value] = cookie.split("=").map((part) => part.trim())
            return [key, decodeURIComponent(value)]
        })
    )
}

/**
 * Checks if a cookie with the given name exists in the request.
 *
 * @param {Request} req - The request object to check for the cookie.
 * @param {string} name - The name of the cookie to check for.
 * @return {boolean} True if the cookie exists, false otherwise.
 */
const cookieExists = (req: Request, name: string): boolean => {
	const all = getAllCookies(req)
	return (Object.keys(all).includes(name)) ? true : false
}

/**
 * Retrieves a specific cookie from the request by its name.
 *
 * @param {Request} req - The request object to retrieve the cookie from.
 * @param {string} name - The name of the cookie to retrieve.
 * @return {string} The value of the cookie, or an empty string if it does not exist.
 */
const getCookie = (req: Request, name: string): string => {
	const all = getAllCookies(req)
	return (Object.keys(all).includes(name)) ? all[name] : "";
}

/**
 * Sets a cookie on the given response object.
 *
 * @param {Response} res - The response object to set the cookie on.
 * @param {string} name - The name of the cookie.
 * @param {string} value - The value of the cookie.
 * @param {CookieOptions} [options={}] - Optional cookie options.
 * @return {Response} The response object with the cookie set.
 */
const setCookie = (res: Response, name: string, value: string, options: CookieOptions = {}): Response => {
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`

    if (options.maxAge) cookieString += `; Max-Age=${options.maxAge}`
    if (options.expires) cookieString += `; Expires=${options.expires.toUTCString()}`
    if (options.httpOnly) cookieString += "; HttpOnly"
    if (options.secure) cookieString += "; Secure"
    if (options.domain) cookieString += `; Domain=${options.domain}`
    if (options.path) cookieString += `; Path=${options.path}`
    if (options.sameSite) cookieString += `; SameSite=${options.sameSite}`

    res.headers.append("Set-Cookie", cookieString)
    return res
}

/**
 * Create the exported server function with the extended functionality.
 */
const serve: ExtendedServe = Object.assign((options: ServeOptions) => bunServe(options), { getAllCookies, setCookie, cookieExists, getCookie })
export { serve }
