import type { Route } from "./+types/rss.xml";
import { blogPosts } from "../../database/schema";
import { isNotNull } from "drizzle-orm";

export async function loader({ context }: Route.LoaderArgs) {
  const posts = await context.db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      body: blogPosts.body,
      publishedDate: blogPosts.publishedDate,
    })
    .from(blogPosts)
    .where(isNotNull(blogPosts.publishedDate))
    .orderBy(blogPosts.publishedDate);

  const baseUrl = "https://taloranderson.com"; // Replace with your actual domain
  const buildDate = new Date().toUTCString();

  const rssItems = posts
    .map((post) => {
      const pubDate = post.publishedDate
        ? new Date(post.publishedDate * 1000).toUTCString()
        : "";

      // Simple text content extraction for description
      const description = post.body
        .replace(/[#*_`~\[\]()]/g, "")
        .substring(0, 200)
        .trim();

      return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <guid>${baseUrl}/blog/${post.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}${description.length >= 200 ? "..." : ""}]]></description>
    </item>`;
    })
    .join("\n");

  const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Talor Anderson - Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Thoughts on AI, fullstack development, and engineering culture.</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>`;

  return new Response(rssContent, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
