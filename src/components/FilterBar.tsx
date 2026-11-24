import { memo, type RefObject } from 'react';
import type { TagCount } from '../types';
import { SearchInput } from './SearchInput';
import { cn } from '../lib/cn';

interface FilterBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  tags: TagCount[];
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
}

/** Mobile & tablet search and tag filter strip (desktop uses the Right Sidebar). */
export const FilterBar = memo(function FilterBar({
  query,
  onQueryChange,
  searchRef,
  tags,
  activeTag,
  onTagChange,
}: FilterBarProps) {
  return (
    <div className="space-y-2.5 border-b border-[#EFF3F4] px-4 py-2.5 lg:hidden dark:border-[#2F3336]">
      <SearchInput query={query} onQueryChange={onQueryChange} inputRef={searchRef} />

      {tags.length > 0 && (
        <div role="group" aria-label="Filter by tag" className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5">
          <TagChip label="All tags" selected={activeTag === null} onClick={() => onTagChange(null)} />
          {tags.map(({ tag, count }) => (
            <TagChip
              key={tag}
              label={`#${tag}`}
              count={count}
              selected={activeTag === tag}
              onClick={() => onTagChange(activeTag === tag ? null : tag)}
            />
          ))}
        </div>
      )}
    </div>
  );
});

function TagChip({ label, count, selected, onClick }: { label: string; count?: number; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-semibold transition-colors duration-150 focus-ring',
        selected
          ? 'border-[#0F1419] bg-[#0F1419] text-white dark:border-[#EFF3F4] dark:bg-[#EFF3F4] dark:text-[#0F1419]'
          : 'border-[#CFD9DE] bg-transparent text-[#0F1419] hover:bg-[#0F1419]/[0.05] dark:border-[#2F3336] dark:text-[#E7E9EA] dark:hover:bg-white/[0.06]',
      )}
    >
      {label}
      {count !== undefined && <span className="tabular-nums opacity-75">{count}</span>}
    </button>
  );
}
