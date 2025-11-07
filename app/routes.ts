import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/login", "routes/login.tsx"),
  route("/logout", "routes/logout.tsx"),
  route("/project/:projectId", "routes/project.$projectId.tsx"),
  route("/project/:projectId/logs/:logId", "routes/project.$projectId.logs.$logId.tsx"),
] satisfies RouteConfig;
