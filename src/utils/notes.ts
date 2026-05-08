import { getCollection, type CollectionEntry } from "astro:content";

export type NoteEntry = CollectionEntry<"notes">;

export function getNotePathSlug(note: NoteEntry | { slug: string }) {
  return note.slug.replace(/^generated\//, "");
}

export async function getPublishedNotes() {
  const notes = await getCollection("notes", ({ data }) => data.publish);
  return notes.sort(
    (a, b) => b.data.updatedDate.getTime() - a.data.updatedDate.getTime()
  );
}

export function getAllTags(notes: NoteEntry[]) {
  return [...new Set(notes.flatMap((note) => note.data.tags))].sort((a, b) =>
    a.localeCompare(b, "zh-Hans-CN")
  );
}

export function getTagSlug(tag: string) {
  return Buffer.from(tag, "utf8").toString("base64url");
}

export function getAdjacentNotes(notes: NoteEntry[], slug: string) {
  const index = notes.findIndex((note) => note.slug === slug);
  return {
    previous: index < notes.length - 1 ? notes[index + 1] : undefined,
    next: index > 0 ? notes[index - 1] : undefined
  };
}
