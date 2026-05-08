export type Project = {
  title: string;
  description: string;
  github: string;
  demo?: string;
  tags: string[];
  featured: boolean;
  cover?: string;
  order?: number;
};

export const projects: Project[] = [
  {
    title: "LiuJrX-Space",
    description: "一个以 Obsidian 为内容源的公开笔记空间，强调可读性、卡片式索引和主题聚合。",
    github: "https://github.com/LiuJrX/LiuJrX-Space",
    tags: ["Astro", "Obsidian"],
    featured: true,
    order: 1
  }
];
