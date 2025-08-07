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
      <p>
        Engineer at Replit building developer tools and AI systems. Based in San
        Diego, I think deeply about creating technology that genuinely helps
        people rather than exploiting them. Outside of code, I'm climbing,
        surfing, cycling, and lifting.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="https://twitter.com/Talor_A">Twitter</a> •{" "}
        <a href="https://github.com/talor-a">GitHub</a> •{" "}
        <a href="https://www.linkedin.com/in/taloranderson/">LinkedIn</a>
      </p>
    </main>
  );
}
