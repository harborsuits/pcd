import { getTradeDisplayName, isKnownTrade } from "@/lib/categoryServices";

export type Testimonial = {
  quote: (businessName: string, city: string, tradeName?: string) => string;
  author: (city: string) => string;
};

const generic: Testimonial[] = [
  {
    quote: (name, city) =>
      `"Reliable, professional, and easy to work with. I'd recommend ${name} to anyone in ${city}."`,
    author: (city) => `— Local Customer, ${city}`,
  },
  {
    quote: (name) =>
      `"Quick response, great communication, and quality work. ${name} made the whole process stress-free."`,
    author: (city) => `— Satisfied Client, ${city}`,
  },
  {
    quote: (name) =>
      `"Showed up on time, explained everything clearly, and delivered exactly what was promised. Highly recommended."`,
    author: (city) => `— Customer in ${city}`,
  },
  {
    quote: (name) =>
      `"Fair pricing and excellent service. I'd absolutely call ${name} again."`,
    author: (city) => `— Repeat Customer, ${city}`,
  },
  {
    quote: (name, city) =>
      `"Outstanding work and attention to detail. ${name} is the real deal in ${city}."`,
    author: (city) => `— Happy Homeowner, ${city}`,
  },
  {
    quote: (name) =>
      `"From the first call to the finished job, everything was smooth. Would definitely hire again."`,
    author: (city) => `— Verified Customer, ${city}`,
  },
];

const tradePools: Record<string, Testimonial[]> = {
  plumber: [
    {
      quote: (name, city) =>
        `"We had an urgent leak and ${name} responded fast. Clean work, fair pricing, and great communication."`,
      author: (city) => `— Homeowner, ${city}`,
    },
    {
      quote: (name) =>
        `"Professional service from start to finish. They diagnosed the problem quickly and fixed it the right way."`,
      author: (city) => `— Customer, ${city}`,
    },
    {
      quote: (name, city) =>
        `"No mess, no hassle. ${name} is now our go-to plumber in ${city}."`,
      author: (city) => `— Repeat Customer, ${city}`,
    },
  ],
  electrician: [
    {
      quote: (name) =>
        `"They were professional, safety-focused, and explained everything clearly. Great experience."`,
      author: (city) => `— Homeowner, ${city}`,
    },
    {
      quote: (name, city) =>
        `"Fast scheduling and quality work. ${name} is now our go-to electrician in ${city}."`,
      author: (city) => `— Local Customer, ${city}`,
    },
    {
      quote: (name) =>
        `"Honest pricing and expert work. They fixed issues the last guy missed."`,
      author: (city) => `— Satisfied Customer, ${city}`,
    },
  ],
  roofer: [
    {
      quote: (name) =>
        `"Great workmanship and communication. The job was completed on schedule and looks fantastic."`,
      author: (city) => `— Homeowner, ${city}`,
    },
    {
      quote: (name, city) =>
        `"Transparent estimate, no surprises, and solid results. Highly recommend ${name} in ${city}."`,
      author: (city) => `— Customer, ${city}`,
    },
    {
      quote: (name) =>
        `"They did a thorough inspection and explained all our options. Quality roof work at a fair price."`,
      author: (city) => `— Happy Homeowner, ${city}`,
    },
  ],
  hvac: [
    {
      quote: (name) =>
        `"Quick diagnosis and a clear explanation of options. Efficient, professional service."`,
      author: (city) => `— Homeowner, ${city}`,
    },
    {
      quote: (name, city) =>
        `"Our AC was out in the middle of summer and ${name} came same-day. Lifesavers!"`,
      author: (city) => `— Customer, ${city}`,
    },
    {
      quote: (name) =>
        `"Honest about what we actually needed. Didn't try to upsell unnecessary repairs."`,
      author: (city) => `— Repeat Customer, ${city}`,
    },
  ],
  landscaper: [
    {
      quote: (name) =>
        `"Transformed our backyard into something we're proud of. Creative vision and solid execution."`,
      author: (city) => `— Homeowner, ${city}`,
    },
    {
      quote: (name, city) =>
        `"Reliable, on-time, and our yard has never looked better. ${name} is the best in ${city}."`,
      author: (city) => `— Satisfied Customer, ${city}`,
    },
  ],
  painter: [
    {
      quote: (name) =>
        `"Clean lines, no mess, and they finished ahead of schedule. The house looks brand new."`,
      author: (city) => `— Homeowner, ${city}`,
    },
    {
      quote: (name, city) =>
        `"Attention to detail that you don't see often. ${name} takes pride in their work."`,
      author: (city) => `— Customer, ${city}`,
    },
  ],
  cleaner: [
    {
      quote: (name) =>
        `"Thorough, reliable, and trustworthy. Our office has never been cleaner."`,
      author: (city) => `— Business Owner, ${city}`,
    },
    {
      quote: (name, city) =>
        `"Consistent quality every time. ${name} is our go-to cleaning service in ${city}."`,
      author: (city) => `— Repeat Customer, ${city}`,
    },
  ],
  contractor: [
    {
      quote: (name) =>
        `"Managed the whole project smoothly. On budget, on time, and great communication throughout."`,
      author: (city) => `— Homeowner, ${city}`,
    },
    {
      quote: (name, city) =>
        `"Quality craftsmanship and a team that actually shows up when they say they will. Rare in ${city}."`,
      author: (city) => `— Customer, ${city}`,
    },
  ],
};

function hashStringToInt(input: string): number {
  // Stable, deterministic hash (FNV-1a-ish)
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function getStableTestimonials(opts: {
  businessName: string;
  city: string;
  templateType: string;
  count?: number;
}): Array<{ quote: string; author: string }> {
  const { businessName, city, templateType } = opts;
  const count = opts.count ?? 2;

  const known = isKnownTrade(templateType);
  const tradeName = known ? getTradeDisplayName(templateType) : undefined;

  const pool = known && tradePools[templateType]
    ? [...tradePools[templateType], ...generic]
    : generic;

  // stable selection per business + trade
  const seed = hashStringToInt(`${businessName}|${city}|${templateType}`);
  const picks: number[] = [];

  for (let i = 0; i < Math.min(count, pool.length); i++) {
    // jump around deterministically
    const idx = (seed + i * 97) % pool.length;
    if (!picks.includes(idx)) picks.push(idx);
  }

  return picks.map((idx) => ({
    quote: pool[idx].quote(businessName, city, tradeName),
    author: pool[idx].author(city),
  }));
}
