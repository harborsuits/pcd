export interface BlogPost {
  slug: string;
  title: string;
  date: string; // ISO YYYY-MM-DD
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  body: string; // HTML
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "why-maine-small-business-websites-lose-customers",
    title: "Five Website Checks for Maine Small Businesses",
    date: "2026-05-14",
    excerpt:
      "Check mobile layouts, loading, contact options, forms, and local business information before deciding whether your website needs a fix or a rebuild.",
    metaTitle: "Why Maine Small Business Websites Lose Customers",
    metaDescription:
      "Five practical website checks for Maine small businesses: mobile layouts, load times, clear contact options, working forms, and accurate local information.",
    body: `
<p>A website’s age alone does not tell you whether it needs replacing. Start by checking the tasks a visitor actually needs to complete: understand your services, see your work, find your location, and contact you.</p>
<h2>1. Check the mobile experience</h2><p>Open the site on a phone. Read the service descriptions, tap the phone number, and try the contact fields. Look for sideways scrolling, overlapping text, tiny controls, and images that obscure information. A focused layout correction may be enough; a full rebuild is not always necessary.</p>
<h2>2. Check what loads first</h2><p>Try a fresh visit on a mobile connection and use a performance tool such as PageSpeed Insights to identify delays. Large images, unnecessary scripts, and heavy page effects can add loading work. Compress and size images appropriately, defer nonessential code, and check again. Lab measurements are diagnostics, not a promise of real-world performance for every visitor.</p>
<h2>3. Make the next step clear</h2><p>Choose the action that fits each page: call, ask a question, request a quote, book a time, or get directions. Use a clear label and keep the information needed for that action nearby. Do not make someone create an account merely to ask a basic question.</p>
<h2>4. Test the whole contact path</h2><p>A success message does not establish that a message reached the right person. With permission, send a clearly labeled test and confirm receipt in the actual inbox or workspace, including spam folders. Check error messages, required fields, and phone typing. Keep a direct email or phone option available if the form fails.</p>
<h2>5. Keep local information accurate</h2><p>Use clear page titles, useful headings, and consistent business name, contact details, and genuine service areas. Structured data can help search engines interpret information that is also visible on the page. Google Search Console can help you inspect indexing and submit a sitemap, while an accurate Google Business Profile supports local discovery. None of these guarantees a ranking.</p>
<h2>Prioritize a focused next step</h2><p>Write down the issue, how it affects the visitor, and how you will check the correction. Fix broken contact paths and unreadable pages first. Decide between small improvements and a rebuild based on the actual problems, not a guessed customer-loss figure.</p><p><a href="/get-demo?service=review">Ask Ben for a free website review</a>, or <a href="/pricing">compare starting scopes and prices</a>. Work and pricing are agreed before a project begins.</p>
    `.trim(),
  },
  {
    slug: "ai-receptionist-for-small-business-maine",
    title: "How an AI Receptionist Could Support a Maine Contractor",
    date: "2026-05-14",
    excerpt:
      "Explore what AI call answering can do, what needs human follow-up, and how setup, ongoing management, and usage are scoped for a contractor.",
    metaTitle: "AI Receptionist for Maine Contractors",
    metaDescription:
      "Learn how AI call answering could support a Maine contractor, including approved answers, human handoff, optional scheduling, and usage-based costs.",
    body: `
<p>When a contractor is on a job, a phone call may arrive at an inconvenient time. Voicemail, staff coverage, a call-answering service, and AI answering are different options. The right choice depends on the questions callers ask and the follow-up your team can provide.</p>
<h2>What an AI receptionist can do</h2><p>A configured voice assistant can use approved business information to answer common questions and collect an inquiry. Define the service area, hours, supported services, and what it should say when it does not know an answer. It should be clear that callers are interacting with an automated assistant.</p><p>Calendar booking, notifications, and call transfers are optional connections, not universal inclusions. Their behavior depends on your phone provider, integrations, and agreed rules. An assistant cannot independently confirm a job or promise a response your team has not authorized.</p>
<h2>Where a person needs to take over</h2><p>AI can mishear a caller or give an incorrect response. Pricing exceptions, uncertain scheduling, complaints, and urgent requests need an agreed human follow-up path. The assistant is not an emergency service and cannot guarantee an immediate transfer or response. Callers facing an emergency should use the appropriate emergency service.</p>
<h2>Example: an after-hours estimate inquiry</h2><p>Imagine a homeowner calling to ask whether you handle exterior repairs in their town. The assistant could answer from the approved service area and collect a description and callback details. Your team then reviews the request and confirms whether it can offer an estimate. This is a hypothetical workflow, not a customer story or a guaranteed booking.</p>
<h2>What to test before activation</h2><p>Try ordinary questions, unclear speech, unsupported services, schedule changes, and requests that need a person. Check what happens when a connection fails, how records reach the team, and what callers hear when no one is available. Agree the limits, disclosure, and fallback before activation. Setup timing depends on scope and provider readiness.</p>
<h2>How costs are scoped</h2><p>Pleasant Cove Design quotes setup and implementation for your business. Ongoing management covers the monitoring, maintenance, support, and tuning defined in the proposal. Usage is measured separately; receptionist activity uses call minutes at agreed rates. The proposal states allowances, billing frequency, additional usage charges, and spending controls. No flat monthly fee includes unlimited calls.</p><p><a href="/ai-receptionist">Explore AI call-answering scope</a> or <a href="/get-demo?service=ai">discuss your business’s call flow with Ben</a>. Optional AI tools are not default website inclusions.</p>
    `.trim(),
  },
  {
    slug: "web-design-midcoast-maine-what-to-look-for",
    title: "Hiring a Web Designer in Midcoast Maine? Ask These 5 Questions First",
    date: "2026-05-14",
    excerpt:
      "Ask about ownership, search visibility, support, editing, and project scope before choosing a web designer for your Maine small business.",
    metaTitle: "5 Questions to Ask a Midcoast Maine Web Designer",
    metaDescription:
      "Choosing a Midcoast Maine web designer? Ask about ownership, technical SEO, support, editing options, and the scope of your business website project.",
    body: `
<p>Before choosing a web designer, ask for clear answers about the work, ownership, support, and costs. A simple site and a connected business system need different scopes. These five questions can help you compare proposals on the same basis.</p>
<h2>1. What will I own and control?</h2><p>Ask who holds the domain account, which website files and content are delivered, and what licenses or hosted services are involved. Clarify access, export options, and what happens if you change providers or stop ongoing care. Ownership and handoff terms belong in the written agreement; they should not be assumed from a sales conversation.</p>
<h2>2. What does technical SEO include?</h2><p>Ask about crawlable pages, useful titles and descriptions, heading structure, mobile layouts, loading performance, canonical URLs, and structured data that matches visible facts. Google Search Console supports URL inspection and sitemap submission. Submission does not guarantee indexing, and indexing does not guarantee ranking. Local discovery also depends on accurate business information, relevance, competition, and trust beyond your website.</p>
<h2>3. What support is included?</h2><p>Clarify hosting, backups, routine maintenance, contact-feature checks, support hours, and editing allowances. Ask how to request work, how additional work is approved, and what third-party outages are outside the provider’s control. Keep larger projects separate from minor maintenance so costs and expectations remain clear.</p>
<h2>4. How will updates work?</h2><p>Discuss the changes you expect to make: hours, photos, services, and event information. Ask whether you can edit them yourself, whether editing tools are in scope, and what managed updates cost. A self-editing interface is one option, not a default requirement for every small website. Agree the approach that fits your time and comfort level.</p>
<h2>5. Does the proposed scope fit my business?</h2><p>Share your real services, customer questions, service area, seasonal needs, and existing tools. Ask to see relevant work and distinguish live client websites from sample concepts. A booking connection, online store, or AI tool should only be included when it solves a defined need, with its costs and ongoing responsibilities stated separately.</p>
<h2>Compare the written scope, not just the headline price</h2><p>List included pages, supplied content, revision and approval steps, launch checks, and ongoing costs. Ask for plain-language clarification when something is unclear. Choose a working relationship and scope you understand, without relying on guaranteed rankings or sales results.</p><p><a href="/pricing">See Pleasant Cove Design’s starting scopes and care terms</a>, or <a href="/get-demo">tell Ben what you need</a>.</p>
    `.trim(),
  },
];
