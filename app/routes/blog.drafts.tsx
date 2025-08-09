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
      <header
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
        <a href="/blog/edit">New Draft</a>
      </header>

      {loaderData.drafts.length > 0 ? (
        <div>
          {loaderData.drafts.map((draft) => (
            <article
              key={draft.id}
              style={{
                marginBottom: "30px",
                paddingBottom: "20px",
                borderBottom: "1px solid var(--dimmer-color)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2 style={{ margin: "0 0 8px 0" }}>
                  {draft.title || "Untitled Draft"}
                </h2>
                <div className="dimmer" style={{ fontSize: "0.9em" }}>
                  <span>Draft • Not published</span>
                  {draft.slug && <span> • /{draft.slug}</span>}
                </div>
              </div>
              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <a href={`/blog/edit?edit=${draft.id}`}>Edit</a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div
          className="center"
          style={{
            padding: "60px 20px",
            border: "2px dashed var(--dimmer-color)",
            borderRadius: "8px",
          }}
        >
          <h3 className="dimmer" style={{ margin: "0 0 10px 0" }}>
            No drafts yet
          </h3>
          <p style={{ margin: "0 0 20px 0" }}>
            Start writing to automatically create drafts
          </p>
          <a href="/blog/edit">Create Your First Draft</a>
        </div>
      )}

      <nav
        className="mt-2"
        style={{
          paddingTop: "20px",
          borderTop: "1px solid var(--dimmer-color)",
        }}
      >
        <a href="/blog" className="dimmer">
          ← Back to Blog
        </a>
      </nav>
    </main>
  );
}
