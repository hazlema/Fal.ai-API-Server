import { createReadStream } from "node:fs"
import { createInterface } from "node:readline"
import { Readable } from "node:stream"
import type { BunFile } from "bun"

//--[ Read .env files ]--------------------------------------------------------

export const env = async (envPath: string = ".env"): Promise<void> => {
    const file: BunFile = Bun.file(envPath)

    if (file.name && (await file.exists())) {
        const fileStream: Readable = createReadStream(file.name)

        const rl = createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        })

        for await (const line of rl) {
            if (line.startsWith("#") || line.trim() === "") continue

            if (line.includes("=")) {
                let [key, ...valueParts] = line.split("=")
                let value = valueParts.join("=").trim()

                key = key.trim()

                Object.keys(process.env).forEach((envKey) => {
                    if (process.env[envKey]) {
                        const placeholder: string = "$" + envKey

                        if (value.includes(placeholder)) {
                            value = value.replace(placeholder, process.env[envKey] as string)
                        }
                    }
                })

                if (key && value) {
                    process.env[key] = value
                }
            }
        }
    }
}
