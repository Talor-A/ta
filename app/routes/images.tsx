import { useState, useEffect } from "react";
import type { Route } from "./+types/images";
import { requireAuth } from "../lib/auth-utils";

export async function loader({ context, request }: Route.LoaderArgs) {
  await requireAuth(request);

  try {
    const r2 = context.cloudflare.env.BLOG_IMAGE_UPLOADS;
    const list = await r2.list();
    
    const images = list.objects.map((obj) => ({
      key: obj.key,
      uploaded: obj.uploaded,
      size: obj.size,
      url: `/api/images/${obj.key}`
    }));

    // Sort by upload date, newest first
    images.sort((a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime());

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

  const copyToClipboard = async (text: string, type: 'image' | 'markdown') => {
    if (!mounted || typeof navigator === 'undefined') return;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(`${type}-${text}`);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const copyImage = async (url: string) => {
    if (!mounted || typeof window === 'undefined') return;
    const fullUrl = `${window.location.origin}${url}`;
    await copyToClipboard(fullUrl, 'image');
  };

  const copyMarkdown = async (filename: string, url: string) => {
    const altText = filename.replace(/\.[^/.]+$/, '');
    const markdown = `![${altText}](${url})`;
    await copyToClipboard(markdown, 'markdown');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '40px' }}>
        <div style={{ marginBottom: '20px' }}>
          <a href="/blog" style={{ textDecoration: 'none', color: '#666', fontSize: '14px' }}>
            ← Back to blog
          </a>
        </div>
        <h1 style={{ margin: 0, marginBottom: '10px' }}>Images</h1>
        <p style={{ margin: 0, color: '#666' }}>
          Click image to copy URL • Click filename to copy markdown
        </p>
      </div>

      {images.length === 0 ? (
        <p style={{ color: '#666', textAlign: 'center', marginTop: '60px' }}>
          No images uploaded yet.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '30px',
            '@media (max-width: 640px)': {
              gridTemplateColumns: '1fr',
              gap: '20px'
            }
          }}
        >
          {images.map((image) => (
            <div
              key={image.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div
                onClick={() => copyImage(image.url)}
                style={{
                  aspectRatio: '1',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid #e5e5e5',
                  transition: 'transform 0.1s ease',
                  position: 'relative'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.98)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <img
                  src={image.url}
                  alt={image.key}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                {mounted && copied === `image-${typeof window !== 'undefined' ? window.location.origin : ''}${image.url}` && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    Copied URL!
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  onClick={() => copyMarkdown(image.key, image.url)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    font: 'inherit',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: copied === `markdown-![${image.key.replace(/\.[^/.]+$/, '')}](${image.url})` ? '#007acc' : '#333',
                    textDecoration: 'underline',
                    textDecorationColor: 'transparent',
                    transition: 'all 0.1s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!copied?.startsWith('markdown-')) {
                      e.currentTarget.style.textDecorationColor = '#007acc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!copied?.startsWith('markdown-')) {
                      e.currentTarget.style.textDecorationColor = 'transparent';
                    }
                  }}
                >
                  {copied === `markdown-![${image.key.replace(/\.[^/.]+$/, '')}](${image.url})` 
                    ? 'Copied markdown!' 
                    : image.key}
                </button>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {formatFileSize(image.size)} • {formatDate(image.uploaded)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}