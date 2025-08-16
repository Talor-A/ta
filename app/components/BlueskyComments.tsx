import React, { useState, useEffect } from "react";
import {
  AppBskyEmbedRecord,
  AppBskyFeedPost,
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyFeedDefs,
  AppBskyFeedGetPostThread,
} from "@atcute/bluesky";
import { LuX, LuArrowRight, LuHeart, LuRecycle, LuReply } from "react-icons/lu";
import styles from "./BlueskyComments.module.css";

type BlueskyPost = AppBskyFeedPost.Main;
type BlueskyExternalEmbed = AppBskyEmbedExternal.View;
type ThreadView = AppBskyFeedDefs.ThreadViewPost;

const getBlueskyCdnLink = (did: string, cid: string, ext: string) => {
  return `https://cdn.bsky.app/img/feed_fullsize/plain/${did}/${cid}@${ext}`;
};

const MultiImageLayout = ({
  did,
  images,
}: {
  did: string;
  images: AppBskyEmbedImages.Image[];
}) => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const imageCount = images.length;

  const gridClassName =
    imageCount === 1
      ? styles.gridSingle
      : imageCount === 2
        ? styles.gridDouble
        : styles.gridMultiple;

  return (
    <>
      <div className={`${styles.imageGrid} ${gridClassName}`}>
        {images.map((image, i) => (
          <div
            key={i}
            className={`${styles.imageContainer} ${
              imageCount === 3 && i === 0 ? styles.imageSpanTwo : ""
            }`}
            onClick={() => setSelectedImage(i)}
          >
            <img
              src={getBlueskyCdnLink(
                did,
                (image.image as any).ref.$link,
                "jpeg"
              )}
              alt=""
              className={styles.image}
              style={{
                aspectRatio: imageCount === 1 ? "" : "1/1",
              }}
              loading="lazy"
            />
          </div>
        ))}
      </div>
      {selectedImage !== null && (
        <>
          <div className={styles.modal} onClick={() => setSelectedImage(null)}>
            <img
              src={getBlueskyCdnLink(
                did,
                (images[selectedImage].image as any).ref.$link,
                "png"
              )}
              className={styles.modalImage}
              alt=""
            />
            {images[selectedImage].alt && (
              <div className={styles.altText}>
                Alt text: {images[selectedImage].alt}
              </div>
            )}
          </div>
          <div className={styles.closeButton}>
            <button
              className={styles.closeButtonInner}
              onClick={() => setSelectedImage(null)}
            >
              <LuX />
            </button>
          </div>
        </>
      )}
    </>
  );
};

const BlueskyEmbed = ({
  embed,
  did,
}: {
  embed: BlueskyPost["embed"];
  did: string;
}) => {
  if (!embed || !embed.$type) {
    return null;
  }

  return (
    <div className={styles.embedContainer}>
      {embed.$type === "app.bsky.embed.external" ? (
        <div className={styles.externalEmbed}>
          {embed.external.thumb && (
            <img
              src={getBlueskyCdnLink(
                did,
                (embed.external.thumb as any).ref.$link,
                "jpeg"
              )}
              alt={embed.external.title}
              className={styles.externalThumb}
            />
          )}
          <h3 className={styles.externalTitle}>{embed.external.title}</h3>
          <p className={styles.externalDescription}>
            {embed.external.description}
          </p>
        </div>
      ) : embed.$type === "app.bsky.embed.images" ? (
        <div className={styles.imagesEmbed}>
          <MultiImageLayout did={did} images={embed.images} />
        </div>
      ) : (
        <div className={styles.unknownEmbed}>
          This embed type ({embed.$type}) is not yet implemented.
        </div>
      )}
    </div>
  );
};

function isPost(post: any): post is BlueskyPost {
  return post.$type === "app.bsky.feed.post";
}

export interface BlueskyReplyProps {
  thread: ThreadView;
  depth?: number;
  skipFirst?: boolean;
}

