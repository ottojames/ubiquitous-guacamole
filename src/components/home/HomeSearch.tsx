import React from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandItem, CommandList } from '@/components/ui/command';

export type Suggestion = { id: string; label: string };

export type HomeSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  loading?: boolean;
  suggestions: Suggestion[];
  suggestLoading?: boolean;
  onSelectSuggestion: (suggestion: Suggestion) => void;
  describedById?: string;
};

export default function HomeSearch({
  value,
  onChange,
  onSubmit,
  loading,
  suggestions,
  suggestLoading,
  onSelectSuggestion,
  describedById,
}: HomeSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);

  const listboxId = 'home-search-suggestions';
  const activeId = activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  React.useEffect(() => {
    if ((suggestions.length > 0 || suggestLoading) && document.activeElement === inputRef.current) {
      setOpen(true);
    }
    if (!suggestions.length && !suggestLoading) {
      setOpen(false);
      setActiveIndex(-1);
    }
  }, [suggestions, suggestLoading]);

  React.useEffect(() => {
    const handleClickAway = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (inputRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      setOpen(false);
      setActiveIndex(-1);
    };
    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, []);

  const submitValue = React.useCallback(
    (next: string) => {
      if (!next.trim()) return;
      onSubmit(next.trim());
      setOpen(false);
      setActiveIndex(-1);
    },
    [onSubmit]
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitValue(value);
  };

  const handleSelect = React.useCallback(
    (suggestion: Suggestion) => {
      const label = suggestion.label?.trim();
      if (!label) return;
      onSelectSuggestion(suggestion);
      setOpen(false);
      setActiveIndex(-1);
    },
    [onSelectSuggestion]
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && suggestions.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
      return;
    }
    if (event.key === 'ArrowUp' && suggestions.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      return;
    }
    if (event.key === 'Enter' && activeIndex >= 0 && suggestions[activeIndex]) {
      event.preventDefault();
      handleSelect(suggestions[activeIndex]);
      return;
    }
    if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Search statutory notices by postcode or address"
      className="w-full"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="relative flex-1">
          <label className="sr-only" htmlFor="home-search-input">
            Search notices
          </label>
          <Input
            id="home-search-input"
            ref={inputRef}
            type="search"
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => {
              if (suggestions.length > 0 || suggestLoading) {
                setOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={open ? listboxId : undefined}
            aria-activedescendant={open ? activeId : undefined}
            aria-describedby={describedById}
            autoComplete="off"
            placeholder="Search by postcode or address"
          />
          {open && (
            <div className="absolute left-0 top-full z-40 mt-2 w-full" role="presentation">
              <Command>
                <CommandList
                  ref={listRef}
                  id={listboxId}
                  role="listbox"
                  aria-label="Search suggestions"
                >
                  {suggestLoading && (
                    <CommandEmpty>
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                        Searching addresses…
                      </span>
                    </CommandEmpty>
                  )}
                  {!suggestLoading && suggestions.length === 0 && (
                    <CommandEmpty>No matches yet. Try a full postcode or street name.</CommandEmpty>
                  )}
                  {suggestions.map((suggestion, index) => (
                    <CommandItem
                      key={suggestion.id}
                      id={`${listboxId}-option-${index}`}
                      active={index === activeIndex}
                      aria-selected={index === activeIndex}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelect(suggestion)}
                    >
                      {suggestion.label}
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </div>
          )}
        </div>
        <Button type="submit" disabled={loading} className="w-full md:w-auto">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Searching
            </span>
          ) : (
            'Search'
          )}
        </Button>
      </div>
    </form>
  );
}
