import { Database } from "bun:sqlite"

export default class DbHelper {

	//--[ Create Table ]-------------------------------------------------------

    static createTable = (db: Database): boolean => {
		try {
			const query = `CREATE TABLE users (
				id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
				email TEXT NOT NULL,
				password TEXT NOT NULL,
				creation NUMERIC,
				token TEXT,
				credits INTEGER);`

			db.run(query)
			return true
		} catch (e) {
			console.log(e)
			return false
		}
    }

    //--[ Table Exists ]-------------------------------------------------------

    static tableExists = (db: Database, tableName: string): boolean => {
        try {
            db.query(`SELECT * FROM ${tableName} LIMIT 1;`).all()
            return true
        } catch (e) {
            return false
        }
    }

    //--[ User Exists ]--------------------------------------------------------

    static userExists = (db: Database, email: string): boolean => {
        try {
            const count = db.query(`SELECT * FROM users WHERE email like ?;`).all(email).length
            return count > 0
        } catch (e) {
            return false
        }
    }

    //--[ Get User ]--------------------------------------------------------

    static getUser = (db: Database, email: string): User | null => {
        try {
            const user: User = db.query(`SELECT * FROM users WHERE email like ?;`).all(email)[0] as User
            return user
        } catch (e) {
            return null
        }
    }

    //--[ Get User, but by token ]---------------------------------------------

	static getUserByToken = (db: Database, token: string): User | null => {
        try {
            const user: User = db.query(`SELECT * FROM users WHERE token = ?;`).all(token)[0] as User
            return user
        } catch (e) {
            return null
        }
    }

    //--[ Create User ]--------------------------------------------------------

    static createUser = async (db: Database, data: Omit<User, "id">): Promise<boolean> => {
        try {
			const query = `INSERT INTO users 
				(email, password, creation, token, credits) 
				VALUES(?, ?, ?, ?, ?);`

			data.password = await Bun.password.hash(data.password)

			db.prepare(query).run(data.email, data.password, data.creation ? data.creation.toISOString() : null, data.token, data.credits)
			return true
		} catch (e) {
			return false
		}
    }

    //--[ Validate User ]------------------------------------------------------

	static validateUser = async (db: Database, data: Credentials): Promise<boolean> => {
        try {
			const user = DbHelper.getUser(db, data.email)

			if (user) {
				return await Bun.password.verify(data.password, user.password)
			}
			return false
		} catch (e) {
			return false
		}
    }

    //--[ Update the Users Token ]---------------------------------------------

	static updateUserToken = (db: Database, token: string, email: string): boolean => {
        try {
			db.prepare(`UPDATE users SET token = ? WHERE email = ?;`).run(token, email)
			return true
		} catch (e) {
			return false
		}
    }

    //--[ User has a valid token ]---------------------------------------------

	static tokenExists = (db: Database, token: string): boolean => {
        try {
            const count = db.query(`SELECT * FROM users WHERE token like ?;`).all(token).length
            return count > 0

		} catch (e) {
            return false
        }
    }

    //--[ Adjust the Users Credits ]-------------------------------------------

	static adjustCredits = (db: Database, token: string, amount: number): boolean => {
        try {
			const user = DbHelper.getUserByToken(db, token)

			if (user) {
				amount = user.credits ? amount = user.credits + amount :amount = 0 + amount
				db.prepare(`UPDATE users SET credits = ? WHERE token = ?;`).run(amount, token)
				return true;
			}
            return false
        } catch (e) {
            return false
        }
    }
}
