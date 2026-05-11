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
  },
  {
    title: "AI Agents Code",
    description: "一个模块化的 AI Agent 代码实验仓库，围绕 ReAct、记忆、工具调用、自反思与 Agent Loop 等核心概念做可运行实现与拆解。",
    github: "https://github.com/LiuJrX/ai-agents-code",
    tags: ["AI Agent", "Tools", "Memory", "Loop"],
    featured: true,
    order: 2
  },
  {
    title: "ai-trading-harness",
    description: "经验策略内核 + 数据/舆情感知 + 量化验证 + Harness 风控与审计的 Agent 系统",
    github: "https://github.com/LiuJrX/ai-trading-harness",
    tags: ["Harness", "量化", "Trading"],
    featured: true,
    order: 3
  }
];
