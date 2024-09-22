import { Database } from "bun:sqlite"

export default class dbHelper {

	//--[ Create Table }--------------------------------------------------------

	static createTable = (db: Database) => {
		const query = `CREATE TABLE users (
			id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
			email TEXT NOT NULL,
			password TEXT NOT NULL,
			creation NUMERIC,
			credits INTEGER);`;

			db.run(query)
	}

	//--[ Table Exists }-------------------------------------------------------

	static tableExists = (db: Database, tableName: string): boolean => {
		try {
			db.query(`SELECT * FROM ${tableName} LIMIT 1;`).all()
			return true;
		} catch (e) {
			return false
		}
	}

	//--[ User Exists }--------------------------------------------------------

	static userExists = (db: Database, email: string): boolean => {
		try {
			const count = db.query(`SELECT * FROM users WHERE email like ?;`).all(email).length
			return count > 0;
		} catch (e) {
			return false
		}
	}
	
	//--[ Get User }--------------------------------------------------------

	static getUser = (db: Database, email: string): User | null => {
		try {
			const user: User = db.query(`SELECT * FROM users WHERE email like ?;`).all(email)[0] as User
			return user
		} catch (e) {
			return null
		}
	}


	//--[ Create User }--------------------------------------------------------

	static createUser = async(db: Database, data: Omit<User, "id">) => {
		const query = `INSERT INTO users 
			(email, password, creation, credits) 
			VALUES(?, ?, ?, ?);`;

		data.password = await Bun.password.hash(data.password)
	
		db.prepare(query).run(
			data.email, 
			data.password, 
			data.creation ? data.creation.toISOString() : null, 
			data.credits
		)
	}

	static validateUser = async(db: Database, data: credentials) : Promise<boolean> => {
		const user = dbHelper.getUser(db, data.email)

		if (user) {
			return await Bun.password.verify(data.password, user.password)
		}
		return false
	}
}

