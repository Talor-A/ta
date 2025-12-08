import type { Route } from "./+types/rss.xml";
import { blogPosts } from "../../database/schema";
import { isNotNull } from "drizzle-orm";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

function normalizeUrl(url: string): string {
  if (!url) return url;
  if (url.match(/^https?:\/\//)) return url;
  return `https://${url}`;
}

function preprocessMarkdown(markdown: string): string {
  return markdown;
  // .replace(/\\n/g, "\n")
  // .replace(/\\!/g, "!")
  // .replace(/\\\*/g, "*");
}

async function markdownToHtml(markdown: string): Promise<string> {
  const preprocessed = preprocessMarkdown(markdown);
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(preprocessed);

  return String(result);
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const posts = await context.db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      body: blogPosts.body,
      publishedDate: blogPosts.publishedDate,
      url: blogPosts.url,
    })
    .from(blogPosts)
    .where(isNotNull(blogPosts.publishedDate))
    .orderBy(blogPosts.publishedDate);

  const baseUrl = new URL(request.url).origin;
  const buildDate = new Date().toUTCString();

  // Convert markdown to HTML for all posts
  const rssItems = await Promise.all(
    posts.map(async (post) => {
      const pubDate = post.publishedDate
        ? new Date(post.publishedDate * 1000).toUTCString()
        : "";

      // Convert markdown to HTML
      const htmlContent = await markdownToHtml(post.body);

      // For linkblog posts (posts with external URLs), format title as a link in the description
      const rssTitle = post.url
        ? post.title // Keep title plain in RSS title element
        : post.title;

      const rssDescription = post.url
        ? `<p><strong><a href="${normalizeUrl(post.url)}">${post.title}</a></strong></p>\n\n${htmlContent}`
        : htmlContent;

      return `    <item>
      <title><![CDATA[${rssTitle}]]></title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <guid>${baseUrl}/blog/${post.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${rssDescription}]]></description>
    </item>`;
    })
  );

  const rssItemsString = rssItems.join("\n");

  const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Talor Anderson's Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Thoughts on AI, fullstack development, and engineering culture.</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
${rssItemsString}
  </channel>
</rss>`;

  return new Response(rssContent, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