const BlueskyReply = ({
  thread,
  depth = 0,
  skipFirst = false,
}: BlueskyReplyProps) => {
  if (thread.$type !== "app.bsky.feed.defs#threadViewPost") {
    return null;
  }

  const { post, replies } = thread;
  const { author, embed, replyCount, repostCount, likeCount, record } = post;

  let bskyPost: BlueskyPost | null = null;
  if (isPost(record)) {
    bskyPost = record as BlueskyPost;
  }

  const MAX_DEPTH = 5;

  return (
    <div
      className={styles.replyChain}
      style={{ marginLeft: depth > 1 ? 12 : 0 }}
    >
      {!skipFirst && (
        <div
          className={`${styles.reply} ${depth > 1 ? styles.nestedReply : ""}`}
        >
          <div className={styles.author}>
            <img
              src={author.avatar}
              alt={author.displayName}
              className={styles.avatar}
            />
            <div>
              <a
                className={styles.displayName}
                href={`https://bsky.app/profile/${author.did}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {author.displayName}
              </a>
              <div className={styles.handle}>
                <a
                  href={`https://bsky.app/profile/${author.did}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @{author.handle}
                </a>
              </div>
            </div>
          </div>

          {bskyPost && (
            <>
              <div className={styles.content}>
                <span>{bskyPost?.text}</span>
              </div>

              {embed && (
                <BlueskyEmbed embed={bskyPost.embed} did={author.did} />
              )}
            </>
          )}

          <div className={styles.engagement}>
            <div className={styles.stat}>
              <span>{likeCount}</span>
              <LuHeart />
            </div>
            <div className={styles.stat}>
              <span>{replyCount}</span>
              <LuReply />
            </div>
            <div className={styles.stat}>
              <span>{repostCount}</span>
              <LuRecycle />
            </div>
            <a
              href={`https://bsky.app/profile/${author.did}/post/${post.uri.split("/").pop()}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.postLink}
            >
              Go to post <LuArrowRight />
            </a>
          </div>
        </div>
      )}

      {depth < MAX_DEPTH && replies && replies.length > 0 && (
        <div className={styles.nestedReplies}>
          {replies
            .filter((r) => r.$type === "app.bsky.feed.defs#threadViewPost")
            .map((nestedReply, index) => (
              <BlueskyReply
                key={`${(nestedReply as any).post?.uri}-${index}`}
                thread={nestedReply as ThreadView}
                depth={depth + 1}
              />
            ))}
        </div>
      )}

      {depth === MAX_DEPTH && replies && replies.length > 0 && (
        <button className={styles.moreReplies}>View more replies...</button>
      )}
    </div>
  );
};

function isThreadView(thread: unknown): thread is ThreadView {
  return (thread as ThreadView)?.$type === "app.bsky.feed.defs#threadViewPost";
}

export interface CommentsProps {
  did: string;
  postCid: string;
  skipFirst?: boolean;
}

export default function BlueskyComments({
  did,
  postCid,
  skipFirst = false,
}: CommentsProps) {
  const [comments, setComments] =
    useState<AppBskyFeedGetPostThread.$output | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: AppBskyFeedGetPostThread.$params = {
          uri: `at://${did}/app.bsky.feed.post/${postCid}`,
          depth: 6,
        };

        const searchParams = new URLSearchParams();
        searchParams.append("uri", params.uri);
        if (params.depth !== undefined) {
          searchParams.append("depth", params.depth.toString());
        }
        if (params.parentHeight !== undefined) {
          searchParams.append("parentHeight", params.parentHeight.toString());
        }

        const response = await fetch(
          "https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?" +
            searchParams
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch comments: ${response.status}`);
        }

        const data =
          (await response.json()) as AppBskyFeedGetPostThread.$output;
        console.log("Fetched comments:", data);
        setComments(data);
      } catch (err) {
        console.error("Error fetching comments:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (did && postCid) {
      fetchComments();
    }
  }, [did, postCid]);

  if (loading) {
    return (
      <div className={styles.loading}>
        Loading comments...
        <noscript className={styles.noscript}>
          You may need to enable JavaScript to view comments.
        </noscript>
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Error loading comments: {error}</div>;
  }

  if (!comments) {
    return <div className={styles.noComments}>No comments available.</div>;
  }

  if (!isThreadView(comments.thread)) {
    return (
      <div className={styles.error}>Error: Invalid thread data received</div>
    );
  }

  return (
    <div className={styles.container}>
      <BlueskyReply thread={comments.thread} skipFirst={skipFirst} />
    </div>
  );
}

export { BlueskyReply, BlueskyEmbed, MultiImageLayout };
