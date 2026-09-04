export type DbUser = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

export async function getUserByOpenId(_openId: string): Promise<DbUser | undefined> {
  return undefined;
}

export async function upsertUser(_user: Partial<DbUser> & { openId: string }): Promise<void> {
  // No-op: autenticação Manus não está habilitada. App opera sem login.
}
