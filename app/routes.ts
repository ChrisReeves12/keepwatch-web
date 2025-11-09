import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/login", "routes/login.tsx"),
  route("/signup", "routes/signup.tsx"),
  route("/logout", "routes/logout.tsx"),
  route("/account/settings", "routes/account.settings.tsx"),
  route("/project/:projectId", "routes/project.$projectId.tsx"),
  route("/project/:projectId/logs/:logId", "routes/project.$projectId.logs.$logId.tsx"),
] satisfies RouteConfig;
