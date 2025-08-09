import type { Route } from "./+types/blog";
import { blogPosts } from "../../database/schema";
import { isNotNull } from "drizzle-orm";
import { getOptionalAuth } from "../lib/auth-utils";

export async function loader({ context, request }: Route.LoaderArgs) {
  // Check if user is authenticated (optional)
  const session = await getOptionalAuth(request);
  const posts = await context.db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      publishedDate: blogPosts.publishedDate,
    })
    .from(blogPosts)
    .where(isNotNull(blogPosts.publishedDate))
    .orderBy(blogPosts.publishedDate);

  return { posts, session };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Blog - Talor Anderson" },
    {
      name: "description",
      content:
        "Thoughts on AI, fullstack development, and engineering culture.",
    },
  ];
}

export default function Blog({ loaderData }: Route.ComponentProps) {
  const { posts, session } = loaderData;

  return (
    <main>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1>Blog</h1>
          <p>Thoughts on AI, fullstack development, and engineering culture.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {session ? (
            <>
              <span style={{ fontSize: "14px", color: "#666" }}>
                Welcome, {session.user.name}
              </span>
              <ul>
                <li>
                  <a href="/blog/drafts">Drafts</a>
                </li>
                <li>
                  <a href="/blog/edit">New Post</a>
                </li>
                <li>
                  <a href="/logout">Sign Out</a>
                </li>
              </ul>
            </>
          ) : null}
        </div>
      </div>

      {posts.length > 0 ? (
        <div>
          {posts.map((post) => (
            <article
              key={post.id}
              style={{
                marginBottom: "30px",
                paddingBottom: "20px",
                borderBottom: "1px solid #eee",
              }}
            >
              <h2>
                <a
                  href={`/blog/${post.slug}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {post.title}
                </a>
              </h2>
              <time style={{ color: "#666", fontSize: "0.9em" }}>
                {post.publishedDate
                  ? new Date(post.publishedDate * 1000).toLocaleDateString()
                  : ""}
              </time>
            </article>
          ))}
        </div>
      ) : (
        <p>No published posts yet.</p>
      )}
    </main>
  );
}
