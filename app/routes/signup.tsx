import type { Route } from "./+types/signup";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useState, useEffect, useRef } from "react";
import { Form, redirect, useActionData, Link, useLoaderData } from "react-router";
import { registerUser, authenticateWithGoogle } from "~/lib/api";
import { getAuthToken, setAuthCookies } from "~/lib/auth.server";

declare global {
  interface Window {
    google?: any;
  }
}

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

  // Extract invite parameters from URL if present
  const url = new URL(request.url);
  const inviteId = url.searchParams.get("inviteId");
  const inviteToken = url.searchParams.get("inviteToken");

  return {
    inviteId,
    inviteToken,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = (formData.get("intent") as string) ?? "signup";

  // Get invite parameters
  const inviteId = formData.get("inviteId") as string | null;
  const inviteToken = formData.get("inviteToken") as string | null;

  // Handle Google OAuth authentication
  if (intent === "google-auth") {
    const googleToken = formData.get("googleToken") as string;
    const googleUserId = formData.get("googleUserId") as string;

    if (!googleToken || !googleUserId) {
      return {
        error: "Google authentication failed. Missing credentials.",
      };
    }

    // Set auth cookies
    const cookies = await setAuthCookies(googleToken, googleUserId);

    // Redirect to invite page if invite params exist, otherwise go to home
    const redirectUrl = inviteId && inviteToken
      ? `/projects/invite/${inviteId}?token=${inviteToken}`
      : "/";

    return redirect(redirectUrl, {
      headers: [
        ["Set-Cookie", cookies[0]],
        ["Set-Cookie", cookies[1]],
      ],
    });
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const company = formData.get("company") as string;
  const timezone = formData.get("timezone") as string;

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
    await registerUser({ name, email, password, company, timezone, inviteId, inviteToken });

    // If invite params exist, redirect to login with those params
    if (inviteId && inviteToken) {
      return redirect(`/login?registered=true&inviteId=${inviteId}&inviteToken=${inviteToken}`);
    }

    // Otherwise, redirect to login page with success message
    return redirect("/login?registered=true");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export default function Signup() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timezone, setTimezone] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google && googleButtonRef.current) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });

        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          {
            theme: 'outline',
            size: 'large',
            width: googleButtonRef.current.offsetWidth,
            text: 'signup_with',
          }
        );
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleGoogleResponse = async (response: any) => {
    setGoogleLoading(true);
    setGoogleError(null);

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Call our backend API
      const authResponse = await authenticateWithGoogle(response.credential, timezone);

      // Set auth cookies using a form submission to trigger the action
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/signup';

      const tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'googleToken';
      tokenInput.value = authResponse.token;
      form.appendChild(tokenInput);

      const userIdInput = document.createElement('input');
      userIdInput.type = 'hidden';
      userIdInput.name = 'googleUserId';
      userIdInput.value = authResponse.userId;
      form.appendChild(userIdInput);

      const intentInput = document.createElement('input');
      intentInput.type = 'hidden';
      intentInput.name = 'intent';
      intentInput.value = 'google-auth';
      form.appendChild(intentInput);

      // Add invite params if they exist
      if (loaderData?.inviteId) {
        const inviteIdInput = document.createElement('input');
        inviteIdInput.type = 'hidden';
        inviteIdInput.name = 'inviteId';
        inviteIdInput.value = loaderData.inviteId;
        form.appendChild(inviteIdInput);
      }

      if (loaderData?.inviteToken) {
        const inviteTokenInput = document.createElement('input');
        inviteTokenInput.type = 'hidden';
        inviteTokenInput.name = 'inviteToken';
        inviteTokenInput.value = loaderData.inviteToken;
        form.appendChild(inviteTokenInput);
      }

      document.body.appendChild(form);
      form.submit();

    } catch (error) {
      console.error('Google signup error:', error);
      setGoogleError(error instanceof Error ? error.message : 'Failed to sign up with Google');
      setGoogleLoading(false);
    }
  };

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
            {/* Hidden fields for invite parameters */}
            {loaderData?.inviteId && (
              <input type="hidden" name="inviteId" value={loaderData.inviteId} />
            )}
            {loaderData?.inviteToken && (
              <input type="hidden" name="inviteToken" value={loaderData.inviteToken} />
            )}
            <input type="hidden" name="timezone" value={timezone} />
            <CardContent className="space-y-4">
              {/* Google Sign Up Button */}
              {googleError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {googleError}
                </div>
              )}
              <div ref={googleButtonRef} className="w-full" style={{ minHeight: '40px' }}>
                {/* Google button will be rendered here */}
              </div>
              {googleLoading && (
                <div className="text-center text-sm text-neutral">
                  Signing up with Google...
                </div>
              )}

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

