import type { Route } from "./+types/forgot-password";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useMemo, useState } from "react";
import { Form, redirect, useActionData, Link } from "react-router";
import { forgotPassword, resetPassword } from "~/lib/api";
import { getAuthToken } from "~/lib/auth.server";
import moment from "moment";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Forgot Password - KeepWatch" },
    { name: "description", content: "Reset your KeepWatch account password" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const token = getAuthToken(request);
  if (token) {
    throw redirect("/");
  }
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = (formData.get("intent") as string) ?? "request-reset";
  const email = formData.get("email") as string;

  if (!email) {
    return {
      error: "Email is required.",
    };
  }

  if (intent === "request-reset") {
    try {
      await forgotPassword(email);
      return {
        codeSent: true,
        email,
      };
    } catch (error) {
      return {
        codeSent: true,
        email,
      };
    }
  }

  if (intent === "reset-password") {
    const code = (formData.get("code") as string)?.trim();
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!code) {
      return {
        error: "Please enter the 6-digit verification code.",
        codeSent: true,
        email,
      };
    }

    if (!newPassword) {
      return {
        error: "Please enter a new password.",
        codeSent: true,
        email,
      };
    }

    if (newPassword !== confirmPassword) {
      return {
        error: "Passwords do not match.",
        codeSent: true,
        email,
      };
    }

    try {
      await resetPassword({ email, code, newPassword });
      return redirect("/login?reset=success");
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        codeSent: true,
        email,
      };
    }
  }

  return {
    error: "Invalid request.",
  };
}

export default function ForgotPassword() {
  const actionData = useActionData<typeof action>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const codeSent = actionData?.codeSent;
  const emailForReset = actionData?.email;
  const codeExpiresAt = useMemo(() => moment().add(15, "minutes").format("h:mm A"), []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary-dark via-[#002865] to-brand p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            KeepWatch
          </h1>
          <p className="text-white/80">
            Monitor your systems with confidence
          </p>
        </div>

        <Card className="shadow-xl border-brand/20 bg-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-brand">
              {codeSent ? "Reset Your Password" : "Forgot Password"}
            </CardTitle>
            <CardDescription className="text-neutral">
              {codeSent
                ? "Enter the verification code and your new password"
                : "Enter your email address and we'll send you a verification code"}
            </CardDescription>
          </CardHeader>

          {!codeSent && (
            <Form method="post">
              <input type="hidden" name="intent" value="request-reset" />
              <CardContent className="space-y-4">
                {actionData?.error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {actionData.error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-primary-dark">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    className="border-neutral/30 focus-visible:ring-brand text-black"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-brand hover:bg-brand/90 text-white"
                  size="lg"
                >
                  Send Verification Code
                </Button>
              </CardContent>
            </Form>
          )}

          {codeSent && (
            <Form method="post" replace>
              <input type="hidden" name="intent" value="reset-password" />
              <input type="hidden" name="email" value={emailForReset ?? ""} />
              <CardContent className="space-y-4">
                {actionData?.error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {actionData.error}
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
                  <p>
                    We sent a 6-digit verification code to <strong>{emailForReset}</strong>. 
                    This code expires at {codeExpiresAt}.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code" className="text-primary-dark">Verification Code</Label>
                  <Input
                    id="code"
                    name="code"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="123456"
                    required
                    className="border-neutral/30 focus-visible:ring-brand text-black tracking-widest text-center"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-primary-dark">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      className="pr-10 border-neutral/30 focus-visible:ring-brand text-black"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral hover:text-brand transition-colors"
                    >
                      {showPassword ? (
                        <AiOutlineEyeInvisible className="h-4 w-4" />
                      ) : (
                        <AiOutlineEye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-primary-dark">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      className="pr-10 border-neutral/30 focus-visible:ring-brand text-black"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral hover:text-brand transition-colors"
                    >
                      {showConfirmPassword ? (
                        <AiOutlineEyeInvisible className="h-4 w-4" />
                      ) : (
                        <AiOutlineEye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-brand hover:bg-brand/90 text-white"
                  size="lg"
                >
                  Reset Password
                </Button>
              </CardContent>
            </Form>
          )}

          <CardFooter className="flex justify-center">
            <p className="text-sm text-neutral">
              Remember your password?{" "}
              <Link
                to="/login"
                className="font-medium text-brand hover:text-accent underline-offset-4 hover:underline transition-colors"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-white/70 mt-8">
          By using KeepWatch, you agree to our{" "}
          <a href="#" className="text-white/90 underline-offset-4 hover:underline hover:text-accent transition-colors">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-white/90 underline-offset-4 hover:underline hover:text-accent transition-colors">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
