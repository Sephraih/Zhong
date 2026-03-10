
import ReactMarkdown from "react-markdown";
import { BLOG_POSTS } from "../data/blogPosts";

interface BlogPostProps {
  onBack: () => void;
  currentPath: string; // Used to extract the slug
}

export function BlogPost({ onBack, currentPath }: BlogPostProps) {
  // Robustly extract the slug from the end of the path
  const slug = currentPath.split("/").filter(Boolean).pop();
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Post not found</h1>
        <button
          onClick={onBack}
          className="text-red-400 hover:text-red-300 font-medium"
        >
          ← Back to Blog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={onBack}
        className="mb-8 inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Blog
      </button>

      <article>
        <header className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 text-sm text-gray-500 mb-4">
            <time>{post.date}</time>
            <span className="w-1 h-1 rounded-full bg-neutral-700" />
            <span>{post.readTime}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {post.title}
          </h1>
        </header>

        <div className="prose prose-invert prose-lg max-w-none text-gray-300">
          <ReactMarkdown
            components={{
              h1: ({node, ...props}) => <h1 className="hidden" {...props} />, // Hide h1 since we render it in header
              h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-white mt-10 mb-4" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-xl font-semibold text-white mt-8 mb-3" {...props} />,
              p: ({node, ...props}) => <p className="mb-6 leading-relaxed" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-6 space-y-2" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-6 space-y-2" {...props} />,
              li: ({node, ...props}) => <li className="pl-1" {...props} />,
              strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-red-500 pl-4 py-1 my-6 text-gray-400 italic bg-neutral-900/50 rounded-r-lg" {...props} />,
              a: ({node, ...props}) => <a className="text-red-400 hover:text-red-300 underline" {...props} />,
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        <div className="mt-16 pt-10 border-t border-neutral-800 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Ready to start learning?</h3>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Put these tips into practice with HamHao's HSK vocabulary flashcards and sentence practice.
          </p>
          <button
            onClick={() => {
              // Navigate to home/signup by triggering a navigation event if possible, 
              // or just changing the URL since we are inside the Router context in App
              window.history.pushState({}, "", "/");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-900/30 transition-all transform hover:-translate-y-1"
          >
            Start Learning Now
          </button>
        </div>
      </article>
    </div>
  );
}
