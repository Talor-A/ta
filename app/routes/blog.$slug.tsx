import type { Route } from "./+types/blog.$slug";
import { blogPosts } from "../../database/schema";
import { eq, isNotNull, and } from "drizzle-orm";
import Markdown from "react-markdown";

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

function preprocessMarkdown(markdown: string): string {
  // Unescape any escaped content that might be stored in the database
  return markdown
    .replace(/\\n/g, "\n")
    .replace(/\\!/g, "!")
    .replace(/\\\*/g, "*");
}

export default function BlogPost({ loaderData }: Route.ComponentProps) {
  const { post } = loaderData;

  return (
    <main>
      <article>
        <header className="mb-2">
          <h1>{post.title}</h1>
          <time className="dimmer" style={{ fontSize: "0.9em" }}>
            {post.publishedDate
              ? new Date(post.publishedDate * 1000).toLocaleDateString(
                  "en-US",
                  { timeZone: "UTC" },
                )
              : ""}
          </time>
        </header>

        <div
          style={{
            lineHeight: "1.6",
            maxWidth: "none",
          }}
        >
          <Markdown>{preprocessMarkdown(post.body)}</Markdown>
        </div>
      </article>

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
