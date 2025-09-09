import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("test", "routes/test.tsx"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("logout", "routes/logout.tsx"),
  route("api/auth/*", "routes/api.auth.$.tsx"),
  route("api/upload-image", "routes/api.upload-image.tsx"),
  route("api/images/:filename", "routes/api.images.$filename.tsx"),
  route("blog", "routes/blog.tsx"),
  route("blog/drafts", "routes/blog.drafts.tsx"),
  route("blog/new", "routes/blog.new.tsx"),
  route("blog/:id/edit", "routes/blog.$id.edit.tsx"),
  route("blog/:slug", "routes/blog.$slug.tsx"),
  route("rss.xml", "routes/rss.xml.tsx"),
] satisfies RouteConfig;
