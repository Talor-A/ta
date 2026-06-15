import { useState, useEffect } from "react";
import type { Route } from "./+types/images";
import { requireAuth } from "../lib/auth-utils";
import styles from "./images.module.css";

export async function loader({ context, request }: Route.LoaderArgs) {
  await requireAuth(request);

  try {
    const r2 = context.cloudflare.env.BLOG_IMAGE_UPLOADS;
    const list = await r2.list();

    const images = list.objects.map((obj) => ({
      key: obj.key,
      uploaded: obj.uploaded,
      size: obj.size,
      url: `/api/images/${obj.key}`,
    }));

    // Sort by upload date, newest first
    images.sort(
      (a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime()
    );

    return { images };
  } catch (error) {
    console.error("Failed to list images:", error);
    return { images: [] };
  }
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Images - Talor Anderson" },
    {
      name: "description",
      content: "Image gallery",
    },
  ];
}

export default function Images({ loaderData }: Route.ComponentProps) {
  const { images } = loaderData;
  const [copied, setCopied] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const copyToClipboard = async (text: string, type: "image" | "markdown") => {
    if (!mounted || typeof navigator === "undefined") return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(`${type}-${text}`);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const copyImage = async (url: string) => {
    if (!mounted || typeof window === "undefined") return;
    const fullUrl = `${window.location.origin}${url}`;
    await copyToClipboard(fullUrl, "image");
  };

  const copyMarkdown = async (filename: string, url: string) => {
    const altText = filename.replace(/\.[^/.]+$/, "");
    const markdown = `![${altText}](${url})`;
    await copyToClipboard(markdown, "markdown");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  const markdownCopied = copied?.startsWith("markdown-") ?? false;

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div className={styles.backLinkWrapper}>
          <a href="/blog" className={styles.backLink}>
            ← Back to blog
          </a>
        </div>
        <h1 className={styles.title}>Images</h1>
        <p className={styles.subtitle}>
          Click image to copy URL • Click filename to copy markdown
        </p>
      </div>

      {images.length === 0 ? (
        <p className={styles.empty}>No images uploaded yet.</p>
      ) : (
        <div
          className={`${styles.grid}${markdownCopied ? ` ${styles.markdownCopied}` : ""}`}
        >
          {images.map((image) => {
            const markdownKey = `markdown-![${image.key.replace(/\.[^/.]+$/, "")}](${image.url})`;
            const imageCopiedKey = `image-${typeof window !== "undefined" ? window.location.origin : ""}${image.url}`;
            const isMarkdownCopied = copied === markdownKey;

            return (
              <div key={image.key} className={styles.card}>
                <div
                  onClick={() => copyImage(image.url)}
                  className={styles.imageButton}
                >
                  <img
                    src={image.url}
                    alt={image.key}
                    className={styles.image}
                  />
                  {mounted && copied === imageCopiedKey && (
                    <div className={styles.copiedOverlay}>Copied URL!</div>
                  )}
                </div>

                <div className={styles.meta}>
                  <button
                    onClick={() => copyMarkdown(image.key, image.url)}
                    className={`${styles.filenameButton}${isMarkdownCopied ? ` ${styles.filenameButtonCopied}` : ""}`}
                  >
                    {isMarkdownCopied ? "Copied markdown!" : image.key}
                  </button>
                  <div className={styles.details}>
                    {formatFileSize(image.size)} • {formatDate(image.uploaded)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
