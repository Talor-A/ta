import { useEffect, useRef, useState, useCallback } from "react";
import { useFetcher, redirect, useLoaderData } from "react-router";
import { useDebounce } from "../lib/useDebounce";
import styles from "./blog.$id.edit.module.css";
import type { Route } from "./+types/blog.$id.edit";
import { blogPosts } from "../../database/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth-utils";
import { convertBlueskyUrl } from "../lib/bluesky-utils";

export async function loader({ context, request, params }: Route.LoaderArgs) {
  await requireAuth(request);

  const id = params.id;

  const post = await context.db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.id, parseInt(id)))
    .get();

  if (!post) {
    throw new Response("Post not found", { status: 404 });
  }

  return { post };
}

const intents = ["save", "publish", "unpublish", "autosave"] as const;
type Intent = (typeof intents)[number];

function intent(str: string): str is Intent {
  return intents.includes(str as any);
}

function getIntent(str: string): Intent | null {
  if (intent(str)) {
    return str;
  }
  return null;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+$/, "")
    .replace(/^-+/, "");
}

export async function action({
  context,
  request,
  params: { id: stringId },
}: Route.ActionArgs) {
  await requireAuth(request);
  const id = parseInt(stringId);

  const formData = await request.formData();
  const intent = getIntent(formData.get("intent") as string);
  const title = formData.get("title") as string | null;
  const body = formData.get("body") as string | null;
  const slug = formData.get("slug") as string | null;
  const blueskyDid = formData.get("blueskyDid") as string | null;
  const blueskyPostCid = formData.get("blueskyPostCid") as string | null;

  if (!intent) {
    return { error: "Invalid intent" };
  }

  if (intent === "autosave") {
    const post = await context.db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id))
      .get();
    if (!post) {
      return { error: "Post not found" };
    }
    if (post.publishedDate) {
      return { error: "Cannot autosave a published post" };
    }

    const fieldsToUpdate: {
      title?: string;
      body?: string;
      slug?: string;
      blueskyDid?: string | null;
      blueskyPostCid?: string | null;
    } = {};

    if (body !== null) {
      fieldsToUpdate.body = body;
      if (!post.slug || post.slug.startsWith("draft-")) {
        const newSlug = slugify(title || "draft");
        const existing = await context.db
          .select()
          .from(blogPosts)
          .where(eq(blogPosts.slug, newSlug))
          .get();

        fieldsToUpdate.slug = existing ? `${newSlug}-${id}` : newSlug;
      }

      if (!post.title) {
        fieldsToUpdate.title = body.split("\n")[0]?.trim() || "Untitled Draft";
      }
    }

    if (title !== null) {
      fieldsToUpdate.title = title;
    }

    if (!!slug) {
      fieldsToUpdate.slug = slugify(slug);
    }

    if (blueskyDid !== null && blueskyDid.trim() !== "") {
      fieldsToUpdate.blueskyDid = blueskyDid;
    } else if (blueskyDid !== null && blueskyDid.trim() === "") {
      fieldsToUpdate.blueskyDid = null;
    }

    if (blueskyPostCid !== null && blueskyPostCid.trim() !== "") {
      fieldsToUpdate.blueskyPostCid = blueskyPostCid;
    } else if (blueskyPostCid !== null && blueskyPostCid.trim() === "") {
      fieldsToUpdate.blueskyPostCid = null;
    }

    // Update existing draft
    await context.db
      .update(blogPosts)
      .set(fieldsToUpdate)
      .where(eq(blogPosts.id, id));

    return { success: true, message: "Changes Saved" };
  } else if (intent === "save") {
    const fieldsToUpdate: {
      title?: string;
      body?: string;
      slug?: string;
      blueskyDid?: string | null;
      blueskyPostCid?: string | null;
    } = {};

    if (title !== null) {
      fieldsToUpdate.title = title;
    }
    if (body !== null) {
      fieldsToUpdate.body = body;
    }
    if (!!slug) {
      fieldsToUpdate.slug = slugify(slug);
    }
    if (blueskyDid !== null && blueskyDid.trim() !== "") {
      fieldsToUpdate.blueskyDid = blueskyDid;
    } else if (blueskyDid !== null && blueskyDid.trim() === "") {
      fieldsToUpdate.blueskyDid = null;
    }
    if (blueskyPostCid !== null && blueskyPostCid.trim() !== "") {
      fieldsToUpdate.blueskyPostCid = blueskyPostCid;
    } else if (blueskyPostCid !== null && blueskyPostCid.trim() === "") {
      fieldsToUpdate.blueskyPostCid = null;
    }

    // Update existing draft
    await context.db
      .update(blogPosts)
      .set(fieldsToUpdate)
      .where(eq(blogPosts.id, id));

    return { success: true, message: "Draft saved" };
  } else if (intent === "publish") {
    const publishedDate = Math.floor(Date.now() / 1000);

    const post = await context.db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id))
      .get();

    if (!post) {
      return { error: "Post not found" };
    }

    if (!post.slug || !post.title || !post.body) {
      return {
        error: "Post must have a title, slug, and body to be published",
      };
    }

    await context.db
      .update(blogPosts)
      .set({
        publishedDate,
      })
      .where(eq(blogPosts.id, id));
    return {
      success: true,
      message: "Post published",
    };
  } else if (intent === "unpublish") {
    await context.db
      .update(blogPosts)
      .set({ publishedDate: null })
      .where(eq(blogPosts.id, id));
    return { success: true, message: "Post unpublished" };
  }

  return { error: "Unknown action" };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Blog Editor - Talor Anderson" },
    {
      name: "description",
      content: "Write and edit blog posts",
    },
  ];
}
const isValidUrl = (string: string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

export default function BlogEdit({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher<Awaited<ReturnType<typeof action>>>();
  const { textareaRef, content, setContent, isUploading } = useMarkdownTextArea(
    loaderData.post.body
  );

  const lastSavedStateRef = useRef({
    title: loaderData.post.title,
    content: loaderData.post.body,
    slug: loaderData.post.slug,
  });

  useEffect(() => {
    setTitle((preexistingTitle) => preexistingTitle || loaderData.post.title);
    setSlug((preexistingSlug) => preexistingSlug || loaderData.post.slug);
  }, [loaderData.post.title, loaderData.post.slug]);

  const [title, setTitle] = useState(loaderData.post.title);
  const [slug, setSlug] = useState(loaderData.post.slug);
  const [blueskyDid, setBlueskyDid] = useState(
    loaderData.post.blueskyDid || ""
  );
  const [blueskyPostCid, setBlueskyPostCid] = useState(
    loaderData.post.blueskyPostCid || ""
  );
  const [blueskyUrl, setBlueskyUrl] = useState("");
  const [isConverting, setIsConverting] = useState(false);

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const isPublished = !!loaderData.post.publishedDate;

  const handleBlueskyUrlConvert = async () => {
    if (!blueskyUrl.trim()) return;

    setIsConverting(true);
    try {
      const result = await convertBlueskyUrl(blueskyUrl);
      if (result) {
        setBlueskyDid(result.did);
        setBlueskyPostCid(result.cid);
        setBlueskyUrl(""); // Clear the URL field after successful conversion
      } else {
        alert(
          "Invalid Bluesky URL. Please use format: https://bsky.app/profile/{handle}/post/{cid}"
        );
      }
    } catch (error) {
      alert("Failed to convert URL. Please check the URL and try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const debouncedBody = useDebounce(content, 1000);

  useEffect(() => {
    if (loaderData.post.publishedDate) {
      return;
    }

    async function doit() {
      if (debouncedBody !== lastSavedStateRef.current.content) {
        await fetcher.submit(
          {
            intent: "autosave" satisfies Intent,
            body: debouncedBody,
          },
          { method: "post" }
        );

        setLastSaved(new Date());
        lastSavedStateRef.current = {
          title,
          content: debouncedBody,
          slug,
        };
      }
    }
    doit();
  }, [
    debouncedBody,
    title,
    slug,
    fetcher.submit,
    loaderData.post.publishedDate,
  ]);

  const handleSave = () => {
    const formData = new FormData();
    formData.append("intent", "save" satisfies Intent);
    formData.append("title", title);
    formData.append("body", content);
    formData.append("slug", slug);
    formData.append("blueskyDid", blueskyDid);
    formData.append("blueskyPostCid", blueskyPostCid);

    fetcher.submit(formData, { method: "post" });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "s":
            e.preventDefault();
            handleSave();
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [textareaRef, handleSave]);

  const handlePublish = () => {
    const formData = new FormData();
    formData.append("intent", "publish" satisfies Intent);

    fetcher.submit(formData, { method: "post" });
  };

  const handleUnpublish = () => {
    const formData = new FormData();
    formData.append("intent", "unpublish" satisfies Intent);
    fetcher.submit(formData, { method: "post" });
  };

  const isLoading = fetcher.state === "submitting";

  return (
    <main className={styles.main}>
      <div>
        <div className={styles.backLink}>
          <a aria-label="Back to blog" href="/blog" className="link-plain">
            ←
          </a>
        </div>
        <div className={styles.header}>
          <h1>Blog Editor</h1>
          <div className={`${styles.status} dimmer`}>
            {isPublished && <span className={styles.published}>Published</span>}
            {isUploading && <span>Uploading image...</span>}
            {!isPublished && !isUploading && lastSaved && (
              <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
            )}
            {!isPublished && !isUploading && !lastSaved && !isLoading && (
              <span>Auto-saving drafts...</span>
            )}
            {!isUploading && isLoading && <span>Saving...</span>}
          </div>
        </div>
      </div>

      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            fetcher.submit(
              { intent: "autosave" satisfies Intent, title },
              { method: "post" }
            );
          }}
          placeholder="Post title..."
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "10px",
          }}
        />
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          onBlur={() => {
            fetcher.submit(
              { intent: "autosave" satisfies Intent, slug },
              { method: "post" }
            );
          }}
          placeholder="url-slug (auto-generated from title if empty)"
          className="dimmer"
          style={{ fontSize: "14px" }}
        />
      </div>

      <details>
        <summary style={{ fontSize: "16px", cursor: "pointer" }}>
          Bluesky Comments (Optional) {blueskyDid && blueskyPostCid && "✓"}
        </summary>

        <div style={{ marginBottom: "15px" }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "5px" }}>
            <input
              type="url"
              value={blueskyUrl}
              onChange={(e) => setBlueskyUrl(e.target.value)}
              placeholder="https://bsky.app/profile/handle/post/cid"
              style={{ fontSize: "14px", flex: "1" }}
            />
            <button
              type="button"
              onClick={handleBlueskyUrlConvert}
              disabled={isConverting || !blueskyUrl.trim()}
              style={{
                fontSize: "12px",
                padding: "4px 12px",
                background: isConverting ? "#ccc" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  isConverting || !blueskyUrl.trim()
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {isConverting ? "Converting..." : "Convert"}
            </button>
          </div>
          <p className="dimmer" style={{ fontSize: "12px", margin: "0" }}>
            Paste a Bluesky post URL to auto-fill DID and CID fields below
          </p>
        </div>

        <input
          type="text"
          value={blueskyDid}
          onChange={(e) => setBlueskyDid(e.target.value)}
          onBlur={() => {
            fetcher.submit(
              { intent: "autosave" satisfies Intent, blueskyDid },
              { method: "post" }
            );
          }}
          placeholder="did:plc:... (your Bluesky DID)"
          className="dimmer"
          style={{ fontSize: "14px", marginBottom: "8px" }}
        />
        <input
          type="text"
          value={blueskyPostCid}
          onChange={(e) => setBlueskyPostCid(e.target.value)}
          onBlur={() => {
            fetcher.submit(
              { intent: "autosave" satisfies Intent, blueskyPostCid },
              { method: "post" }
            );
          }}
          placeholder="3k... (Bluesky post CID)"
          className="dimmer"
          style={{ fontSize: "14px" }}
        />
      </details>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your blog post in Markdown..."
        className={styles.editor}
      />

      <div className={styles.actions}>
        <button onClick={handleSave} disabled={isLoading}>
          Save
        </button>
        {isPublished ? (
          <button onClick={handleUnpublish} disabled={isLoading}>
            Unpublish
          </button>
        ) : (
          <button onClick={handlePublish} disabled={isLoading}>
            Publish
          </button>
        )}

        <a
          href={`/blog/${loaderData.post.slug}?preview=1`}
          className="link-plain"
        >
          Preview
        </a>

        {fetcher.data?.error && (
          <span className="error" style={{ marginLeft: "10px" }}>
            {fetcher.data.error}
          </span>
        )}
      </div>
    </main>
  );
}

function useMarkdownTextArea(initialValue: string = "") {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState(initialValue);
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error("Image upload failed:", error);
      alert("Image upload failed. Please try again.");
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const insertImageAtCursor = useCallback(
    (imageUrl: string, altText: string = "") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const beforeText = textarea.value.substring(0, start);
      const afterText = textarea.value.substring(end);

      const imageMarkdown = `![${altText}](${imageUrl})`;

      // Add newlines if we're inserting in the middle of text
      const needsNewlineBefore =
        start > 0 && beforeText[beforeText.length - 1] !== "\n";
      const needsNewlineAfter = afterText.length > 0 && afterText[0] !== "\n";

      const finalMarkdown =
        (needsNewlineBefore ? "\n" : "") +
        imageMarkdown +
        (needsNewlineAfter ? "\n" : "");

      const newText = beforeText + finalMarkdown + afterText;
      setContent(newText);

      // Set cursor after the inserted image
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + finalMarkdown.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    },
    []
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer?.files || []);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      if (imageFiles.length === 0) {
        return; // No image files, let normal drop behavior proceed
      }

      for (const file of imageFiles) {
        const imageUrl = await uploadImage(file);
        if (imageUrl) {
          const altText = file.name.replace(/\.[^/.]+$/, ""); // Remove extension for alt text
          insertImageAtCursor(imageUrl, altText);
        }
      }
    },
    [uploadImage, insertImageAtCursor]
  );

  const wrapSelection = useCallback(
    (prefix: string, suffix: string = prefix) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      const beforeText = textarea.value.substring(0, start);
      const afterText = textarea.value.substring(end);

      const newText = beforeText + prefix + selectedText + suffix + afterText;
      setContent(newText);

      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      }, 0);
    },
    []
  );

  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Check for image files first
      const files = Array.from(e.clipboardData?.files || []);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      if (imageFiles.length > 0) {
        e.preventDefault();

        // Upload and insert each pasted image
        for (const file of imageFiles) {
          const imageUrl = await uploadImage(file);
          if (imageUrl) {
            const altText = file.name || "pasted-image";
            insertImageAtCursor(imageUrl, altText);
          }
        }
        return;
      }

      // Handle text paste for URL → markdown conversion (existing functionality)
      // Only proceed if there's selected text
      if (start === end) return;

      const selectedText = textarea.value.substring(start, end);
      const pastedText = e.clipboardData?.getData("text") || "";

      // Check if pasted text is a URL
      if (isValidUrl(pastedText)) {
        e.preventDefault();

        const beforeText = textarea.value.substring(0, start);
        const afterText = textarea.value.substring(end);
        const linkMarkdown = `[${selectedText}](${pastedText})`;

        const newText = beforeText + linkMarkdown + afterText;
        setContent(newText);

        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(
            start + linkMarkdown.length,
            start + linkMarkdown.length
          );
        });
      }
    },
    [uploadImage, insertImageAtCursor]
  );

  const toggleBlockComment = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lines = textarea.value.split("\n");

    // Find which lines are selected
    let startLine = 0;
    let endLine = 0;
    let currentPos = 0;

    for (let i = 0; i < lines.length; i++) {
      if (currentPos <= start && start <= currentPos + lines[i].length) {
        startLine = i;
      }
      if (currentPos <= end && end <= currentPos + lines[i].length + 1) {
        endLine = i;
        break;
      }
      currentPos += lines[i].length + 1; // +1 for newline
    }

    // Check if all selected lines are commented
    const selectedLines = lines.slice(startLine, endLine + 1);
    const allCommented = selectedLines.every(
      (line) => line.trim().startsWith("<!-- ") && line.trim().endsWith(" -->")
    );

    // Toggle comments
    for (let i = startLine; i <= endLine; i++) {
      if (allCommented) {
        // Remove comment
        lines[i] = lines[i].replace(/^\s*<!-- /, "").replace(/ -->\s*$/, "");
      } else {
        // Add comment
        lines[i] = `<!-- ${lines[i]} -->`;
      }
    }

    setContent(lines.join("\n"));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "b":
            e.preventDefault();
            wrapSelection("**");
            break;
          case "i":
            e.preventDefault();
            wrapSelection("*");
            break;
          case "/":
            e.preventDefault();
            toggleBlockComment();
            break;
        }
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener("paste", handlePaste);
      textarea.addEventListener("dragover", handleDragOver);
      textarea.addEventListener("drop", handleDrop);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (textarea) {
        textarea.removeEventListener("paste", handlePaste);
        textarea.removeEventListener("dragover", handleDragOver);
        textarea.removeEventListener("drop", handleDrop);
      }
    };
  }, [
    handlePaste,
    handleDragOver,
    handleDrop,
    wrapSelection,
    toggleBlockComment,
  ]);

  return { textareaRef, content, setContent, isUploading };
}
