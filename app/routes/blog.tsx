import type { Route } from "./+types/blog";
import { blogPosts } from "../../database/schema";
import { isNotNull } from "drizzle-orm";
import { getOptionalAuth } from "../lib/auth-utils";
import styles from "./blog.module.css";

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
      <header>
        <h1>
          <a className={`${styles.myname} link-plain`} href="/">
            Talor Anderson
          </a>{" "}
          <span className={`dimmer ${styles.myname}`}>|</span> Blog
        </h1>

        <p>Thoughts on AI, fullstack development, and engineering culture.</p>

        <nav
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          {session ? (
            <>
              <span className="dimmer" style={{ fontSize: "14px" }}>
                Welcome, {session.user.name}
              </span>
              <ul className={styles.toolbar}>
                <li>
                  <a className="link-plain" href="/blog/drafts">
                    Drafts
                  </a>
                </li>
                <li>
                  <a className="link-plain" href="/blog/new">
                    New Post
                  </a>
                </li>
                <li>
                  <a className="link-plain" href="/logout">
                    Sign Out
                  </a>
                </li>
              </ul>
            </>
          ) : null}
        </nav>
      </header>

      {posts.length > 0 ? (
        <div>
          {posts.map((post) => (
            <article
              key={post.id}
              style={{
                marginBottom: "30px",
                paddingBottom: "20px",
                borderBottom: "1px solid var(--dimmer-color)",
              }}
            >
              <h2>
                <a href={`/blog/${post.slug}`} className="link-plain">
                  {post.title}
                </a>
              </h2>
              <time className="dimmer" style={{ fontSize: "0.9em" }}>
                {post.publishedDate
                  ? new Date(post.publishedDate * 1000).toLocaleDateString(
                      "en-US",
                      {
                        timeZone: "UTC",
                      }
                    )
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
