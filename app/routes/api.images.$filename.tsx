import type { Route } from "./+types/api.images.$filename";

export async function loader({ params, context }: Route.LoaderArgs) {
  try {
    const { filename } = params;
    
    if (!filename) {
      return new Response("File not found", { status: 404 });
    }

    const r2 = context.cloudflare.env.BLOG_IMAGE_UPLOADS;
    const object = await r2.get(filename);

    if (!object) {
      return new Response("File not found", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    
    headers.set("Cache-Control", "public, max-age=31536000");
    headers.set("ETag", object.etag);

    return new Response(object.body, {
      headers,
    });

  } catch (error) {
    console.error("Image serving error:", error);
    return new Response("File not found", { status: 404 });
  }
}