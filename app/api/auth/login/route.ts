import { NextResponse } from "next/server";
import { z } from "zod";
import { findUserByITS } from "@/lib/users";
import {
  createSessionToken,
  getSessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

const loginSchema = z.object({
  its: z.coerce.number().int().positive(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { its, password } = parsed.data;
  const user = await findUserByITS(its);

  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSessionToken({
    id: user._id.toString(),
    its: user.its,
    role: user.role,
    name: user.name,
  });

  const response = NextResponse.json({
    user: {
      id: user._id.toString(),
      its: user.its,
      role: user.role,
      name: user.name,
    },
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
  return response;
}
