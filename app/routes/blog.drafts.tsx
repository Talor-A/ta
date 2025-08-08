import type { Route } from "./+types/blog.drafts";
import { blogPosts } from "../../database/schema";
import { isNull } from "drizzle-orm";
import { requireAuth } from "../lib/auth-utils";

export async function loader({ context, request }: Route.LoaderArgs) {
  // Require authentication
  await requireAuth(request);
  const drafts = await context.db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
    })
    .from(blogPosts)
    .where(isNull(blogPosts.publishedDate))
    .orderBy(blogPosts.id);

  return { drafts };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Drafts - Talor Anderson" },
    {
      name: "description",
      content: "Manage your draft blog posts",
    },
  ];
}

export default function BlogDrafts({ loaderData }: Route.ComponentProps) {
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
          <h1>Draft Posts</h1>
          <p>Unpublished posts that are automatically saved as you write</p>
        </div>
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
          New Draft
        </a>
      </div>

      {loaderData.drafts.length > 0 ? (
        <div>
          {loaderData.drafts.map((draft) => (
            <article
              key={draft.id}
              style={{
                marginBottom: "30px",
                paddingBottom: "20px",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2 style={{ margin: "0 0 8px 0" }}>
                  {draft.title || "Untitled Draft"}
                </h2>
                <div style={{ color: "#666", fontSize: "0.9em" }}>
                  <span>Draft • Not published</span>
                  {draft.slug && <span> • /{draft.slug}</span>}
                </div>
              </div>
              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <a
                  href={`/blog/edit?edit=${draft.id}`}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#f8f9fa",
                    color: "#495057",
                    textDecoration: "none",
                    borderRadius: "4px",
                    border: "1px solid #dee2e6",
                    fontSize: "14px",
                  }}
                >
                  Edit
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#666",
            border: "2px dashed #ddd",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0", color: "#999" }}>No drafts yet</h3>
          <p style={{ margin: "0 0 20px 0" }}>
            Start writing to automatically create drafts
          </p>
          <a
            href="/blog/edit"
            style={{
              padding: "10px 20px",
              backgroundColor: "#007acc",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
            }}
          >
            Create Your First Draft
          </a>
        </div>
      )}

      <div
        style={{
          marginTop: "40px",
          paddingTop: "20px",
          borderTop: "1px solid #eee",
        }}
      >
        <a href="/blog" style={{ color: "#666" }}>
          ← Back to Blog
        </a>
      </div>
    </main>
  );
}
