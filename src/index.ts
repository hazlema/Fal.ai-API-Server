import { Database } from "bun:sqlite"
import * as Fal from "@fal-ai/serverless-client"
import LoadEnv from "./loadenv"
import Route from "./route"
import DbHelper from "./dbhelper"
import { serve } from "./server"

await LoadEnv()

Fal.config({
    credentials: Bun.env.FAL_KEY,
})

//--[ Init database ]----------------------------------------------------------

const db = new Database("server.sqlite", { create: true })

const initDb = async () => {
    if (!DbHelper.tableExists(db, "users")) {
        console.log("Creating database tables")
        DbHelper.createTable(db)
    }

    if (!DbHelper.userExists(db, "hazlema@gmail.com")) {
        console.log("creating test user...")
        await DbHelper.createUser(db, {
            email: "hazlema@gmail.com",
            password: "Kelly862004!",
            creation: new Date(),
            token: null,
            credits: 100000,
        })
    }
}

//--[ Handle image generations ]-----------------------------------------------

const runJob = async (form: ImageGenerationParams): Promise<string | null> => {
    try {
        const result: FalAIResponse = await Fal.subscribe("fal-ai/flux-pro", {
            input: {
                prompt: form.prompt,
                image_size: form.image_size,
                seed: form.seed,
                num_inference_steps: form.steps,
                guidance_scale: form.guidance,
                num_images: 1,
                safety_tolerance: 5,
            },
        })

        return result.images[0].url
    } catch (error) {
        console.error("Error details:", JSON.stringify(error, null, 2))
    }

    return null
}

//--[ Serve an HTML file ]-----------------------------------------------------

const serveHTML = async (htmlPath: string): Promise<Response> => {
    try {
        const file = Bun.file(htmlPath)
        if (await file.exists()) {
            return new Response(file, {
                headers: { "Content-Type": file.type },
            })
        }
    } catch (error) {
        console.error(`Error serving HTML file ${htmlPath}: ${error}`)
    }

    return new Response("File not found", { status: 404 })
}

//--[ add/Subtract credits from a token ]--------------------------------------

const adjustCredits = (req: Request, amount: number): boolean => {
    const token = serve.getCookie(req, "token")

    if (token != "") {
        if (DbHelper.tokenExists(db, token)) {
            DbHelper.adjustCredits(db, token, amount)
            return true
        }
    }
    return false
}

//--[ Do they have sufficient credits ]----------------------------------------

const hasCredits = (req: Request, amount: number): boolean => {
    const token = serve.getCookie(req, "token")

    if (token != "") {
        if (DbHelper.tokenExists(db, token)) {
            const user = DbHelper.getUserByToken(db, token)
            if (user && user.credits && user.credits >= amount) {
                return true
            }
        }
    }
    return false
}

//--[ Create json response ]---------------------------------------------------

const jsonResponse = (result: string, extra: Record<string, string> = {}): Response => {
    const sendMessage = { text: result }
    const finalMessage = JSON.stringify({ ...sendMessage, ...extra })

    return new Response(finalMessage, {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    })
}

//--[ Start the server ]-------------------------------------------------------

await initDb()

const server = serve({
    hostname: Bun.env.HOSTNAME || "localhost",
    port: Bun.env.PORT || 3000,

    async fetch(req: Request) {
        const route = new Route(req.url)
        const router: RouteResult = route.route()
        const command: string = `${req.method} ${router.url}`

        //--[ If they are all ready authenticated redirect to app ]------------

        if (command == "GET public/index.html") {
            const token = serve.getCookie(req, "token")

            if (token != "" && DbHelper.tokenExists(db, token)) {
                return Response.redirect("/app")
            }
        }

        //--[ Handle login ]---------------------------------------------------

        if (command == "POST login/index.html") {
            const form: Credentials = await req.json()

            if ((await DbHelper.validateUser(db, form)) === true) {
                let token = crypto.randomUUID() + "-" + crypto.randomUUID() + "-" + crypto.randomUUID()
                DbHelper.updateUserToken(db, token, form.email)

                let res = jsonResponse("success")
                res = serve.setCookie(res, "token", token, { maxAge: 86400, httpOnly: true })

                return res
            }
            return jsonResponse("fail")
        }

        //--[ Handle Image Generations ]---------------------------------------

        if (command == "POST data/index.html") {
            const form: ImageGenerationParams = await req.json()

            if (hasCredits(req, 1)) {
                if (adjustCredits(req, -1)) {
                    const result = await runJob(form)
                    // TODO: check result
                    return jsonResponse("success", { image: result! })
                }
            }
            return jsonResponse("fail", { redirect: "/app/nocredits.html" })
        }

        //--[ Handle Web Pages ]-----------------------------------------------

        const htmlResponse = await serveHTML(router.path)

        if (htmlResponse.status === 404) {
            return Response.redirect("/404.html")
        }

        // check for token on this privileged path
        if (router.route == "app") {
            const token = serve.getCookie(req, "token")
            if (token != "" && DbHelper.tokenExists(db, token)) {
                return htmlResponse
            }
            return Response.redirect("/expired.html")
        }

        return htmlResponse
    },
})

//--[ Launch a browser ]-------------------------------------------------------

console.log()
console.log(`Server running on ${server.url}`)
console.log("Press Ctrl-C to exit")

var start = process.platform == "darwin" ? "open" : process.platform == "win32" ? "start" : "xdg-open"
require("child_process").exec(`${start} ${server.url}`)

// TODO: Create User Page
// TODO: Add Credits Page
// TODO: CLI interface
