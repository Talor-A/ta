import type { Route } from "./+types/api.upload-image";
import { requireAuth } from "../lib/auth-utils";

export async function action({ request, context }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    await requireAuth(request);

    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return new Response("No file provided", { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return new Response("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.", { 
        status: 400 
      });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return new Response("File too large. Maximum size is 5MB.", { status: 400 });
    }

    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    const arrayBuffer = await file.arrayBuffer();
    const r2 = context.cloudflare.env.BLOG_IMAGE_UPLOADS;

    await r2.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      fileName,
      url: `/api/images/${fileName}`
    }), {
      headers: {
        "Content-Type": "application/json",
      },
    });

  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error("Upload error:", error);
    return new Response("Upload failed", { status: 500 });
  }
}