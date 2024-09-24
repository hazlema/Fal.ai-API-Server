interface FalAIImage {
    url: string
    width: number
    height: number
    content_type: string
}

interface FalAITimings {
    inference: number
    // You can add more timing properties here if needed
}

interface FalAIResponse {
    images: FalAIImage[]
    timings: FalAITimings
    seed: number
    has_nsfw_concepts: boolean[]
    prompt: string
}

type ImageSize = "square" | "square_hd" | "portrait_4_3" | "portrait_16_9" | "landscape_4_3" | "landscape_16_9"

type ImageGenerationParams = {
    prompt: string
    steps: number
    image_size: ImageSize
    seed: number
    guidance: number
}

interface RouteResult {
    route: string
    file: string
    url: string
    path: string
}
