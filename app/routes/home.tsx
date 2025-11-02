import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { requireAuth } from "~/lib/auth.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

// Protect this route - redirects to /login if not authenticated
export async function loader({ request }: Route.LoaderArgs) {
  const token = requireAuth(request);
  // Token is available here if you need to make authenticated API calls
  return { token };
}

export default function Home() {
  return <Welcome />;
}
