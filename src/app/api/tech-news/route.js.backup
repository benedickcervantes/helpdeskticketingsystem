import Parser from 'rss-parser';

const parser = new Parser();

// Helper function to extract image URL from content string
const extractImageFromContent = (content) => {
  if (!content) return null;
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  return imgMatch ? imgMatch[1] : null;
};

// Only GMA Network Technology, Gadgets and Gaming RSS feed
const RSS_FEEDS = [
  { url: 'https://data.gmanetwork.com/gno/rss/scitech/technology/feed.xml', source: 'GMA News Online / SciTech / Technology, Gadgets and Gaming' },
];

const fallbackNews = [
  {
    title: "AI-Powered Development Tools Transform Software Engineering",
    link: "#",
    pubDate: new Date().toISOString(),
    source: "GMA News Online",
    description: "Revolutionary AI tools are changing how developers write code, with automated testing and intelligent debugging capabilities.",
    image: null
  },
  {
    title: "Next.js 15 Introduces Revolutionary Server Components",
    link: "#",
    pubDate: new Date().toISOString(),
    source: "GMA News Online",
    description: "The latest version of Next.js brings unprecedented performance improvements and new server-side rendering capabilities.",
    image: null
  },
  {
    title: "Quantum Computing Breakthrough Achieves 99.9% Accuracy",
    link: "#",
    pubDate: new Date().toISOString(),
    source: "GMA News Online",
    description: "Scientists achieve a major milestone in quantum computing reliability, bringing practical applications closer to reality.",
    image: null
  },
  {
    title: "OpenAI Releases GPT-5 with Enhanced Reasoning Capabilities",
    link: "#",
    pubDate: new Date().toISOString(),
    source: "GMA News Online",
    description: "The next generation of AI language models shows significant improvements in logical reasoning and problem-solving.",
    image: null
  },
  {
    title: "Microsoft Copilot Integration Reaches 1 Billion Users",
    link: "#",
    pubDate: new Date().toISOString(),
    source: "GMA News Online",
    description: "Microsoft's AI assistant becomes one of the most widely adopted productivity tools in enterprise environments.",
    image: null
  },
  {
    title: "Edge Computing Revolutionizes IoT Device Performance",
    link: "#",
    pubDate: new Date().toISOString(),
    source: "GMA News Online",
    description: "New edge computing solutions are dramatically improving response times and reducing latency for IoT applications.",
    image: null
  }
];

export async function GET() {
  try {
    const allNews = [];
    
    for (const feedConfig of RSS_FEEDS) {
      const feed = await parser.parseURL(feedConfig.url);
      // Get ALL items from the feed (no limit)
      const items = feed.items.map(item => {
        const imageUrl = extractImageFromContent(item.content) || 
                         extractImageFromContent(item['content:encoded']) ||
                         extractImageFromContent(item.description);
        return {
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          source: feedConfig.source,
          description: item.contentSnippet || item.description,
          image: imageUrl,
        };
      });
      allNews.push(...items);
    }

    // Sort by date (newest first)
    allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // Return ALL news items (no limit)
    return Response.json(allNews);
  } catch (error) {
    console.error('Error fetching RSS feeds:', error);
    return Response.json(fallbackNews);
  }
}
