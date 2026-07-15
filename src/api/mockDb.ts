/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Article, ArticleDetail, Category, Tag, AITool, Interest, UserProfile, AuthResponse, BookmarkItem, ArticlePillar } from '../types/api';

// Seed Data
const DEFAULT_INTERESTS: Interest[] = [
  { id: 'int-1', name: 'Programming', slug: 'programming', description: 'Learn how AI is revolutionizing software engineering, code generation, and debugging.' },
  { id: 'int-2', name: 'Research', slug: 'research', description: 'Stay updated on the latest AI papers, breakthrough models, and academic research.' },
  { id: 'int-3', name: 'Writing', slug: 'writing', description: 'Copywriting, creative writing, and editing with the help of LLMs.' },
  { id: 'int-4', name: 'Design', slug: 'design', description: 'Generative art, UI/UX design tools, and video creation with AI.' },
  { id: 'int-5', name: 'Business', slug: 'business', description: 'Enterprise AI solutions, productivity hacks, and AI-driven business automation.' },
  { id: 'int-6', name: 'Education', slug: 'education', description: 'AI tutors, study assistants, and the future of classroom learning.' },
  { id: 'int-7', name: 'Productivity', slug: 'productivity', description: 'Personal assistant bots, time-management tools, and note-taking systems.' }
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'AI for Students', slug: 'ai-for-students', pillar: 'AIForStudents', description: 'Study guides, AI tutor reviews, and academic productivity tools.' },
  { id: 'cat-2', name: 'AI for Work', slug: 'ai-for-work', pillar: 'AIForWork', description: 'Office productivity, developer tools, and workflow automation.' },
  { id: 'cat-3', name: 'AI News', slug: 'ai-news', pillar: 'AINews', description: 'Daily updates on LLM releases, tech company battles, and AI policy.' },
  { id: 'cat-4', name: 'AI Tool Spotlight', slug: 'ai-tool-spotlight', pillar: 'AIToolSpotlight', description: 'In-depth reviews and use-cases for the newest tools.' },
  { id: 'cat-5', name: 'Future of AI', slug: 'future-of-ai', pillar: 'FutureOfAI', description: 'AGI timelines, hardware breakthroughs, and philosophical implications.' }
];

const DEFAULT_TAGS: Tag[] = [
  { id: 'tag-1', name: 'gpt-6', slug: 'gpt-6' },
  { id: 'tag-2', name: 'study-tools', slug: 'study-tools' },
  { id: 'tag-3', name: 'productivity', slug: 'productivity' },
  { id: 'tag-4', name: 'automation', slug: 'automation' },
  { id: 'tag-5', name: 'coding', slug: 'coding' },
  { id: 'tag-6', name: 'prompting', slug: 'prompting' }
];

const DEFAULT_AI_TOOLS: AITool[] = [
  {
    id: 'tool-1',
    name: 'Cursor AI',
    slug: 'cursor-ai',
    description: 'A custom fork of VS Code equipped with deep, contextual AI. Chat with your codebase, generate entire files, and auto-debug compiler errors.',
    websiteUrl: 'https://cursor.com',
    pricing: 'Free / $20mo',
    rating: 4.9,
    tags: 'coding,productivity',
    isFeaturedToday: true
  },
  {
    id: 'tool-2',
    name: 'Claude 3.5 Sonnet',
    slug: 'claude-3-5-sonnet',
    description: 'Anthropic\'s premier language model. Exceptional coding proficiency, nuanced reasoning, and highly articulate natural language generation.',
    websiteUrl: 'https://claude.ai',
    pricing: 'Free / $20mo',
    rating: 4.8,
    tags: 'writing,coding,productivity',
    isFeaturedToday: false
  },
  {
    id: 'tool-3',
    name: 'v0 by Vercel',
    slug: 'v0-vercel',
    description: 'A generative UI system that creates pristine React, Tailwind, and HTML interfaces from text prompts, ready to drop into codebases.',
    websiteUrl: 'https://v0.dev',
    pricing: 'Free / $20mo',
    rating: 4.7,
    tags: 'coding,design',
    isFeaturedToday: false
  },
  {
    id: 'tool-4',
    name: 'ChatGPT Plus',
    slug: 'chatgpt-plus',
    description: 'OpenAI\'s flagship assistant featuring GPT-4o, Advanced Voice Mode, search capabilities, custom GPTs, and code execution environments.',
    websiteUrl: 'https://chat.openai.com',
    pricing: 'Free / $20mo',
    rating: 4.6,
    tags: 'writing,productivity',
    isFeaturedToday: false
  },
  {
    id: 'tool-5',
    name: 'Midjourney v6',
    slug: 'midjourney-v6',
    description: 'State of the art generative image generator running through Discord. Unrivaled cinematic aesthetic, prompt detail control, and style tuning.',
    websiteUrl: 'https://midjourney.com',
    pricing: '$10 - $120mo',
    rating: 4.5,
    tags: 'design',
    isFeaturedToday: false
  }
];

