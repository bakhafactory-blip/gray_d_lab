// Update scripts/blog-posts.json, then run node scripts/build-blog.mjs.
// Check the committed output with node scripts/build-blog.mjs --check.
// New article HTML must contain blog:head, blog:schema, blog:title and
// blog:footer comment pairs. Edit the prose outside these generated regions.
import { readFile, writeFile } from "node:fs/promises";

const origin = "https://graydlab.ai.kr";
const suffix = "그레이디랩 (GRaY D. Lab)";
const author = {
  "@type": "Person",
  name: "감우식 (Kris W)",
  url: origin + "/kris-w.html"
};

function escape(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function updateRegion(html, name, content) {
  const start = "<!-- blog:" + name + ":start -->";
  const end = "<!-- blog:" + name + ":end -->";
  const first = html.indexOf(start);
  const last = html.indexOf(end);
  if (first < 0 || last < first || html.lastIndexOf(start) !== first || html.lastIndexOf(end) !== last) {
    throw new Error("Missing or duplicated generated region: " + name);
  }
  return html.slice(0, first + start.length) + "\n" + content + "\n" + html.slice(last);
}

function link(path, text) {
  return '<a href="/' + escape(path) + '">' + escape(text) + "</a>";
}

function publishPost(html, post, related, guidePath) {
  const url = origin + "/" + post.path;
  const title = post.title + " | " + suffix;
  const meta = (key, value) =>
    '<meta ' + (key.startsWith("og:") ? "property" : "name") + '="' + key + '" content="' + escape(value) + '">';
  const schema = {
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    inLanguage: "ko",
    datePublished: post.published,
    ...(post.modified ? { dateModified: post.modified } : {}),
    mainEntityOfPage: url,
    image: post.image,
    author,
    publisher: { "@type": "Organization", name: "GRaY D. Lab", url: origin + "/" }
  };
  const graph = { "@context": "https://schema.org", "@graph": [schema] };
  if (post.faq) graph["@graph"].push(post.faq);
  if (post.faq) {
    for (const { name, acceptedAnswer } of post.faq.mainEntity) {
      if (!html.includes(escape(name)) || !html.includes(escape(acceptedAnswer.text))) {
        throw new Error("FAQ schema and visible copy disagree: " + post.path + " / " + name);
      }
    }
  }
  html = updateRegion(html, "head", [
    "<title>" + escape(title) + "</title>",
    meta("description", post.description),
    '<link rel="canonical" href="' + escape(url) + '">',
    meta("og:type", "article"),
    meta("og:title", title),
    meta("og:description", post.description),
    meta("og:url", url),
    meta("og:site_name", "GRaY D. Lab"),
    meta("og:image", post.ogImage)
  ].join("\n"));
  html = updateRegion(html, "schema",
    '<script type="application/ld+json">\n' +
    JSON.stringify(graph, null, 2).replace(/</g, "\\u003c") + "\n</script>");
  html = updateRegion(html, "title", "<h1>" + escape(post.title) + "</h1>");
  return updateRegion(html, "footer", [
    '<nav aria-labelledby="related-guides-title">',
    '  <h2 id="related-guides-title">함께 보면 좋은 제작 가이드</h2>',
    ...(related.length ? [
      "  <ul>",
      ...related.map(item => "    <li>" + link(item.path, item.title) + "</li>"),
      "  </ul>"
    ] : []),
    "  <p>" + link(guidePath, "제작 가이드 전체 보기") + "</p>",
    "</nav>",
    '<section class="inquiry" aria-labelledby="guide-inquiry-title">',
    '  <h2 id="guide-inquiry-title">프로젝트 제작 상담</h2>',
    '  <a class="cta" href="/?service=production-guide#contact" data-event="quote_request_click">제작 문의하기 →</a>',
    "</section>"
  ].join("\n"));
}

function card(post, heading, withDate = false) {
  const formattedDate = withDate
    ? '<p class="tag"><time datetime="' + escape(post.published) + '">' +
      new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(post.published)) +
      "</time></p>"
    : "";
  return (withDate ? '<article class="card">' : "<article>") +
    formattedDate + "<" + heading + ">" + link(post.path, post.title) + "</" + heading + ">" +
    "<p>" + escape(post.description) + "</p></article>";
}

function sitemapEntry(path, date) {
  return "  <url><loc>" + escape(origin + "/" + path) + "</loc><lastmod>" +
    escape(date) + "</lastmod></url>";
}

export function generateBlog(files, { guidePath, guideModified, posts }) {
  const orderedPosts = [...posts].sort((a, b) => b.published.localeCompare(a.published));
  // Keep the configured order when two posts have the same publication date.
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(guideModified)) throw new Error("Invalid guide modification date");
  const seen = new Set([guidePath]);
  const output = {};
  for (const post of orderedPosts) {
    if (seen.has(post.path) || !files[post.path]) throw new Error("Invalid or duplicate article: " + post.path);
    if (!datePattern.test(post.published) || (post.modified &&
      (!datePattern.test(post.modified) || post.modified < post.published))) {
      throw new Error("Invalid article dates: " + post.path);
    }
    seen.add(post.path);
    const related = orderedPosts.filter(item => item.path !== post.path).slice(0, 2);
    output[post.path] = publishPost(files[post.path], post, related, guidePath);
  }
  output[guidePath] = updateRegion(files[guidePath], "listing",
    orderedPosts.map(post => "    " + card(post, "h2", true)).join("\n"));
  output["index.html"] = updateRegion(files["index.html"], "latest", [
    '<section id="latest-production-guides" class="home-seo" aria-labelledby="latest-production-guides-title">',
    '  <h2 id="latest-production-guides-title">최신 제작 가이드</h2>',
    '  <div class="grid">',
    ...orderedPosts.slice(0, 2).map(post => "    " + card(post, "h3")),
    "  </div>",
    "  <p>" + link(guidePath, "제작 가이드 전체 보기") + "</p>",
    "</section>"
  ].join("\n"));
  output["sitemap.xml"] = updateRegion(files["sitemap.xml"], "sitemap", [
    sitemapEntry(guidePath, guideModified),
    ...orderedPosts.map(post => sitemapEntry(post.path, post.modified || post.published))
  ].join("\n"));
  return output;
}

const root = new URL("../", import.meta.url);
const data = JSON.parse(await readFile(new URL("scripts/blog-posts.json", root), "utf8"));
const paths = ["index.html", "sitemap.xml", data.guidePath, ...data.posts.map(post => post.path)];
const files = Object.fromEntries(await Promise.all(paths.map(async path =>
  [path, (await readFile(new URL(path, root), "utf8")).replace(/\r\n/g, "\n")]
)));
const generated = generateBlog(files, data);
for (const [path, content] of Object.entries(generated)) {
  if (content === files[path]) continue;
  if (process.argv.includes("--check")) {
    console.error("Regenerate " + path + " with node scripts/build-blog.mjs");
    process.exitCode = 1;
  } else {
    await writeFile(new URL(path, root), content, "utf8");
  }
}
