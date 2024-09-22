import { Database } from "bun:sqlite"
import * as fal from "@fal-ai/serverless-client"
import env from "./env"
import Route from "./route"
import dbHelper from "./dbhelper"

await env()

fal.config({
    credentials: Bun.env.FAL_KEY,
})

//--[ Init database ]----------------------------------------------------------

const databaseFile: string = "server.sqlite"
const db = new Database(databaseFile, { create: true })

const initDb = async () => {
    if (!dbHelper.tableExists(db, "users")) {
        console.log("Creating database tables")
        dbHelper.createTable(db)
    }

	if (!dbHelper.userExists(db, "hazlema@gmail.com")) {
		console.log("creating tets user...")
		await dbHelper.createUser(db, {
			email: "hazlema@gmail.com",
			password: "Kelly862004!",
			creation: new Date(),
			credits: 100000,
		})
	}
}

//--[ Handle image generations ]-----------------------------------------------

const runJob = async (form: ImageGenerationParams): Promise<string | null> => {
    try {
        const result: FalAIResponse = await fal.subscribe("fal-ai/flux-pro", {
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

//--[ Start the server ]-------------------------------------------------------

await initDb()

const server = Bun.serve({
    hostname: "localhost",
    port: 3000,

    async fetch(req: Request) {
        const route = new Route(req.url)
        const router: RouteResult = route.route()
        const command: string = `${req.method} ${router.url}`

        //--[ Handle login ]---------------------------------------------------
		
        if (command == "POST login/index.html") {
            const form: credentials = await req.json()
            
			if (await dbHelper.validateUser(db, form) === true) {   
				const headers = new Headers();
				
				// Set the cookie
				headers.set("Content-Type", "application/json");
				headers.append("Set-Cookie", "myCookie=cookieValue; Max-Age=900000; HttpOnly");
				
				console.log(`Auth request: ${form.email} -- Approved`)
				return new Response(JSON.stringify({ text: "success" }), { status: 200, headers: headers })
            }

			console.log(`Auth request: ${form.email} -- Failed`)
            return new Response(JSON.stringify({ text: "fail" }), { status: 200, headers: { "Content-Type": "application/json" } })
        }

        //--[ Handle Image Generations ]---------------------------------------

		if (command == "POST data/index.html") {
            const form: ImageGenerationParams = await req.json()
            console.log(form)

            const result = await runJob(form)
            return new Response(JSON.stringify({ text: "success", image: result }), { status: 200, headers: { "Content-Type": "application/json" } })
        }

        //--[ Handle Web Pages ]-----------------------------------------------

		const htmlResponse = await serveHTML(router.path)

        if (htmlResponse.status === 404) {
            return Response.redirect("/")
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
