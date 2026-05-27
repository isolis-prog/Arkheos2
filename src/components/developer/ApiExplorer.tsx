import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, ChevronRight, Lock } from 'lucide-react';
import { API_ENDPOINTS } from '@/hooks/useDeveloperPlatform';
import { useState, useMemo } from 'react';

const methodColors: Record<string, string> = {
  GET: 'bg-info/10 text-info border-info/30',
  POST: 'bg-success/10 text-success border-success/30',
  PATCH: 'bg-warning/10 text-warning border-warning/30',
  PUT: 'bg-warning/10 text-warning border-warning/30',
  DELETE: 'bg-destructive/10 text-destructive border-destructive/30',
};

export const ApiExplorer = () => {
  const [search, setSearch] = useState('');

  const tags = useMemo(() => {
    const tagMap: Record<string, typeof API_ENDPOINTS> = {};
    API_ENDPOINTS.forEach(ep => {
      if (!tagMap[ep.tag]) tagMap[ep.tag] = [];
      tagMap[ep.tag].push(ep);
    });
    return tagMap;
  }, []);

  const filteredTags = useMemo(() => {
    if (!search) return tags;
    const result: Record<string, typeof API_ENDPOINTS> = {};
    Object.entries(tags).forEach(([tag, eps]) => {
      const filtered = eps.filter(ep =>
        ep.path.toLowerCase().includes(search.toLowerCase()) ||
        ep.summary.toLowerCase().includes(search.toLowerCase()) ||
        ep.tag.toLowerCase().includes(search.toLowerCase())
      );
      if (filtered.length) result[tag] = filtered;
    });
    return result;
  }, [tags, search]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold">ArkheOS API</h3>
              <p className="text-sm text-muted-foreground">OpenAPI v3.1 — Version 1.0.0</p>
            </div>
            <Badge variant="secondary">v1</Badge>
            <Badge variant="outline"><Lock className="h-3 w-3 mr-1" />API Key Auth</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            RESTful API for reconciliation, exceptions, trade-to-cash workflows, and dataset management.
            Authenticate using <code className="bg-muted px-1 rounded text-xs">Authorization: Bearer hh_live_xxxx</code> header.
            Include <code className="bg-muted px-1 rounded text-xs">X-Idempotency-Key</code> header on write operations.
          </p>
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">Base URL:</p>
            <code className="bg-muted px-2 py-1 rounded text-xs font-mono">https://api.arkheos.io/v1</code>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search endpoints…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Endpoints */}
      <Accordion type="multiple" defaultValue={Object.keys(filteredTags)} className="space-y-3">
        {Object.entries(filteredTags).map(([tag, endpoints]) => (
          <AccordionItem key={tag} value={tag} className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{tag}</span>
                <Badge variant="secondary" className="text-xs">{endpoints.length} endpoints</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-0">
              <div className="divide-y">
                {endpoints.map((ep, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer group">
                    <Badge className={`font-mono text-xs min-w-[60px] justify-center border ${methodColors[ep.method]}`}>
                      {ep.method}
                    </Badge>
                    <code className="text-sm font-mono flex-1">{ep.path}</code>
                    <span className="text-sm text-muted-foreground hidden md:block">{ep.summary}</span>
                    <div className="flex gap-1">
                      {ep.scopes.map(s => (
                        <Badge key={s} variant="outline" className="text-xs hidden lg:inline-flex">{s}</Badge>
                      ))}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Rate Limits */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-lg">Rate Limits & Policies</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <p className="font-medium">Default Rate Limit</p>
              <p className="text-muted-foreground">60 requests/minute per API key</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium">Idempotency</p>
              <p className="text-muted-foreground">Required for POST/PATCH via <code className="bg-muted px-1 rounded text-xs">X-Idempotency-Key</code></p>
            </div>
            <div className="space-y-1">
              <p className="font-medium">Pagination</p>
              <p className="text-muted-foreground">Cursor-based via <code className="bg-muted px-1 rounded text-xs">?cursor=&limit=</code></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
