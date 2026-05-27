import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { useCrossModuleSearch, isEmpty } from '@/hooks/inbox/useCrossModuleSearch';
import { ModulePill } from '@/components/inbox/ModulePill';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, []);

  const { data, isFetching } = useCrossModuleSearch(query, open);

  const select = (href: string) => {
    setOpen(false);
    setQuery('');
    navigate(href);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 text-muted-foreground w-[260px] justify-start"
        data-testid="global-search-trigger"
      >
        <Search className="h-4 w-4" />
        <span className="text-sm">Search deals, counterparties…</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search deals, counterparties, invoices…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.trim().length < 2 ? (
            <CommandEmpty>Type at least 2 characters…</CommandEmpty>
          ) : isFetching ? (
            <CommandEmpty>Searching…</CommandEmpty>
          ) : isEmpty(data) ? (
            <CommandEmpty>No results found.</CommandEmpty>
          ) : (
            <>
              {data!.deals.length > 0 && (
                <CommandGroup heading="Deals">
                  {data!.deals.map((r) => (
                    <CommandItem key={`deal-${r.id}`} onSelect={() => select(r.href)}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="font-mono text-sm">{r.label}</div>
                          <div className="text-xs text-muted-foreground">{r.sublabel}</div>
                        </div>
                        <div className="flex gap-1">
                          {r.modules.map((m) => (
                            <ModulePill key={m.module} module={m.module} compact />
                          ))}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {data!.counterparties.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Counterparties">
                    {data!.counterparties.map((r) => (
                      <CommandItem key={`cp-${r.id}`} onSelect={() => select(r.href)}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="text-sm font-medium">{r.label}</div>
                            <div className="text-xs text-muted-foreground">{r.sublabel}</div>
                          </div>
                          <div className="flex gap-1">
                            {r.modules.map((m) => (
                              <Badge key={m.module} variant="secondary" className="text-[10px]">
                                {m.count}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
              {data!.invoices.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Invoices">
                    {data!.invoices.map((r) => (
                      <CommandItem key={`inv-${r.id}`} onSelect={() => select(r.href)}>
                        <div>
                          <div className="font-mono text-sm">{r.label}</div>
                          <div className="text-xs text-muted-foreground">{r.sublabel}</div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
