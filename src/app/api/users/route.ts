import { NextResponse } from "next/server";

import { getUser } from "@/lib/auth/auth-session";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const users = await db.user.findMany({
      where: {
        // Exclude the current user from the list
        id: { not: currentUser.id },
      },
      select: {
        id: true,
        name: true,
        email: true,
        isOnline: true,
        identityKey: {
          select: {
            publicKey: true,
          },
        },
      },
    });

    // We only want to show users who have set up their identity key
    const usersWithKeys = users.filter(u => u.identityKey);

    return NextResponse.json(usersWithKeys);

  } catch (error) {
    console.error("[USERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
