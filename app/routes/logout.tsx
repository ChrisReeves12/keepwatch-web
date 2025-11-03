import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { clearAuthCookies } from "~/lib/auth.server";

export async function action({ request }: Route.ActionArgs) {
  const cookies = clearAuthCookies();
  return redirect("/", {
    headers: [
      ["Set-Cookie", cookies[0]],
      ["Set-Cookie", cookies[1]],
    ],
  });
}

export async function loader() {
  // If someone navigates to /logout directly, redirect to home
  return redirect("/");
}

