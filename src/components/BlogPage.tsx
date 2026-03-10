
import { BLOG_POSTS } from "../data/blogPosts";

interface BlogPageProps {
  onOpenPost: (slug: string) => void;
}

export function BlogPage({ onOpenPost }: BlogPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-white sm:text-5xl tracking-tight">
          HamHao Learning Blog
        </h1>
        <p className="mt-4 text-xl text-gray-400 max-w-2xl mx-auto">
          Tips, strategies, and guides to master Mandarin Chinese efficiently.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {BLOG_POSTS.map((post) => (
          <article
            key={post.slug}
            className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-red-900/50 hover:bg-neutral-900/80 transition-all duration-300 shadow-lg group cursor-pointer"
            onClick={() => onOpenPost(post.slug)}
          >
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                <span>{post.date}</span>
                <span className="w-1 h-1 rounded-full bg-neutral-700" />
                <span>{post.readTime}</span>
              </div>
              
              <h2 className="text-xl font-bold text-white mb-3 group-hover:text-red-400 transition-colors">
                {post.title}
              </h2>
              
              <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-1">
                {post.description}
              </p>

              <div className="mt-auto">
                <span className="inline-flex items-center text-sm font-semibold text-red-500 group-hover:translate-x-1 transition-transform">
                  Read article →
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
