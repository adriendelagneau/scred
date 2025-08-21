"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  // FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/auth-client";

import SocialButton from "./social-button";
import FormError from "../form-error";

// Zod schema for magic link sign-in
const MagicLinkSignInSchema = z.object({
  email: z.email().min(1, "Must be a valid email"),
});

type MagicLinkSignInSchemaType = z.infer<typeof MagicLinkSignInSchema>;

export const SignInView = () => {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<MagicLinkSignInSchemaType>({
    resolver: zodResolver(MagicLinkSignInSchema),
    defaultValues: { email: "" },
  });

  const loading = form.formState.isSubmitting;

  const onSubmit = async (values: MagicLinkSignInSchemaType) => {
    setError(null); // clear previous errors

    try {
      await authClient.signIn.magicLink(
        { email: values.email },
        {
          onSuccess: () => {
            toast("A magic link has been sent to your email.");
          },
          onError: (ctx) => {
            setError(ctx.error.message || "Failed to send magic link.");
          },
        }
      );
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    }
  };

  const handleSignInWithProvider = async (provider: "google" | "github") => {
    setError(null);

    try {
      await authClient.signIn.social(
        { provider },
        {
          onSuccess: async () => {
            router.push("/");
            router.refresh();
          },
          onError: (ctx) => {
            console.log("Error:", ctx);
            setError("Something went wrong");
          },
        }
      );
    } catch (err) {
      console.error(err);
      setError("Sign-in failed. Please try again.");
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md p-6">
      <Form {...form}>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                {/* <FormLabel>Email</FormLabel> */}
                <FormControl>
                  <div className="relative">
                    <MailIcon className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                    <Input
                      type="email"
                      disabled={loading}
                      placeholder="Adresse email"
                      className="pl-12"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormError message={error} />

          <Button disabled={loading} type="submit" className="w-full">
            Envoyez un mail
          </Button>

          <div className="text-muted-foreground flex w-full items-center py-5 text-sm">
            <div className="border-secondary-foreground flex-grow border-t" />
            <span className="mx-2 text-lg">ou</span>
            <div className="border-secondary-foreground flex-grow border-t" />
          </div>

          <div className="mt-4">
            <SocialButton
              provider="google"
              icon={<FcGoogle size={"22"} />}
              label="continuer avec Google"
              onClick={() => handleSignInWithProvider("google")}
              disabled={loading}
            />
            <SocialButton
              provider="github"
              icon={<FaGithub size={"22"} />}
              label="continuer avec GitHub"
              onClick={() => handleSignInWithProvider("github")}
              disabled={loading}
            />
          </div>
        </form>
      </Form>
    </Card>
  );
};
