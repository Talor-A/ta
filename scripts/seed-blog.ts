import { drizzle } from 'drizzle-orm/d1';
import { blogPosts } from '../database/schema';

const markdownContent = `# Complete Markdown Guide

This blog post demonstrates all common markdown syntax and formatting options.

## Headers

You can create headers using the \`#\` symbol. Here are all six levels:

### Level 3 Header
#### Level 4 Header
##### Level 5 Header
###### Level 6 Header

## Text Formatting

**Bold text** using double asterisks or __double underscores__.

*Italic text* using single asterisks or _single underscores_.

***Bold and italic*** using triple asterisks.

~~Strikethrough text~~ using double tildes.

\`Inline code\` using backticks.

## Lists

### Unordered Lists

- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
    - Double nested item
- Item 3

### Ordered Lists

1. First item
2. Second item
   1. Nested numbered item
   2. Another nested item
3. Third item

### Task Lists

- [x] Completed task
- [ ] Incomplete task
- [ ] Another incomplete task

## Links and Images

[This is a link](https://example.com) to an external site.

[This is a link with title](https://example.com "Link title") that shows on hover.

Auto-linking: https://www.example.com

## Code Blocks

### Inline Code
Use \`console.log()\` for debugging.

### Fenced Code Blocks

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return \`Welcome, \${name}\`;
}

greet('World');
\`\`\`

\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
\`\`\`

\`\`\`bash
# Shell commands
npm install
bun run dev
git commit -m "Add new feature"
\`\`\`

## Blockquotes

> This is a blockquote. It can span multiple lines and is great for highlighting important information or quotes.

> ### Blockquotes can contain other markdown elements
> 
> Including **bold text**, *italic text*, and even code: \`console.log()\`
>
> 1. And lists
> 2. Like this one

## Tables

| Feature | Supported | Notes |
|---------|-----------|--------|
| Headers | ✅ | All 6 levels |
| **Bold** | ✅ | Double asterisks |
| *Italic* | ✅ | Single asterisks |
| \`Code\` | ✅ | Backticks |
| Links | ✅ | [Like this](/) |

### Table with Alignment

| Left Aligned | Center Aligned | Right Aligned |
|:-------------|:--------------:|--------------:|
| Left         | Center         | Right         |
| Text         | Text           | Text          |

## Horizontal Rules

You can create horizontal rules using three or more dashes:

---

Or three or more asterisks:

***

Or three or more underscores:

___

## Line Breaks and Paragraphs

This is the first paragraph. It contains multiple sentences. Each sentence flows naturally into the next.

This is the second paragraph.  
This line has two trailing spaces for a line break.
This line follows immediately after the line break.

## Escape Characters

You can escape special characters using backslashes:

\\* Not italic \\*  
\\_ Not italic \\_  
\\# Not a header  
\\[Not a link\\]  
\\\`Not code\\\`

## HTML in Markdown

Markdown supports basic HTML tags:

<strong>Bold using HTML</strong>
<em>Italic using HTML</em>
<u>Underlined text</u>
<mark>Highlighted text</mark>

<details>
<summary>Click to expand</summary>
This content is hidden by default and can be revealed by clicking the summary.
</details>

## Advanced Features

### Footnotes

Here's a sentence with a footnote[^1].

Another sentence with a footnote[^note].

[^1]: This is the first footnote.
[^note]: This is the second footnote with a custom identifier.

### Definition Lists

Term 1
: Definition 1

Term 2
: Definition 2a
: Definition 2b

### Abbreviations

The HTML specification is maintained by the W3C.

*[HTML]: Hyper Text Markup Language
*[W3C]: World Wide Web Consortium

## Conclusion

This blog post covers all the essential markdown syntax you'll need for writing rich, formatted content. From basic text formatting to advanced features like tables and code blocks, markdown provides a simple yet powerful way to structure your writing.

Remember to test your markdown in your specific renderer, as some features may vary between different markdown processors.
`;

async function seedBlogPost() {
  // This script is designed to work with Cloudflare D1 via wrangler
  console.log('To seed the blog post, run the following commands:');
  console.log('');
  console.log('For local database:');
  console.log(`bun wrangler d1 execute DB --local --command "INSERT INTO blogPosts (slug, title, body, publishedDate) VALUES ('complete-markdown-guide', 'Complete Markdown Guide - All Syntax Examples', '${markdownContent.replace(/'/g, "''")}', ${Math.floor(Date.now() / 1000)});"`);
  console.log('');
  console.log('For production database:');
  console.log(`bun wrangler d1 execute DB --remote --command "INSERT INTO blogPosts (slug, title, body, publishedDate) VALUES ('complete-markdown-guide', 'Complete Markdown Guide - All Syntax Examples', '${markdownContent.replace(/'/g, "''")}', ${Math.floor(Date.now() / 1000)});"`);
  console.log('');
  console.log('Or run this script directly with the database connection:');
  
  // If we have access to the database context, we could insert directly
  // But for this setup, we'll output the commands to run manually
}

if (import.meta.main) {
  seedBlogPost();
}

export { markdownContent };