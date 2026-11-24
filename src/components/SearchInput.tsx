import { memo, useId, type RefObject } from 'react';
import { Search, X } from 'lucide-react';
import { Kbd } from './ui/Kbd';
import { cn } from '../lib/cn';

interface SearchInputProps {
  query: string;
  onQueryChange: (query: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  className?: string;
}

export const SearchInput = memo(function SearchInput({
  query,
  onQueryChange,
  inputRef,
  className,
}: SearchInputProps) {
  const id = useId();

  return (
    <div
      className={cn(
        'group/search relative flex h-[42px] w-full min-w-0 items-center rounded-full border border-transparent bg-[#EFF3F4] transition-colors duration-150',
        'focus-within:border-[#1D9BF0] focus-within:bg-white',
        'dark:bg-[#202327] dark:focus-within:border-[#1D9BF0] dark:focus-within:bg-black',
        className,
      )}
    >
      <Search
        className="pointer-events-none ml-4 size-4 shrink-0 text-[#536471] transition-colors group-focus-within/search:text-[#1D9BF0] dark:text-[#8B98A5]"
        aria-hidden
      />
      <label htmlFor={id} className="sr-only">
        Search tasks
      </label>
      <input
        ref={inputRef}
        id={id}
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            if (query) onQueryChange('');
            else e.currentTarget.blur();
          }
        }}
        placeholder="Search tasks or #tags"
        autoComplete="off"
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-[14px] text-[#0F1419] outline-none placeholder:text-[#536471] dark:text-[#E7E9EA] dark:placeholder:text-[#8B98A5] [&::-webkit-search-cancel-button]:hidden"
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            onQueryChange('');
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="mr-2.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#1D9BF0] text-white transition-colors hover:bg-[#1A8CD8] focus-ring"
        >
          <X className="size-3" strokeWidth={2.75} aria-hidden />
        </button>
      ) : (
        <span className="mr-3.5 hidden sm:inline-flex group-focus-within/search:hidden" aria-hidden>
          <Kbd>/</Kbd>
        </span>
      )}
    </div>
  );
});
