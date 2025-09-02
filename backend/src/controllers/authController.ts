import { db } from "@/db/db.js";
import { users } from "@/schemas/schema.js";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { generateAndSetToken } from "@/utils/utils.js";
import { eq } from "drizzle-orm";
export const signup = async (req: Request, res: Response) => {
  const { username, password, email } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Please provide username and password" });
  }
  const existingUser = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.email, email));
  if (existingUser.length > 0)
    return res.status(400).json({ message: "User already exists" });
  const hashPassword = bcrypt.hashSync(password, 12);

  const [newUser] = await db
    .insert(users)
    .values({
      id : crypto.randomUUID(),
      fullName: username,
      email,
      password: hashPassword,
    })
    .returning({ id: users.id, fullName: users.fullName });

  console.log(`creating user ${username}`);
  generateAndSetToken(newUser.id, res);
  res.status(201).json({ message: "User registered successfully", username });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password and email" });
  }

  const user = await db.select().from(users).where(eq(users.email, email));

  if (user.length === 0) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const isPasswordValid = bcrypt.compareSync(password, user[0].password);

  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateAndSetToken(user[0].id, res);
  res
    .status(200)
    .json({
      message: "User logged in successfully",
      token: token,
      username: user[0].email,
    });
};

export const logout = async (_req: Request, res: Response) => {
  try {
    res.clearCookie("chatappcookie");
    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.log("Error while logging out", (error as Error).message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const checkAuth = (_req: any, res: any) => {
  try {
    res.status(200).json(res.locals.user);
  } catch (error) {
    console.log("Error while checking auth", (error as Error).message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
