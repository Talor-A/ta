import type { Route } from "./+types/blog.$slug";
import { blogPosts } from "../../database/schema";
import { eq, isNotNull, and } from "drizzle-orm";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import styles from "./blog.$slug.module.css";
import { getOptionalAuth } from "~/lib/auth-utils";
import BlueskyComments from "~/components/BlueskyComments";

function hasPreview(url: string): boolean {
  const previewParam = new URL(url).searchParams.get("preview");

  return previewParam === "true" || previewParam === "1";
}

export async function loader({ context, params, request }: Route.LoaderArgs) {
  const session = await getOptionalAuth(request);

  const whereClause = hasPreview(request.url)
    ? eq(blogPosts.slug, params.slug)
    : and(eq(blogPosts.slug, params.slug), isNotNull(blogPosts.publishedDate));

  const post = await context.db
    .select()
    .from(blogPosts)
    .where(whereClause)
    .get();

  if (!post) {
    throw new Response("Post not found", { status: 404 });
  }

  return { post, session };
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

function normalizeUrl(url: string): string {
  if (!url) return url;
  if (url.match(/^https?:\/\//)) return url;
  return `https://${url}`;
}

export default function BlogPost({ loaderData }: Route.ComponentProps) {
  const { post, session } = loaderData;

  return (
    <main>
      <div className={styles.backLink}>
        <a aria-label="Back to blog" href="/blog" className="link-plain">
          ←
        </a>
      </div>
      <article className="post">
        <header className="mb-2">
          <h1 role="none">
            <a href="/blog" className={`${styles.inlineBackLink} link-plain`}>
              ← Back to Blog
              <span className="dimmer"> | </span>
            </a>
            {post.url ? (
              <a
                href={normalizeUrl(post.url)}
                target="_blank"
                rel="noopener noreferrer"
                role="h1"
              >
                {post.title}
              </a>
            ) : (
              <span role="h1">{post.title}</span>
            )}
          </h1>
          <span className="dimmer" style={{ fontSize: "0.9em" }}>
            {post.publishedDate ? (
              <span>
                <time>
                  {new Date(post.publishedDate * 1000).toLocaleDateString(
                    "en-US",
                    { timeZone: "UTC" }
                  )}
                </time>
                {" | "}
                Talor Anderson
              </span>
            ) : null}
            {session ? (
              <span>
                <a
                  className="link-plain"
                  href={`/blog/${post.id}/edit`}
                  style={{ marginLeft: "10px" }}
                >
                  Edit
                </a>
              </span>
            ) : null}
          </span>
        </header>

        <div>
          <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {preprocessMarkdown(post.body)}
          </Markdown>
        </div>
      </article>

      {/* Bluesky Link Section */}
      {post.publishedDate && post.blueskyDid && post.blueskyPostCid && (
        <section
          style={{
            marginTop: "2rem",
            paddingTop: "2rem",
            borderTop: "1px solid #e5e5e5",
          }}
        >
          <a
            href={`https://bsky.app/profile/${post.blueskyDid}/post/${post.blueskyPostCid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="link-plain"
          >
            Leave a comment on Bluesky
          </a>
        </section>
      )}

      {/* Bluesky Comments */}
      {post.publishedDate && post.blueskyDid && post.blueskyPostCid && (
        <section
          style={{
            marginTop: "2rem",
            paddingTop: "2rem",
            borderTop: "1px solid #e5e5e5",
          }}
        >
          <h2>Comments</h2>
          <BlueskyComments
            did={post.blueskyDid}
            postCid={post.blueskyPostCid}
            skipFirst={true}
          />
        </section>
      )}

      {/* <nav
        style={{
          paddingTop: "1rem",
        }}
      >
        <a href="/blog" className="link-plain">
          ← Back to Blog
        </a>
      </nav> */}
    </main>
  );
}
