import bcrypt from "bcryptjs";

export async function hashPassword(password: string) {
  const rounds = Number(process.env.AUTH_SALT_ROUNDS ?? "10");
  return bcrypt.hash(password, rounds);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
