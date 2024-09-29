import { Database } from 'bun:sqlite';
import * as Fal from '@fal-ai/serverless-client';
import LoadEnv from './loadenv';
import Route from './route';
import DbHelper from './dbhelper';
import { serve } from './server';
import dbHelper from './test/dbhelper';

await LoadEnv();

Fal.config({
    credentials: Bun.env.FAL_KEY,
});

//--[ Init database ]----------------------------------------------------------

const db = new Database('server.sqlite', { create: true });

/**
 * Initializes the database by creating the 'users' table if it does not exist,
 * and creates a test user with a predefined email and password if the user does not exist.
 *
 * @return {Promise<void>} A promise that resolves when the initialization is complete.
 */
const initDb = async () => {
    if (!DbHelper.tableExists(db, 'users')) {
        console.log('Creating database tables');
        DbHelper.createTable(db);
    }
};

/**
 * Submits a job to the Fal AI server to generate an image based on the provided parameters.
 *
 * @param {ImageGenerationParams} form - The parameters for the image generation job.
 * @return {string | null} The URL of the generated image, or null if the job fails.
 */
const runJob = async (form: ImageGenerationParams): Promise<string | null> => {
    try {
        const result: FalAIResponse = await Fal.subscribe('fal-ai/flux-pro', {
            input: {
                prompt: form.prompt,
                image_size: form.image_size,
                seed: form.seed,
                num_inference_steps: form.steps,
                guidance_scale: form.guidance,
                num_images: 1,
                safety_tolerance: 5,
            },
        });

        return result.images[0].url;
    } catch (error) {
        console.error('Error details:', JSON.stringify(error, null, 2));
    }

    return null;
};

/**
 * Serves an HTML file from the given path.
 *
 * @param {string} htmlPath - The path to the HTML file.
 * @return {Promise<Response>} A Promise that resolves to a Response object with the HTML file content and the appropriate Content-Type header. If the file does not exist, a Response object with a "File not found" message and a status code of 404 is returned.
 */
const serveHTML = async (htmlPath: string): Promise<Response> => {
    try {
        const file = Bun.file(htmlPath);
        if (await file.exists()) {
            return new Response(file, {
                headers: { 'Content-Type': file.type },
            });
        }
    } catch (error) {
        console.error(`Error serving HTML file ${htmlPath}: ${error}`);
    }

    return new Response('File not found', { status: 404 });
};

/**
 * Adjusts the credits of a user based on the provided amount.
 *
 * @param {Request} req - The request object containing the user's token.
 * @param {number} amount - The amount of credits to adjust.
 * @return {boolean} True if the credits were successfully adjusted, false otherwise.
 */
const adjustCredits = (req: Request, amount: number): boolean => {
    const token = serve.getCookie(req, 'token');

    if (token != '') {
        if (DbHelper.tokenExists(db, token)) {
            DbHelper.adjustCredits(db, token, amount);
            return true;
        }
    }
    return false;
};

/**
 * Checks if a user has sufficient credits.
 *
 * @param {Request} req - The request object containing the user's token.
 * @param {number} amount - The amount of credits required.
 * @return {boolean} True if the user has sufficient credits, false otherwise.
 */
const hasCredits = (req: Request, amount: number): boolean => {
    const token = serve.getCookie(req, 'token');

    if (token != '') {
        if (DbHelper.tokenExists(db, token)) {
            const user = DbHelper.getUserByToken(db, token);
            if (user && user.credits && user.credits >= amount) {
                return true;
            }
        }
    }
    return false;
};

/**
 * Creates a JSON response with a given result and optional extra data. ******
 *
 * @param {string} result - The main result to be sent in the response.
 * @param {Record<string, string>} extra - Optional extra data to be included in the response.
 * @return {Response} A JSON response with the result and extra data.
 */
