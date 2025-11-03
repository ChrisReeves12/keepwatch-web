import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { clearAuthCookie } from "~/lib/auth.server";

export async function action({ request }: Route.ActionArgs) {
  return redirect("/", {
    headers: {
      "Set-Cookie": clearAuthCookie(),
    },
  });
}

export async function loader() {
  // If someone navigates to /logout directly, redirect to home
  return redirect("/");
}

