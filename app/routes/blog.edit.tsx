import { useEffect, useRef, useState, useCallback } from "react";
import { useFetcher } from "react-router";
import { useDebounce } from "../lib/useDebounce";
import type { Route } from "./+types/blog.edit";
import { blogPosts } from "../../database/schema";
import { eq, desc, isNull } from "drizzle-orm";
import { requireAuth } from "../lib/auth-utils";

export async function loader({ context, request }: Route.LoaderArgs) {
  // Require authentication
  await requireAuth(request);
  const url = new URL(request.url);
  const editId = url.searchParams.get("edit");

  if (editId) {
    // Load existing post for editing
    const post = await context.db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, parseInt(editId)))
      .get();

    if (!post) {
      throw new Response("Post not found", { status: 404 });
    }

    return { post };
  }

  // Check for existing draft for new posts
  const existingDraft = await context.db
    .select()
    .from(blogPosts)
    .where(isNull(blogPosts.publishedDate))
    .orderBy(desc(blogPosts.id))
    .limit(1)
    .get();

  return { post: existingDraft };
}

export async function action({ context, request }: Route.ActionArgs) {
  // Require authentication
  await requireAuth(request);

  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const title = formData.get("title") as string;
  const body = formData.get("body") as string;
  const slug = formData.get("slug") as string;
  const postId = formData.get("postId") as string;

  if (!title || !body) {
    return { error: "Title and body are required" };
  }

  try {
    if (intent === "autosave" || intent === "save") {
      if (postId) {
        // Update existing draft
        await context.db
          .update(blogPosts)
          .set({
            title,
            body,
            slug:
              slug ||
              title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/-+$/, ""),
          })
          .where(eq(blogPosts.id, parseInt(postId)));

        return { success: true, message: "Draft saved" };
      } else {
        // Create new draft
        const newSlug =
          slug ||
          title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/-+$/, "");
        const result = await context.db
          .insert(blogPosts)
          .values({
            title,
            body,
            slug: newSlug,
            publishedDate: null,
          })
          .returning({ id: blogPosts.id });

        return {
          success: true,
          message: "Draft created",
          postId: result[0]?.id,
        };
      }
    } else if (intent === "publish") {
      const publishedDate = Math.floor(Date.now() / 1000);

      if (postId) {
        // Update existing post and publish
        await context.db
          .update(blogPosts)
          .set({
            title,
            body,
            slug:
              slug ||
              title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/-+$/, ""),
            publishedDate,
          })
          .where(eq(blogPosts.id, parseInt(postId)));
      } else {
        // Create new published post
        const newSlug =
          slug ||
          title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/-+$/, "");
        await context.db.insert(blogPosts).values({
          title,
          body,
          slug: newSlug,
          publishedDate,
        });
      }

      return { success: true, message: "Post published", redirect: "/blog" };
    }
  } catch (error) {
    return { error: "Failed to save post" };
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

export default function BlogEdit({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSavedStateRef = useRef({
    title: loaderData.post?.title || "",
    content: loaderData.post?.body || "# New Blog Post\n\nStart writing your content here...",
    slug: loaderData.post?.slug || "",
  });

  const [title, setTitle] = useState(loaderData.post?.title || "");
  const [content, setContent] = useState(
    loaderData.post?.body ||
      "# New Blog Post\n\nStart writing your content here...",
  );
  const [slug, setSlug] = useState(loaderData.post?.slug || "");
  const [postId, setPostId] = useState(loaderData.post?.id?.toString() || "");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isPublished] = useState(!!loaderData.post?.publishedDate);

  // Debounce the form values for autosave
  const debouncedTitle = useDebounce(title, 2000);
  const debouncedContent = useDebounce(content, 2000);
  const debouncedSlug = useDebounce(slug, 2000);

  // Autosave function for drafts only
  const autosave = useCallback((title: string, content: string, slug: string) => {
    if (isPublished || !title.trim() || !content.trim()) return;

    // Check if content has actually changed
    const currentState = { title, content, slug };
    const lastSaved = lastSavedStateRef.current;
    
    if (
      currentState.title === lastSaved.title &&
      currentState.content === lastSaved.content &&
      currentState.slug === lastSaved.slug
    ) {
      return; // No changes to save
    }

    const formData = new FormData();
    formData.append("intent", "autosave");
    formData.append("title", title);
    formData.append("body", content);
    formData.append("slug", slug);
    if (postId) formData.append("postId", postId);

    fetcher.submit(formData, { method: "post" });
  }, [isPublished, postId, fetcher]);

  // Handle autosave response
  useEffect(() => {
    if (fetcher.data?.success) {
      setLastSaved(new Date());
      // Update last saved state ref
      lastSavedStateRef.current = { title: debouncedTitle, content: debouncedContent, slug: debouncedSlug };
      if (fetcher.data.postId && !postId) {
        setPostId(fetcher.data.postId.toString());
      }
    }
  }, [fetcher.data, postId, debouncedTitle, debouncedContent, debouncedSlug]);

  // Auto-save when debounced values change
  useEffect(() => {
    autosave(debouncedTitle, debouncedContent, debouncedSlug);
  }, [debouncedTitle, debouncedContent, debouncedSlug, autosave]);

  const wrapSelection = (prefix: string, suffix: string = prefix) => {
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
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handlePaste = async (e: ClipboardEvent) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    // Only proceed if there's selected text
    if (start === end) return;

    const pastedText = e.clipboardData?.getData("text") || "";

    // Check if pasted text is a URL
    if (isValidUrl(pastedText)) {
      e.preventDefault();

      const beforeText = textarea.value.substring(0, start);
      const afterText = textarea.value.substring(end);
      const linkMarkdown = `[${selectedText}](${pastedText})`;

      const newText = beforeText + linkMarkdown + afterText;
      setContent(newText);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + linkMarkdown.length,
          start + linkMarkdown.length,
        );
      }, 0);
    }
  };

  const toggleBlockComment = () => {
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
      (line) => line.trim().startsWith("<!-- ") && line.trim().endsWith(" -->"),
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
  };

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
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (textarea) {
        textarea.removeEventListener("paste", handlePaste);
      }
    };
  }, []);

  const handleSave = () => {
    const formData = new FormData();
    formData.append("intent", "save");
    formData.append("title", title);
    formData.append("body", content);
    formData.append("slug", slug);
    if (postId) formData.append("postId", postId);

    fetcher.submit(formData, { method: "post" });
  };

  const handlePublish = () => {
    const formData = new FormData();
    formData.append("intent", "publish");
    formData.append("title", title);
    formData.append("body", content);
    formData.append("slug", slug);
    if (postId) formData.append("postId", postId);

    fetcher.submit(formData, { method: "post" });
  };

  // Handle redirect after publish
  useEffect(() => {
    if (fetcher.data?.redirect) {
      window.location.href = fetcher.data.redirect;
    }
  }, [fetcher.data]);

  const isLoading = fetcher.state === "submitting";

  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <h1>Blog Editor</h1>
          <div style={{ fontSize: "0.8em", color: "#666" }}>
            {isPublished && (
              <span style={{ color: "#28a745", fontWeight: "bold" }}>
                Published
              </span>
            )}
            {!isPublished && lastSaved && (
              <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
            )}
            {!isPublished && !lastSaved && !isLoading && (
              <span>Auto-saving drafts...</span>
            )}
            {isLoading && <span>Saving...</span>}
          </div>
        </div>
        <p style={{ color: "#666", fontSize: "0.9em" }}>
          Use <kbd>Cmd+B</kbd> for bold, <kbd>Cmd+I</kbd> for italic,{" "}
          <kbd>Cmd+/</kbd> for comments. Select text and <kbd>Cmd+V</kbd> a URL
          to create links.
        </p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title..."
          style={{
            width: "100%",
            padding: "12px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "10px",
          }}
        />
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="url-slug (auto-generated from title if empty)"
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
            color: "#666",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => wrapSelection("**")}
          style={{
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            background: "#f5f5f5",
            cursor: "pointer",
          }}
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => wrapSelection("*")}
          style={{
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            background: "#f5f5f5",
            cursor: "pointer",
          }}
        >
          <em>I</em>
        </button>
        <button
          onClick={toggleBlockComment}
          style={{
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            background: "#f5f5f5",
            cursor: "pointer",
          }}
        >
          Comment
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your blog post in Markdown..."
        style={{
          width: "100%",
          height: "400px",
          padding: "15px",
          border: "1px solid #ddd",
          borderRadius: "4px",
          fontFamily: 'Monaco, Consolas, "Lucida Console", monospace',
          fontSize: "14px",
          lineHeight: "1.5",
          resize: "vertical",
        }}
      />

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          gap: "10px",
          alignItems: "center",
          minHeight: "44px",
        }}
      >
        <button
          onClick={handleSave}
          disabled={isLoading}
          style={{
            padding: "10px 20px",
            backgroundColor: isLoading ? "#ccc" : "#007acc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isPublished ? 0 : 1,
            pointerEvents: isPublished ? "none" : "auto",
            visibility: isPublished ? "hidden" : "visible",
          }}
        >
          {isLoading && fetcher.formData?.get("intent") === "save"
            ? "Saving..."
            : "Save Draft"}
        </button>
        <button
          onClick={handlePublish}
          disabled={isLoading}
          style={{
            padding: "10px 20px",
            backgroundColor: isLoading ? "#ccc" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading &&
          (fetcher.formData?.get("intent") === "publish" ||
            fetcher.formData?.get("intent") === "autosave")
            ? "Publishing..."
            : isPublished
              ? "Update"
              : "Publish"}
        </button>
        <a
          href="/blog"
          style={{
            padding: "10px 20px",
            backgroundColor: "#6c757d",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px",
            display: "inline-block",
          }}
        >
          Cancel
        </a>

        {fetcher.data?.error && (
          <span style={{ color: "#dc3545", marginLeft: "10px" }}>
            {fetcher.data.error}
          </span>
        )}
      </div>
    </main>
  );
}
