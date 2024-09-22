import { join } from "node:path"

export default class Route extends URL {
    constructor(url: string) {
        super(url)
    }

    /**
     * Parses the URL path and returns a RouteResult object containing information about the route, file, URL, and path.
     *
     * @return {RouteResult} An object containing the route, file, URL, and path.
     */
	route(): RouteResult {
        const filtered = this.pathname.split("/").filter(Boolean)

        if (filtered.length === 0) {
            return this.defaultRoute()
        }

        if (filtered.length === 1) {
            if (filtered[0].includes(".")) {
                return {
                    route: "public",
                    file: filtered[0],
                    url: `public/${filtered[0]}`,
                    path: join(".", "public", filtered[0]),
                }
            } else {
                return {
                    route: filtered[0],
                    file: "index.html",
                    url: `${filtered[0]}/index.html`,
                    path: join(".", filtered[0], "index.html"),
                }
            }
        }

        const route = filtered[0]
        const file = filtered.slice(1).join("/")

        return {
            route,
            file,
            url: `${route}/${file}`,
            path: join(".", route, file),
        }
    }

    private defaultRoute(): RouteResult {
        return {
            route: "public",
            file: "index.html",
            url: "public/index.html",
            path: join(".", "public", "index.html"),
        }
    }
}