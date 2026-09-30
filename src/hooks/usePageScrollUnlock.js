import { useEffect } from "react";

/**
 * Overrides globals.css's fixed height:100% and overflow:hidden on
 * html/body (left untouched - see README's Feature Integration section)
 * so the page can actually scroll, and reserves scrollbar width
 * permanently (scrollbarGutter: stable) so it appearing/disappearing
 * (e.g. from GameOverlay's scroll lock) doesn't shift layout width.
 *
 * Called unconditionally by GpcHero - both the desktop (pinned) and
 * mobile (plain scroll) layouts need this, so it isn't tied to either.
 */
export function usePageScrollUnlock() {
  useEffect(() => {
    const previousHtmlHeight = document.documentElement.style.height;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousHtmlScrollbarGutter = document.documentElement.style.scrollbarGutter;
    const previousBodyHeight = document.body.style.height;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.height = "auto";
    document.documentElement.style.overflow = "auto";
    document.documentElement.style.scrollbarGutter = "stable";
    document.body.style.height = "auto";
    document.body.style.overflow = "auto";

    return () => {
      document.documentElement.style.height = previousHtmlHeight;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.documentElement.style.scrollbarGutter = previousHtmlScrollbarGutter;
      document.body.style.height = previousBodyHeight;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);
}