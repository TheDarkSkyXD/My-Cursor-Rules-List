# SEO rules for vibe coding

These rules guide AI agents in building SEO-friendly web applications, especially for non-technical vibe coding with AI tools.

While many AI-generated apps default to client-side rendering (CSR), server-side rendering (SSR) is strongly preferred for optimal SEO performance. If SSR is not possible, adhering strictly to these guidelines becomes even more critical.

## Rendering strategy

-   **Prioritize Server-Side Rendering (SSR)**
    -   Whenever feasible, configure the application to use SSR. This ensures search engines can easily crawl and index content without relying on JavaScript execution.
    -   Benefits of SSR include faster initial page loads, easier indexing by search engines, and better compatibility with crawlers that don't execute JavaScript effectively.
-   **Optimize for Client-Side Rendering (CSR) if SSR is impossible**
    -   If CSR must be used, implement dynamic rendering (serving SSR versions to bots, CSR to users) or ensure the framework properly handles prerendering or hydration for SEO.
    -   Pay extra attention to initial load performance and ensure critical content is available without extensive JavaScript execution.
    -   Monitor Google Search Console for indexing issues related to JavaScript.

## Core on-page SEO

-   **Title Tags (`<title>`)**
    -   Generate **unique**, descriptive title tags for **every single indexable page**. This is crucial even for Client-Side Rendered (CSR) applications, which sometimes default to a single title across multiple views.
    -   Include the primary keyword(s) near the beginning.
    -   Keep titles concise (typically 50-60 characters).
-   **Meta Descriptions (`<meta name="description">`)**
    -   Write unique, compelling meta descriptions for each page.
    -   Include relevant keywords naturally.
    -   Aim for 150-160 characters.
    -   Treat descriptions as "ad copy" to encourage clicks from search results.
-   **Heading Tags (`<h1>`, `<h2>`, etc.)**
    -   Use a single `<h1>` tag per page for the main topic/title.
    -   Structure content logically using `<h2>` and `<h3>` tags in hierarchical order. Avoid using `<h4>` through `<h6>` unless semantically required for very complex document structures, which is rare for typical web pages.
    -   Incorporate relevant keywords naturally within headings.
    -   Don't skip heading levels (e.g., don't go from `<h1>` to `<h3>`).

## Content & images

-   **Image Optimization**
    -   Use descriptive `alt` attributes for all images, explaining the image content for accessibility and SEO.
    -   Choose appropriate image formats (e.g., WebP, AVIF for efficiency).
    -   Compress images to reduce file size without sacrificing quality.
    -   Use descriptive file names (e.g., `red-running-shoes.jpg` instead of `IMG_1234.jpg`).
    -   Implement lazy loading for images below the fold.
-   **Content Quality**
    -   Ensure content is unique, valuable, and relevant to the target audience and keywords.
    -   Structure content for readability with short paragraphs, bullet points, and headings.
    -   Naturally integrate target keywords within the body text.

## Technical SEO & performance

-   **Performance Optimization**
    -   Minimize JavaScript and CSS file sizes (minification, tree-shaking).
    -   Optimize server response times.
    -   Leverage browser caching.
    -   Prioritize loading of above-the-fold content.
    -   Aim for good Core Web Vitals scores (LCP, FID/INP, CLS).
-   **Mobile Optimization**
    -   Ensure the site is fully responsive and provides a good user experience on all devices.
    -   Use mobile-friendly navigation and tap targets.
    -   Test on various screen sizes and devices.
-   **URL Structure**
    -   Use clean, descriptive, and user-friendly URLs.
    -   Incorporate relevant keywords where appropriate.
    -   Use hyphens (-) to separate words.
    -   Keep URLs relatively short and maintain a **flatter structure** (fewer subdirectories) where possible.
-   **Internal Linking & Site Navigation**
    -   Link relevant pages within the website together using descriptive anchor text.
    -   Ensure **every page is reachable within 4 clicks or less** from the homepage to facilitate crawling and user navigation.
    -   Help users and search engines discover content and understand site structure.

## Structured data & social media

-   **Schema Markup (Structured Data)**
    -   Implement relevant Schema.org markup (e.g., `Article`, `Product`, `LocalBusiness`, `FAQPage`) using JSON-LD format.
    -   Helps search engines understand the context of content and can enable rich snippets in search results.
    -   Validate structured data implementation.
-   **Social Media Integration**
    -   Include Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`) for better sharing previews on platforms like Facebook and LinkedIn.
    -   Include Twitter Card tags (`twitter:card`, `twitter:title`, etc.) for optimized sharing on Twitter/X.

## Local SEO (if applicable)

-   **NAP Consistency**
    -   If the app represents a physical business, ensure Name, Address, and Phone number (NAP) are consistent across the site and relevant online directories.
-   **Local Schema**
    -   Use `LocalBusiness` schema markup with detailed information (address, phone, hours, etc.).
-   **Location Pages**
    -   If serving multiple locations, create dedicated pages for each one.

## Robots & sitemaps

-   **`robots.txt`**
    -   Create a `robots.txt` file to guide search engine crawlers, blocking access to non-public or irrelevant sections (e.g., admin areas, duplicate content).
    -   Include the path to the XML sitemap.
-   **XML Sitemap**
    -   Generate an XML sitemap listing all indexable URLs.
    -   Keep the sitemap updated and submit it via Google Search Console and Bing Webmaster Tools.

## Canonicalization & pagination

-   **Canonical Tags (`<link rel="canonical">`)**
    -   Implement `rel="canonical"` tags on all indexable pages to specify the preferred URL version, preventing duplicate content issues arising from parameters, tracking codes, or slight URL variations.
    -   Ensure the canonical URL points to the correct, final version of the page.
-   **Pagination Handling**
    -   For paginated content series (e.g., blog archives, product categories), ensure each page has a unique title and description (e.g., "Page 2 of X").
    -   Use `rel="canonical"` on component pages (page 2, 3, etc.) pointing to themselves.
    -   Ensure clear crawl paths to all paginated pages (e.g., links from page 1 to 2, 2 to 3, etc.).
    -   *Note: `rel="prev/next"` is no longer used by Google Search but may be used by other search engines or tools. Focus on clear linking and self-referencing canonicals for Google.*
-   **URL Parameter Handling**
    -   Use canonical tags to consolidate URLs with non-essential parameters (e.g., tracking, sorting, filtering parameters that don't significantly change content).
    -   Use Google Search Console's URL Parameters tool (if necessary) to guide Google on how to handle specific parameters, though canonicals are generally preferred.

## E-E-A-T & author authority

-   **Establish Expertise, Experience, Authoritativeness, and Trustworthiness (E-E-A-T)**
    -   Ensure content is accurate, well-researched, and demonstrates expertise in the subject matter.
    -   Clearly identify authors for content, especially for YMYL (Your Money Your Life) topics.
-   **Author Pages & Biographies**
    -   Create dedicated biography pages for authors, showcasing their credentials, experience, and expertise.
    -   Link content back to the author's bio page.
-   **`Person` Schema Markup**
    -   Use `Person` schema markup on author bio pages to explicitly define the author's identity, affiliations, and relevant links (e.g., social profiles, official website) for search engines.
    -   Link articles to the author's `Person` entity using `author` property in `Article` schema.
-   **Build Trust Signals**
    -   Include clear contact information, privacy policies, and terms of service.
    -   Gather positive reviews and testimonials (use `Review` or `AggregateRating` schema).
    -   Cite reputable external sources within content where appropriate.
    -   Encourage and acquire links/mentions from other authoritative websites within the niche. 
