import jwt from "jsonwebtoken";
import { users as User } from "@/schemas/schema.js";
import { db } from "@/db/db.js";
import { eq } from "drizzle-orm";

export const protectedRoutes = async (req: any, res: any, next: any) => {
  try {
    const token = req.cookies.chatappcookie;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized, token missing" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
    };

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: "Unauthorized, invalid token" });
    }
    const foundUser = await db
      .select({
        id: User.id,
        fullName: User.fullName,
        email: User.email,
        createdAt: User.createdAt,
      })
      .from(User) 
      .where(eq(User.id, decoded.userId))
      .limit(1);

    if (!foundUser) {
      return res.status(401).json({ message: "User not found" });
    }

    res.locals.user = foundUser;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