const DEFAULT_ARTICLES: (ArticleDetail & { published: boolean })[] = [
  {
    id: 'art-1',
    title: 'GPT-6 and the Paradigm Shift in Academic Study',
    slug: 'gpt-6-academic-paradigm-shift',
    summary: 'An inside look at how frontier models are transforming rote memorization into real-time personalized tutoring and critical-thinking collaboration.',
    pillar: 'AIForStudents',
    categoryName: 'AI for Students',
    readTimeMinutes: 5,
    publishedOn: '2026-07-08T09:00:00Z',
    body: `# GPT-6 and the Paradigm Shift in Academic Study

The integration of frontier models in educational environments is sparking a significant evolution. Instead of relying purely on static textbooks or generic online lectures, students are moving toward an era of **fully personalized, real-time synthetic tutors**.

## The Evolution of Study Assistance

Historically, educational technology functioned as a digital filing cabinet—providing access to PDFs, recorded lectures, and flashcards. With the advent of GPT-6 level capabilities, we are witnessing a transition from information retrieval to **cognitive synthesis**.

### Key Advantages of Real-Time Synthesis
- **Dynamic Scaffolding**: Rather than giving the final answer, the AI acts as a Socratic guide, breaking complex proofs down into bite-sized queries.
- **Cognitive Mapping**: The tutor tracks your conceptual gaps over time, noting if you struggle with specific mathematical axioms or grammatical rules.
- **Contextual Analogy**: If you don't understand cellular respiration, the system can explain it using metaphors drawn from computer networks or baking, based on your profile interests.

> "True learning is not the filling of a vessel, but the lighting of a flame. Generative AI allows us to light that flame for every student individually."

## How Students Can Stay Ahead

To get the most out of these tools, students must shift from *passive prompting* to *interactive inquiry*:

1. **Prompt for Method, Not Answers**: Avoid asking "What is the answer to this physics problem?" Instead, ask "Can you explain the structural steps needed to calculate torque in this scenario?"
2. **Employ the Feynman Technique**: Ask the model to listen while you explain a concept in your own words, then instruct it to point out logical gaps or missing details in your explanation.
3. **Cross-Verify Sources**: Always check high-stakes information against peer-reviewed citations. AI is a reasoning engine, not an infallible library.

As these tools proliferate, the competitive edge shifts from knowing facts to **knowing how to synthesize and direct inquiry**.
`,
    sourceName: 'OpenAI Education',
    sourceUrl: 'https://openai.com',
    tags: ['gpt-6', 'study-tools', 'productivity'],
    published: true
  },
  {
    id: 'art-2',
    title: 'Automating 80% of Daily Operations with Agentic Workflows',
    slug: 'automating-operations-agentic-workflows',
    summary: 'How modern businesses are deploying multi-agent systems to handle customer intake, triage development tickets, and draft monthly financial reports.',
    pillar: 'AIForWork',
    categoryName: 'AI for Work',
    readTimeMinutes: 7,
    publishedOn: '2026-07-09T14:30:00Z',
    body: `# Automating 80% of Daily Operations with Agentic Workflows

Many organizations are realizing that single-prompt interactions are insufficient for complex corporate environments. To unlock the next scale of productivity, companies are transitioning to **multi-agent orchestration systems**.

## What is an Agentic Workflow?

Unlike standard chatbot interactions, an agentic workflow is an iterative, loops-based sequence where multiple specialized AI agents cooperate to solve a complex goal. Each agent is assigned a persona, detailed context, and specific API tools.

\`\`\`
[Customer Email Intake] 
          │
          ▼
[Triage & Categorization Agent]
          │
    ┌─────┴─────┐
    ▼           ▼
[Code Fix]  [Invoicing Query]
\`\`\`

### The Architecture of Cooperation

1. **The Planner**: Receives the user's high-level goal, breaks it into a sequence of subtasks, and assigns them to specialized subprocessors.
2. **The Worker**: Executes a single step—such as writing an SQL query or parsing an incoming email body.
3. **The Critic**: Audits the worker's output against success criteria. If errors are detected, the critic sends feedback to the worker for revision.

## Real-World Case Study: Customer Triage

By deploying a three-agent cooperative loop, a mid-sized SaaS provider reduced their average engineering ticket response time from **4 hours to 11 seconds**:

- **Triage Agent** analyzed the incoming complaint, searched the customer's purchase history in the database, and classified the issue.
- **Search Agent** scanned internal engineering documentation to locate similar resolved bugs.
- **Drafting Agent** wrote a fully functional bug fix draft and a courteous email response, leaving it in the human engineer's queue for a single-click approval.

## Staying Ahead

For professionals, the takeaway is clear: **learn how to manage AI agents, or risk being replaced by someone who does.** The role of the modern knowledge worker is shifting from *producer* to *editor and orchestrator*.
`,
    sourceName: 'DeepMind Enterprise',
    sourceUrl: 'https://deepmind.google',
    tags: ['productivity', 'automation'],
    published: true
  },
  {
    id: 'art-3',
    title: 'Google Project Astra: The Arrival of Truly Multimodal Companions',
    slug: 'google-project-astra-multimodal-companions',
    summary: 'A look into Googles next-generation live spatial assistant that sees, remembers, and reasons about your physical surroundings in real-time.',
    pillar: 'AINews',
    categoryName: 'AI News',
    readTimeMinutes: 4,
    publishedOn: '2026-07-10T10:15:00Z',
    body: `# Google Project Astra: Truly Multimodal Companions

Google\'s latest unveiling of **Project Astra** marks a critical milestone in real-time spatial awareness. It is a live agent that leverages your camera, microphone, and location to provide contextual help with zero perceptible lag.

## Spatial Memory & Environmental Intelligence

What sets Astra apart is its ability to catalog, remember, and reason about physical objects in your immediate surroundings:

- **Visual Recall**: Ask Astra "Where did I leave my keys?" and it will recall seeing them next to the potted fern on your desk three minutes ago.
- **Real-Time Code Auditing**: Point your camera at a whiteboard sketch of a system architecture, and Astra will suggest an API endpoint layout or detect a bottleneck.
- **Interactive Prototyping**: Point the phone at a broken coffee machine, and the model walks you through diagnosing the pump pressure step-by-step.

## Why This Matters

We are moving away from the "search box" paradigm. In the near future, computing will not feel like an application we open, but an **intelligent layer overlaid upon our physical life**.
`,
    sourceName: 'Google Blog',
    sourceUrl: 'https://blog.google',
    tags: ['gpt-6', 'prompting'],
    published: true
  },
  {
    id: 'art-4',
    title: 'Inside Cursor and v0: The Developer\'s New Power Suit',
    slug: 'inside-cursor-v0-developers-power-suit',
    summary: 'Why AI-native IDEs and visual code-generators are changing software engineering from syntax typing to architectural curation.',
    pillar: 'AIForWork',
    categoryName: 'AI for Work',
    readTimeMinutes: 6,
    publishedOn: '2026-07-05T08:00:00Z',
    body: `# Inside Cursor and v0: The Developer\'s New Power Suit

The modern developer's setup is undergoing its most radical transformation since the invention of the compiler. Tools like **Cursor** and **v0** are not just code completers; they are reshaping the division of labor between human intellect and computer automation.

## The Death of Boilerplate

Writing setup files, standard API routing tables, and styling configurations used to consume the first 30% of any engineering project. Now, using v0:

1. **Describe the visual design** in plain English.
2. **Review the generated mockup** with interactive components.
3. **Copy the React + Tailwind code** directly into a Cursor-enabled workspace.
4. **Instruct Cursor** to hook up the database state with a simple command.

The entire loop takes under 10 minutes.

## The Rise of the Architectural Curator

When the cost of writing code drops to zero, the value of **designing the system architecture** skyrockets. Developers must focus on:

- **Security Boundaries**: Ensuring proper authentication and data-isolation layers.
- **Data Integrity**: Modeling strict database schemas and managing transactions correctly.
- **User Experience (UX)**: Guaranteeing that the interactive loops feel snappy, accessible, and intuitive.

Typing syntax is no longer the bottleneck. **Synthesizing intent is the bottleneck.**
`,
    sourceName: 'Vercel Analytics',
    sourceUrl: 'https://vercel.com',
    tags: ['coding', 'productivity', 'automation'],
    published: true
  },
  {
    id: 'art-5',
    title: 'The AI Hardware Bottleneck: Can Custom Silicon Save Us?',
    slug: 'ai-hardware-bottleneck-custom-silicon',
    summary: 'An analysis of why advanced chip shortages are constraining LLM scaling, and how next-gen neuromorphic computing and optical chips could be the cure.',
    pillar: 'FutureOfAI',
    categoryName: 'Future of AI',
    readTimeMinutes: 8,
    publishedOn: '2026-07-02T11:00:00Z',
    body: `# The AI Hardware Bottleneck: Can Custom Silicon Save Us?

Frontier AI models are growing exponentially, but the physical infrastructure powering them is hitting hard limits. As electrical power grids strain and advanced silicon wafers remain rare, the industry is searching for fundamental computing breakthroughs.

## The Power Constraint

A modern AI data center can consume as much energy as a medium-sized city. The standard silicon transitors we rely on are highly inefficient at transferring massive data packets back and forth between memory storage and processors—the infamous **von Neumann bottleneck**.

## Next-Generation Silicon Architectures

To sustain the next decade of scaling, chip designers are experimenting with radical new architectures:

1. **Optical Computing**: Using photons (light) instead of electrons to transmit signals. This reduces energy dissipation and allows speeds orders of magnitude faster.
2. **Neuromorphic Chips**: Modeling physical silicon networks to mimic the human brain's neural networks, operating asynchronously and drawing power only when nodes are active.
3. **On-Chip High-Bandwidth Memory (HBM)**: Stacking memory chips vertically directly on top of the processing core, bypassing slow external buses entirely.

## The Geopolitical Stakes

The race for custom silicon is no longer just a corporate battle; it is a matters of national sovereignty. The countries that control the advanced lithography machines and semiconductor manufacturing fabs will dictate the pace of AI advancement.
`,
    sourceName: 'IEEE Spectrum',
    sourceUrl: 'https://ieee.org',
    tags: ['productivity', 'gpt-6'],
    published: true
  }
];

