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
    title: "Why Most Maine Small Business Websites Lose Customers (And How to Fix It)",
    date: "2026-05-14",
    excerpt:
      "If your website hasn't been updated in the last two years, it's probably costing you customers right now. Here's what to look for and how to fix it fast.",
    metaTitle: "Why Maine Small Business Websites Lose Customers",
    metaDescription:
      "If your Maine small business website is more than two years old, it's probably losing customers. Here are the five issues to fix first.",
    body: `
<p>Most Maine small business owners we talk to assume their website is "fine." It loads. It has their phone number on it somewhere. It hasn't broken. So they leave it alone for years.</p>
<p>The problem is that "fine" in 2020 is broken in 2026. Customers expect a different experience now, and when they don't get it, they hit the back button and call the next business on the list. Here are the five things quietly costing you customers — and what to do about each one.</p>

<h2>1. The mobile experience is rough</h2>
<p>Over 70% of the people landing on your site are on a phone. If they have to pinch to zoom, scroll sideways to read a paragraph, or tap a phone number that isn't actually clickable, they're gone. The fix is straightforward: a real mobile-first layout where every button is thumb-sized, every phone number opens the dialer, and every form fits the screen.</p>

<h2>2. The site loads too slowly</h2>
<p>If your homepage takes more than three seconds to show up, half of your visitors leave before it finishes. Heavy uncompressed images from the original build are usually the culprit, along with bloated themes and tracking scripts nobody's using anymore. A fast site isn't a luxury — it's the difference between a customer landing on your page and a customer landing on a competitor's.</p>

<h2>3. There's no clear next step</h2>
<p>You'd be surprised how many Maine business sites bury the contact info in the footer and never tell the visitor what to do. Every page should have one obvious call to action above the fold — call us, book online, request a quote, get directions. Pick one. Make it loud. The visitor shouldn't have to think.</p>

<h2>4. The contact form is broken</h2>
<p>This one is brutal. We audit a lot of sites where the contact form looks like it works — the success message even pops up when you submit it — but the email never reaches the owner. The form was set up years ago against an email address nobody checks anymore, or the SMTP credentials expired, or the spam filter is eating every submission. If you haven't tested your form from an outside email this month, assume it's broken.</p>

<h2>5. Google can't tell what you do or where you are</h2>
<p>If your site doesn't have your town and what you do in the page title, headings, and a Local Business schema block, Google is guessing. And Google guesses badly. A landscaper in Damariscotta should not be invisible when someone three miles away searches "landscaper near me." Local SEO isn't magic — it's making sure the page actually says, in clear language, who you are, what you do, and which towns you serve.</p>

<h2>Each of these costs you a real customer</h2>
<p>Not in theory. Today. The person who couldn't load your site on their phone called the next contractor. The person whose form vanished decided you don't take new clients. The person who couldn't find you on Google didn't know you existed. Every one of those is a job you didn't get — and the easiest jobs to win are the ones already trying to reach you.</p>

<p>The good news is none of this is hard to fix. Most of it can be sorted in a single rebuild, and the difference shows up in the first month.</p>
    `.trim(),
  },
  {
    slug: "ai-receptionist-for-small-business-maine",
    title: "What Is an AI Receptionist and Why Maine Contractors Are Using One",
    date: "2026-05-14",
    excerpt:
      "Maine contractors are busy. Missed calls mean missed jobs. Here's how an AI phone receptionist keeps leads from slipping through the cracks.",
    metaTitle: "AI Receptionist for Maine Contractors",
    metaDescription:
      "An AI phone receptionist answers calls 24/7, books estimates, and qualifies leads — so Maine contractors stop losing jobs to missed calls.",
    body: `
<p>Ask any Maine contractor what their biggest lead leak is and you'll hear the same answer: missed calls. You're up on a roof. You're under a sink. You're driving between job sites with no signal. The phone rings, you can't get to it, and the customer leaves a voicemail — or, more often, doesn't.</p>

<h2>The missed call problem</h2>
<p>Industry research puts it bluntly: roughly 62% of small-business calls go to voicemail during busy hours, and about 85% of people who reach voicemail never call back. They just call the next number. For a contractor, that's a $5,000 roof job lost to a thirty-second window where you couldn't pick up. Multiply that across a season and the number gets ugly.</p>

<h2>What an AI receptionist actually does</h2>
<p>An AI phone receptionist is a 24/7 voice assistant trained on your business. When a customer calls and you can't pick up — or after hours — it answers in a natural voice, asks the right questions, books estimates straight into your calendar, and texts you a summary of every conversation. It's not a robocall script. It's a real conversation, and most callers don't even realize they're not talking to a human.</p>

<p>It can answer the questions you'd answer yourself: do you serve this town, what's your typical lead time, do you do free estimates, can someone come look at storm damage tomorrow morning. And it can route a true emergency straight to your cell.</p>

<h2>How after-hours works</h2>
<p>This is where the real money is. After-hours calls are usually your most motivated leads — somebody noticed water in the basement at 9pm and they're calling the first three plumbers Google shows them. The first one to actually answer wins the job. If your AI receptionist is the only one that picks up at 9pm, you just won the job before your competitors woke up.</p>

<h2>Real scenario</h2>
<p>A roofer in Midcoast Maine gets a call at 9:14pm during a windstorm. A homeowner has shingles in the yard and water coming through the ceiling. The AI receptionist answers, gathers the address, confirms it's an emergency, books a 7am inspection slot, and texts the roofer a summary before bed. The roofer wakes up to a confirmed job. The homeowner wakes up knowing someone is coming. Without the AI, that call would have gone to voicemail and the homeowner would have called the next roofer on the list.</p>

<h2>How fast it is to set up</h2>
<p>Most setups go live in the same week. We point your existing business number at the AI, train it on your services, hours, and pricing, and run test calls until it sounds right. You don't change your number. You don't buy new hardware. You don't hire anyone.</p>

<p>For a Maine trades business that's already busy, an AI receptionist isn't a luxury — it's the cheapest extra employee you'll ever hire, and the only one that works at 9pm on a Sunday.</p>
    `.trim(),
  },
  {
    slug: "web-design-midcoast-maine-what-to-look-for",
    title: "Hiring a Web Designer in Midcoast Maine? Ask These 5 Questions First",
    date: "2026-05-14",
    excerpt:
      "Not all web designers are equal. Before you hire someone to build your business website, make sure you ask these five questions — most designers won't like them.",
    metaTitle: "5 Questions to Ask a Midcoast Maine Web Designer",
    metaDescription:
      "Before you hire a Midcoast Maine web designer, ask these five questions. Most designers won't love them — but the answers will save you thousands.",
    body: `
<p>There's no license required to call yourself a web designer in Maine. Anyone with a laptop can take your money, hand you a Squarespace template, and disappear. So before you sign anything, ask these five questions. The good designers will answer them straight. The bad ones will dodge.</p>

<h2>1. Do I own the site, or do you?</h2>
<p>This is the most expensive question nobody asks. Some designers build your site on their own platform, in their own account, on their own hosting — and the day you stop paying them, the site goes dark. You don't own the domain, the files, or the design. A good answer sounds like: "You own the domain, you own the code, you own the content. If we ever part ways, you walk away with everything."</p>

<h2>2. Will it actually show up on Google?</h2>
<p>"We do SEO" is a meaningless answer. Push for specifics. A real answer mentions semantic HTML, fast load times, mobile-first layout, structured data (schema markup), and local-business signals — your town, your service area, your category. If they say "we'll submit you to Google," run. Google has not had a submission form since roughly 2018.</p>

<h2>3. What happens when something breaks?</h2>
<p>Websites break. Plugins update, hosting changes, forms stop sending. The question isn't whether yours will break — it's who fixes it and how fast. A good designer either includes ongoing care in a clear monthly plan, or names exactly who to call and what the response time is. "Email me whenever" is not a support plan; it's a problem waiting to happen.</p>

<h2>4. Can I update it myself without breaking it?</h2>
<p>You're going to want to swap a photo, fix a typo, change your hours, add a new service. If every change requires hiring the designer back at $150/hour, you're trapped. A good site has a simple admin area where you can edit text and swap images without touching code. A great designer also leaves you with a one-page guide to the things you're most likely to change.</p>

<h2>5. Do you actually understand Maine small businesses?</h2>
<p>A designer who's only built sites for tech startups in Boston is going to give you a tech startup site. That's not what a Damariscotta plumber, a Camden inn, or a Boothbay gallery needs. Ask to see work for businesses like yours. Ask if they understand seasonal traffic, how Mainers actually search, what trust signals matter to a local customer, and why the contact info needs to be the loudest thing on the page. A designer who has built for Maine knows these things without being told.</p>

<h2>The designers who don't like these questions are the ones you shouldn't hire</h2>
<p>Every one of these questions has a clear, honest answer. If a designer hedges, gets defensive, or starts using vague language, take the meeting as your answer and move on. Your website is going to be the front door to your business for the next five years. It's worth twenty minutes of uncomfortable questions up front to make sure you're hiring someone who'll still be picking up the phone in year three.</p>
    `.trim(),
  },
];
