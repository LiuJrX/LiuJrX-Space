import { defineCollection, z } from "astro:content";

const notes = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    publish: z.boolean(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date(),
    summary: z.string(),
    tags: z.array(z.string())
  })
});

export const collections = { notes };
