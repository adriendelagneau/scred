import { NextResponse } from "next/server";

import { getUser } from "@/lib/auth/auth-session";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { publicKey } = body;

    if (!publicKey) {
      return new NextResponse("Public key is required", { status: 400 });
    }

    // Check if a key already exists for this user
    const existingKey = await db.identityKey.findUnique({
      where: { userId: user.id },
    });

    if (existingKey) {
      return new NextResponse("User already has an identity key", {
        status: 409,
      });
    }

    // Store the new public key
    await db.identityKey.create({
      data: {
        userId: user.id,
        publicKey: publicKey,
      },
    });

    return new NextResponse("Public key stored successfully", { status: 201 });
  } catch (error) {
    console.error("[KEYS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
