import type { Route } from "./+types/blog";
import { blogPosts } from "../../database/schema";
import { isNotNull } from "drizzle-orm";
import { getOptionalAuth } from "../../lib/auth-utils";

export async function loader({ context, request }: Route.LoaderArgs) {
  // Check if user is authenticated (optional)
  const session = await getOptionalAuth(request, context.db);
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
      content: "Thoughts and writings on AI, engineering, and technology",
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
          <p>Thoughts and writings on AI, engineering, and technology</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {session ? (
            <>
              <span style={{ fontSize: "14px", color: "#666" }}>
                Welcome, {session.user.name}
              </span>
              <a
                href="/blog/drafts"
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#f8f9fa",
                  color: "#495057",
                  textDecoration: "none",
                  borderRadius: "4px",
                  border: "1px solid #dee2e6",
                  fontSize: "14px",
                }}
              >
                Drafts
              </a>
              <a
                href="/blog/edit"
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#007acc",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                New Post
              </a>
              <a
                href="/logout"
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                Sign Out
              </a>
            </>
          ) : (
            <a
              href="/login"
              style={{
                padding: "10px 20px",
                backgroundColor: "#007acc",
                color: "white",
                textDecoration: "none",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            >
              Sign In
            </a>
          )}
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