const jsonResponse = (
    result: string,
    extra: Record<string, string> = {}
): Response => {
    const sendMessage = { text: result };
    const finalMessage = JSON.stringify({ ...sendMessage, ...extra });

    return new Response(finalMessage, {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
};

//--[ Endpoints ]--------------------------------------------------------------

const createUserEndpoint = async (req: Request) => {
    let form: Credentials = await req.json();
    let res: Response;

    let token =
        crypto.randomUUID() +
        '-' +
        crypto.randomUUID() +
        '-' +
        crypto.randomUUID();

    if (!DbHelper.userExists(db, form.email)) {
        await DbHelper.createUser(db, {
            email: form.email,
            password: form.password,
            creation: new Date(),
            token: token,
            credits: 20,
        });

        res = jsonResponse('success', { redirect: '/app' });
        res = serve.setCookie(res, 'token', token, {
            maxAge: 86400,
            httpOnly: true,
        });
        return res;
    }

    return jsonResponse('fail');
};

const addCreditsEndpoint = async (req: Request): Promise<Response> => {
    let token: string = serve.getCookie(req, 'token');
    let res: Response;

    if (token != '') {
        DbHelper.adjustCredits(db, token, 20);

        res = jsonResponse('success', { redirect: '/app/success.html' });
        return res;
    }
    return jsonResponse('fail');
};

const logonEndpoint = async (req: Request): Promise<Response> => {
    let form: Credentials = await req.json();
    let res: Response;

    if ((await DbHelper.validateUser(db, form)) === true) {
        let token =
            crypto.randomUUID() +
            '-' +
            crypto.randomUUID() +
            '-' +
            crypto.randomUUID();
        DbHelper.updateUserToken(db, token, form.email);

        res = jsonResponse('success', { redirect: '/app' });
        res = serve.setCookie(res, 'token', token, {
            maxAge: 86400,
            httpOnly: true,
        });
        return res;
    }
    return jsonResponse('fail');
};

const generateImageEndpoint = async (req: Request): Promise<Response> => {
    let form: ImageGenerationParams = await req.json();
    let token: string = serve.getCookie(req, 'token');

    if (token != '') {
        const user = DbHelper.getUserByToken(db, token);
        if (user) {
            console.log(`Generate request from ${user.email}`);
        }

        console.log(JSON.stringify(form, null, 5));
        console.log();

        if (hasCredits(req, 1)) {
            if (adjustCredits(req, -1)) {
                const result = await runJob(form);
                if (result) {
                    return jsonResponse('success', { image: result });
                } else {
                    adjustCredits(req, +1);
                    return jsonResponse('fail', {
                        redirect: '/app/error.html',
                    });
                }
            }
        }
        return jsonResponse('fail', { redirect: '/app/nocredits.html' });
    }
    return jsonResponse('fail', { message: 'Unauthorized' });
};

//--[ Start the server ]-------------------------------------------------------

const main = async () => {
    await initDb();

    const server = serve({
        hostname: Bun.env.HOSTNAME || 'localhost',
        port: Bun.env.PORT || 3000,

        async fetch(req: Request) {
            const route = new Route(req.url);
            const router: RouteResult = route.route();
            const command: string = `${req.method} ${router.url}`;

            // Restrict endpoints to json only requests
            if (req.headers.get('Content-Type') == 'application/json') {
                if (command == 'POST login/index.html')
                    return await logonEndpoint(req);

                if (command == 'POST create/index.html')
                    return await createUserEndpoint(req);

                if (command == 'POST addcredits/index.html')
                    return await addCreditsEndpoint(req);

                if (command == 'POST data/index.html')
                    return await generateImageEndpoint(req);
            }

            //--[ If they are all ready authenticated redirect to app ]------------

            if (command == 'GET public/index.html') {
                const token = serve.getCookie(req, 'token');

                if (token != '' && DbHelper.tokenExists(db, token))
                    return Response.redirect('/app');
            }

            //--[ Serve Web Page ]---------------------------------------------

            const htmlResponse = await serveHTML(router.path);

            if (htmlResponse.status === 404)
                return Response.redirect('/404.html');

            // Check if they are authenticated to access the secure path
            if (router.route == 'app') {
                let token: string = serve.getCookie(req, 'token');

                if (token == '' || !DbHelper.tokenExists(db, token))
                    return Response.redirect('/expired.html');
            }
            return htmlResponse;
        },
    });

    console.log();
    console.log(`Server running on ${server.url}`);
    console.log('Press Ctrl-C to exit');

    //--[ Launch a browser ]-------------------------------------------------------

    var start =
        process.platform == 'darwin'
            ? 'open'
            : process.platform == 'win32'
              ? 'start'
              : 'xdg-open';
    require('child_process').exec(`${start} ${server.url}`);
};

main();

// TODO: CLI interface