// Helper to load/save mock DB from localStorage
export class MockDatabase {
  private static getKey(name: string): string {
    return `aibrief_mock_${name}`;
  }

  private static get<T>(name: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(this.getKey(name));
      if (!data) {
        this.set(name, defaultVal);
        return defaultVal;
      }
      return JSON.parse(data);
    } catch {
      return defaultVal;
    }
  }

  private static set<T>(name: string, val: T): void {
    localStorage.setItem(this.getKey(name), JSON.stringify(val));
  }

  // Clear all mock database tables
  public static clear(): void {
    localStorage.removeItem(this.getKey('interests'));
    localStorage.removeItem(this.getKey('categories'));
    localStorage.removeItem(this.getKey('tags'));
    localStorage.removeItem(this.getKey('ai_tools'));
    localStorage.removeItem(this.getKey('articles'));
    localStorage.removeItem(this.getKey('users'));
    localStorage.removeItem(this.getKey('bookmarks'));
    localStorage.removeItem(this.getKey('active_user'));
  }

  // Getters
  static getInterests(): Interest[] {
    return this.get<Interest[]>('interests', DEFAULT_INTERESTS);
  }

  static getCategories(): Category[] {
    return this.get<Category[]>('categories', DEFAULT_CATEGORIES);
  }

  static getTags(): Tag[] {
    return this.get<Tag[]>('tags', DEFAULT_TAGS);
  }

  static getAiTools(): AITool[] {
    return this.get<AITool[]>('ai_tools', DEFAULT_AI_TOOLS);
  }

  static getArticles(): (ArticleDetail & { published: boolean })[] {
    return this.get<(ArticleDetail & { published: boolean })[]>('articles', DEFAULT_ARTICLES);
  }

  // Setters/Primitives
  static saveArticles(articles: (ArticleDetail & { published: boolean })[]): void {
    this.set('articles', articles);
  }

  static saveCategories(categories: Category[]): void {
    this.set('categories', categories);
  }

  static saveTags(tags: Tag[]): void {
    this.set('tags', tags);
  }

  static saveAiTools(tools: AITool[]): void {
    this.set('ai_tools', tools);
  }

  // User auth details
  static getUsers(): (UserProfile & { passwordHash: string; bookmarks: string[] })[] {
    // Seed with a default user and admin
    const defaultUsers = [
      {
        id: 'usr-1',
        email: 'ada@example.com',
        fullName: 'Ada Lovelace',
        role: 'User' as const,
        interests: ['Programming', 'Research'],
        passwordHash: 'Password123', // plain text for simplicity in mock
        bookmarks: ['art-1', 'art-3']
      },
      {
        id: 'usr-2',
        email: 'admin@example.com',
        fullName: 'Admin Curator',
        role: 'Admin' as const,
        interests: ['Programming', 'Business', 'Productivity'],
        passwordHash: 'Admin123',
        bookmarks: []
      }
    ];
    return this.get('users', defaultUsers);
  }

  static saveUsers(users: any[]): void {
    this.set('users', users);
  }

  // Bookmarks helper (maps user -> bookmark items)
  static getBookmarksForUser(userId: string): BookmarkItem[] {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return [];
    
    const articles = this.getArticles();
    const list: BookmarkItem[] = [];
    
    for (const artId of user.bookmarks) {
      const art = articles.find(a => a.id === artId);
      if (art) {
        list.push({
          articleId: art.id,
          title: art.title,
          slug: art.slug,
          summary: art.summary,
          savedOn: new Date().toISOString() // static mock date
        });
      }
    }
    return list;
  }
}
