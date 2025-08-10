import { requireAuth } from "~/lib/auth-utils";
import type { Route } from "./+types/blog.new";
import { blogPosts } from "~/database/schema";
import { redirect } from "react-router";

export async function loader({ context, request }: Route.LoaderArgs) {
  await requireAuth(request);

  const newPost = await context.db
    .insert(blogPosts)
    .values({
      slug: `draft-${Date.now()}`,
      title: "",
      body: "",
      publishedDate: null,
    })
    .returning({ id: blogPosts.id })
    .get();

  throw redirect(`/blog/${newPost.id}/edit`);
}

export default function BlogNew() {
  return null; // This component is not rendered, as the loader redirects
}
