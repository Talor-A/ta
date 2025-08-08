import type { Route } from "./+types/blog.$slug";
import { blogPosts } from "../../database/schema";
import { eq, isNotNull, and } from "drizzle-orm";

export async function loader({ context, params }: Route.LoaderArgs) {
  const post = await context.db
    .select()
    .from(blogPosts)
    .where(
      and(eq(blogPosts.slug, params.slug), isNotNull(blogPosts.publishedDate)),
    )
    .get();

  if (!post) {
    throw new Response("Post not found", { status: 404 });
  }

  return { post };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    { title: `${loaderData?.post.title} - Talor Anderson` },
    {
      name: "description",
      content: `Blog post: ${loaderData?.post.title}`,
    },
  ];
}

function parseMarkdown(markdown: string): string {
  // First, unescape the content
  let content = markdown
    .replace(/\\n/g, "\n")
    .replace(/\\!/g, "!")
    .replace(/\\\*/g, "*");

  // Split into paragraphs and process each
  const paragraphs = content.split(/\n\s*\n/);

  return paragraphs
    .map((paragraph) => {
      const lines = paragraph.split("\n");
      let html = "";
      let inList = false;

      for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        if (line.startsWith("# ")) {
          html += `<h1>${line.slice(2)}</h1>`;
        } else if (line.startsWith("## ")) {
          html += `<h2>${line.slice(3)}</h2>`;
        } else if (line.startsWith("### ")) {
          html += `<h3>${line.slice(4)}</h3>`;
        } else if (line.startsWith("- ")) {
          if (!inList) {
            html += "<ul>";
            inList = true;
          }
          html += `<li>${line
            .slice(2)
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.+?)\*/g, "<em>$1</em>")}</li>`;
        } else {
          if (inList) {
            html += "</ul>";
            inList = false;
          }
          html += `<p>${line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>")}</p>`;
        }
      }

      if (inList) {
        html += "</ul>";
      }

      return html;
    })
    .join("");
}

export default function BlogPost({ loaderData }: Route.ComponentProps) {
  const { post } = loaderData;

  return (
    <main>
      <article>
        <header style={{ marginBottom: "30px" }}>
          <h1>{post.title}</h1>
          <time style={{ color: "#666", fontSize: "0.9em" }}>
            {post.publishedDate
              ? new Date(post.publishedDate * 1000).toLocaleDateString()
              : ""}
          </time>
        </header>

        <div
          style={{ lineHeight: "1.6" }}
          dangerouslySetInnerHTML={{
            __html: parseMarkdown(post.body),
          }}
        />
      </article>

      <nav
        style={{
          marginTop: "40px",
          paddingTop: "20px",
          borderTop: "1px solid #eee",
        }}
      >
        <a href="/blog" style={{ color: "#666" }}>
          ← Back to Blog
        </a>
      </nav>
    </main>
  );
}
