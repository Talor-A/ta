import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Talor Anderson" },
    {
      name: "description",
      content: "Engineer at Replit building developer tools and AI systems",
    },
  ];
}

export default function Home() {
  return (
    <main>
      <h1>Talor Anderson</h1>
      <p style={{ textWrap: "balance" }}>
        I'm an AI engineer based in San Diego, California. Previously, I was a
        product engineer at Replit. I care deeply about building tools to
        empower humans. My work has focused on transforming deeply complex
        systems into intuitive abstractions. Outside of work, I enjoy climbing,
        weightlifting, biking, and lifting.
      </p>

      <p>
        Read my{" "}
        <a href="/blog" className="link-underline">
          blog
        </a>
        .
      </p>

      <p>You can find me at any of these places:</p>

      <p className="links">
        <a className="link-underline" href="https://twitter.com/Talor_A">
          Twitter
        </a>{" "}
        •{" "}
        <a className="link-underline" href="https://github.com/talor-a">
          GitHub
        </a>{" "}
        •{" "}
        <a
          className="link-underline"
          href="https://www.linkedin.com/in/taloranderson/"
        >
          LinkedIn
        </a>
      </p>
    </main>
  );
}
