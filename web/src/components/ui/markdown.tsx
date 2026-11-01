import ReactMarkdown from "react-markdown";

/** CMS markdown. Raw HTML is not rendered (react-markdown default), so content is escaped. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-cms">
      <ReactMarkdown
        components={{
          // Page titles are rendered by the page; demote any h1 in content.
          h1: ({ children }) => <h2>{children}</h2>,
          a: ({ href, children }) => {
            const external = href?.startsWith("http");
            return (
              <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {children}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
