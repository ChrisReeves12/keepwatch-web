import type { Route } from "./+types/signup";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useState } from "react";
import { Form, redirect, useActionData, Link } from "react-router";
import { registerUser } from "~/lib/api";
import { getAuthToken } from "~/lib/auth.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign Up - KeepWatch" },
    { name: "description", content: "Create your KeepWatch account" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  // If user is already logged in, redirect to home
  const token = getAuthToken(request);
  if (token) {
    throw redirect("/");
  }
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const company = formData.get("company") as string;

  // Validate passwords match
  if (password !== confirmPassword) {
    return {
      error: "Passwords do not match",
    };
  }

  // Validate password length
  if (password.length < 8) {
    return {
      error: "Password must be at least 8 characters long",
    };
  }

  try {
    await registerUser({ name, email, password, company });

    // Redirect to login page with success message
    return redirect("/login?registered=true");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export default function Signup() {
  const actionData = useActionData<typeof action>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary-dark via-[#002865] to-brand p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            KeepWatch
          </h1>
          <p className="text-white/80">
            Monitor your systems with confidence
          </p>
        </div>

        {/* Signup Card */}
        <Card className="shadow-xl border-brand/20 bg-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-brand">Create an account</CardTitle>
            <CardDescription className="text-neutral">
              Get started with KeepWatch for free
            </CardDescription>
          </CardHeader>
          <Form method="post">
            <CardContent className="space-y-4">
              {/* Google Sign Up Button */}
              <Button
                variant="outline"
                className="w-full"
                type="button"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign up with Google
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-neutral/30" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-neutral">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {actionData?.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {actionData.error}
                </div>
              )}

              {/* Name Input */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-primary-dark">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  className="border-neutral/30 focus-visible:ring-brand text-black"
                />
              </div>

              {/* Email Input */}
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

              {/* Company Input */}
              <div className="space-y-2">
                <Label htmlFor="company" className="text-primary-dark">Company</Label>
                <Input
                  id="company"
                  name="company"
                  type="text"
                  placeholder="Acme Corp"
                  required
                  className="border-neutral/30 focus-visible:ring-brand text-black"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-primary-dark">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    minLength={8}
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
                <p className="text-xs text-neutral">Must be at least 8 characters</p>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-primary-dark">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    minLength={8}
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

              {/* Sign Up Button */}
              <Button
                type="submit"
                className="w-full bg-brand hover:bg-brand/90 text-white"
                size="lg"
              >
                Create Account
              </Button>
            </CardContent>
          </Form>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-neutral">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-brand hover:text-accent underline-offset-4 hover:underline transition-colors"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-white/70 mt-8">
          By signing up, you agree to our{" "}
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

