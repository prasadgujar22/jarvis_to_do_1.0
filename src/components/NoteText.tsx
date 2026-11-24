import { Fragment } from 'react';

// Candidate URLs: an explicit http(s) scheme followed by non-space characters.
const URL_PATTERN = /\bhttps?:\/\/[^\s<>"']+/gi;
// Punctuation that usually ends a sentence rather than belonging to the URL.
const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"]+$/;

/** Returns a safe absolute URL for http(s) links only; anything else (javascript:, data:, …) yields null. */
export function toSafeHref(raw: string): string | null {
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

type Segment = { type: 'text'; value: string } | { type: 'link'; value: string; href: string };

export function splitLinks(text: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const start = match.index ?? 0;
    const trimmedUrl = match[0].replace(TRAILING_PUNCTUATION, '');
    const href = toSafeHref(trimmedUrl);
    if (!href) continue;
    if (start > last) out.push({ type: 'text', value: text.slice(last, start) });
    out.push({ type: 'link', value: trimmedUrl, href });
    last = start + trimmedUrl.length;
  }
  if (last < text.length) out.push({ type: 'text', value: text.slice(last) });
  return out;
}

/** Renders note text as React text nodes with http(s) URLs turned into links. Never injects HTML. */
export function NoteText({ text }: { text: string }) {
  return (
    <>
      {splitLinks(text).map((seg, i) =>
        seg.type === 'link' ? (
          <a
            key={i}
            href={seg.href}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all rounded-sm font-medium text-[#096DAA] underline decoration-[#096DAA]/40 underline-offset-2 hover:decoration-[#096DAA] focus-ring dark:text-[#1D9BF0] dark:decoration-[#1D9BF0]/40 dark:hover:decoration-[#1D9BF0]"
          >
            {seg.value}
          </a>
        ) : (
          <Fragment key={i}>{seg.value}</Fragment>
        ),
      )}
    </>
  );
}
