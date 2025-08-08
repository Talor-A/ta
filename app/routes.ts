import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("test", "routes/test.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  route("setup", "routes/setup.tsx"),
  route("api/auth/*", "routes/api.auth.$.tsx"),
  route("blog", "routes/blog.tsx"),
  route("blog/drafts", "routes/blog.drafts.tsx"),
  route("blog/edit", "routes/blog.edit.tsx"),
  route("blog/:slug", "routes/blog.$slug.tsx"),
] satisfies RouteConfig;
