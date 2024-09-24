interface User {
  id: number;
  email: string;
  password: string;
  creation: Date | null;
  token: string | null;
  credits: number | null;
}

interface Credentials {
  email: string;
  password: string;
}

interface DbHelper {
  createTable(db: Database): boolean;
  tableExists(db: Database, tableName: string): boolean;
  userExists(db: Database, email: string): boolean;
  getUser(db: Database, email: string): User | null;
  getUserByToken(db: Database, token: string): User | null;
  createUser(db: Database, data: Omit<User, "id">): Promise<boolean>;
  validateUser(db: Database, data: Credentials): Promise<boolean>;
  updateUserToken(db: Database, token: string, email: string): boolean;
  tokenExists(db: Database, token: string): boolean;
  adjustCredits(db: Database, token: string, amount: number): boolean;
}