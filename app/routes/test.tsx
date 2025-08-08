import type { Route } from "./+types/test";
import { testPosts } from "../../database/schema";

export async function loader({ context }: Route.LoaderArgs) {
  const posts = await context.db.select().from(testPosts);
  return { posts };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Test Posts" },
    {
      name: "description",
      content: "Test page reading from the database",
    },
  ];
}

export default function Test({ loaderData }: Route.ComponentProps) {
  return (
    <main>
      <h1>Test Posts</h1>
      <p>Reading from the testPosts table:</p>
      
      {loaderData.posts.length > 0 ? (
        <div>
          {loaderData.posts.map((post) => (
            <div key={post.id} style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
              <h2>{post.title}</h2>
              <p>{post.content}</p>
              <small>ID: {post.id}</small>
            </div>
          ))}
        </div>
      ) : (
        <p>No posts found.</p>
      )}
    </main>
  );
}