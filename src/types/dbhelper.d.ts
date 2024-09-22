interface User {
    id: number
    email: string
    password: string
    creation: Date | null
    credits: number | null
}

interface credentials {
	email: string
	password: string
}