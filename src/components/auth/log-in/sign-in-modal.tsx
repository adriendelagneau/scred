"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { authClient } from "@/lib/auth/auth-client";

import { SignInView } from "./sign-in-view";

export const SignInModal = () => {
  const { data: session, isPending } = authClient.useSession();

  // Wait until session state settles
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    if (!isPending) {
      setSessionReady(true);
    }
  }, [isPending]);

  // Don't render anything until session is loaded
  if (!sessionReady || session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card w-full max-w-md rounded-lg p-6 shadow-lg">
        <h2 className="mb-4 text-center text-xl font-semibold">
          Connexion ou Inscription
        </h2>

        <SignInView />

        <p className="text-muted-foreground mt-4 text-center text-xs">
          En continuant, vous acceptez notre{" "}
          <Link href="/legal" className="cursor-pointer hover:underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </div>
    </div>
  );
};
