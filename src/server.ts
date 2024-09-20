import { join } from "node:path"
import * as fal from "@fal-ai/serverless-client"
import env from "./env"
await env()

fal.config({
    credentials: Bun.env.FAL_KEY,
})

/**
 * Submits an image generation job to the Fal AI serverless client.
 *
 * @param {ImageGenerationParams} form - The parameters for the image generation job.
 * @return {string | null} The URL of the generated image, or null if the job fails.
 */
const runJob = async (form: ImageGenerationParams): Promise<string | null> => {
    try {
        // Uncomment to use the dev version of flux
		// const result: FalAIResponse = await fal.subscribe("fal-ai/flux/dev", {
        const result: FalAIResponse = await fal.subscribe("fal-ai/flux-pro", {
            input: {
                prompt: form.prompt,
                image_size: form.image_size,
                seed: form.seed,
                num_inference_steps: form.steps,
                guidance_scale: form.guidance,
                num_images: 1,
				safety_tolerance: 5
            },
        })

        return result.images[0].url
    } catch (error) {
        console.error("Error details:", JSON.stringify(error, null, 2))
    }

    return null
}

/**
 * Serve an HTML file from the specified path.
 *
 * @param {string} path - The path of the HTML file to serve.
 * @return {Promise<Response>} A Promise that resolves to the HTTP response containing the HTML file.
 */
const serveHTML = async (path: string): Promise<Response> => {
    try {
		const htmlPath = join(".", "html", path);
        const file = Bun.file(htmlPath);
        if (await file.exists()) {
            return new Response(file, {
                headers: { "Content-Type": file.type },
            });
        }
    } catch (error) {
        console.error(`Error serving HTML file ${path}: ${error}`);
    }

	return new Response("File not found", { status: 404 });
};


const server = Bun.serve({
	hostname: "localhost",
    port: 3000,

	/**
	 * Handles incoming HTTP requests and returns a response.
	 *
	 * @param {Request} req - The incoming HTTP request.
	 * @return {Promise<Response>} A promise resolving to the HTTP response.
	 */
	async fetch(req: Request ) {
        const url = new URL(req.url);

        switch (`${req.method} ${url.pathname}`) {
            case "GET /":
                return await serveHTML("/form.html");

            case "POST /data":
                const form: ImageGenerationParams = await req.json();

				console.log(`Request from ${req.url}`);             
				console.log(form);
				console.log("");

				const result = await runJob(form);

                return new Response(
                    JSON.stringify({ text: "success", image: result }),
                    { status: 200, headers: { "Content-Type": "application/json" } }
                );

            default:
                const htmlResponse = await serveHTML(url.pathname);
                if (htmlResponse.status === 404) {
                    return Response.redirect("/");
                }
                return htmlResponse;
        }
    }
});

console.log(`Server running on ${server.url}`)
console.log("Press Ctrl-C to exit")
