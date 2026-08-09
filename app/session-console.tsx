"use client";

import type { HitlSession } from "@/lib/db";
import { useEffect, useMemo, useState } from "react";
import { Bot, CheckCircle2, Clock3, Inbox, UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function countdown(expiresAt: string) {
  const seconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function StatusBadge({ session }: { session: HitlSession }) {
  if (session.status === "waiting") return <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 tabular-nums"><Clock3 />{countdown(session.expires_at)}</Badge>;
  if (session.status === "answered") return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700"><CheckCircle2 />Answered</Badge>;
  return <Badge variant="secondary" className="capitalize">{session.status}</Badge>;
}

export function SessionConsole({ initial }: { initial: HitlSession[] }) {
  const [sessions, setSessions] = useState(initial);
  const [selectedId, setSelectedId] = useState(initial[0]?.id ?? "");
  const [, tick] = useState(0);
  const selected = useMemo(() => sessions.find((item) => item.id === selectedId) ?? sessions[0], [sessions, selectedId]);

  useEffect(() => { const timer = setInterval(async () => { tick((value) => value + 1); const response = await fetch("/api/sessions", { cache: "no-store" }); if (response.ok) setSessions((await response.json()).sessions); }, 2000); return () => clearInterval(timer); }, []);

  async function answer(value: string) {
    if (!selected) return;
    const response = await fetch(`/api/sessions/${selected.id}/answer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: value }) });
    if (response.ok) { const { session } = await response.json(); setSessions((items) => items.map((item) => item.id === session.id ? session : item)); }
  }

  return <div className="mx-auto grid h-[calc(100svh-4rem)] max-w-[1440px] grid-rows-[auto_1fr] overflow-hidden border-x bg-background lg:grid-cols-[340px_1fr] lg:grid-rows-1">
    <aside className="border-b bg-muted/20 lg:border-r lg:border-b-0">
      <div className="flex items-center justify-between px-4 py-3 sm:px-5 lg:h-[73px] lg:border-b"><div><h1 className="font-semibold">Decision inbox</h1><p className="text-xs text-muted-foreground">{sessions.filter((item) => item.status === "waiting").length} waiting for you</p></div><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700"><span className="size-1.5 rounded-full bg-emerald-500" />Live</Badge></div>
      <ScrollArea className="w-full lg:h-[calc(100svh-8.6rem)]"><div className="flex gap-2 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:overflow-visible lg:p-2">{sessions.length === 0 ? <div className="w-full px-5 py-10 text-center text-sm text-muted-foreground"><Inbox className="mx-auto mb-3 size-7" />No sessions yet.</div> : sessions.map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)} className={cn("min-w-[250px] rounded-xl border p-3 text-left transition-colors lg:min-w-0 lg:w-full", selected?.id === item.id ? "border-foreground/15 bg-background shadow-sm" : "border-transparent hover:bg-background/70")}><div className="mb-1.5 flex items-center justify-between gap-2"><span className="truncate text-xs font-semibold">{item.integration}</span><StatusBadge session={item} /></div><p className="truncate text-xs text-muted-foreground">{item.question}</p></button>)}</div></ScrollArea>
    </aside>
    <section className="flex min-h-0 flex-col">
      {!selected ? <div className="m-auto px-6 text-center"><div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-muted"><Inbox className="size-6" /></div><h2 className="text-lg font-semibold">Waiting for an agent</h2><p className="mt-1 text-sm text-muted-foreground">New human-decision requests appear here in real time.</p></div> : <>
        <header className="flex min-h-[73px] items-center justify-between gap-3 border-b px-4 py-3 sm:px-6"><div className="min-w-0"><p className="truncate text-xs font-medium uppercase tracking-wider text-muted-foreground">{selected.integration}</p><h2 className="mt-1 truncate font-semibold">Human decision requested</h2></div><StatusBadge session={selected} /></header>
        <ScrollArea className="min-h-0 flex-1"><div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-8 sm:py-10"><div className="flex min-w-0 items-start gap-3"><Avatar className="mt-0.5 size-9 shrink-0 rounded-xl"><AvatarFallback className="rounded-xl bg-foreground text-background"><Bot /></AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="mb-2 text-xs text-muted-foreground">Agent request</p><Card className="min-w-0 overflow-hidden rounded-tl-sm shadow-none"><CardContent className="break-words p-4 text-base leading-relaxed sm:p-5 sm:text-lg">{selected.question}</CardContent></Card></div></div>
          {selected.status === "waiting" ? <Card className="ml-0 border-dashed shadow-none sm:ml-12"><CardContent className="p-4 sm:p-5"><p className="mb-3 text-sm font-medium">Choose a response</p><div className="grid gap-2 sm:grid-cols-2">{selected.options.map((option) => <Button key={option} variant="outline" size="lg" className="h-auto min-h-11 justify-start whitespace-normal px-4 py-3 text-left" onClick={() => answer(option)}>{option}</Button>)}</div><p className="mt-4 text-xs text-muted-foreground">Your identity and timestamp are recorded with this decision.</p></CardContent></Card> : selected.status === "answered" ? <div className="ml-auto flex max-w-lg items-start justify-end gap-3"><Card className="rounded-tr-sm border-foreground bg-foreground text-background shadow-none"><CardContent className="p-4"><p className="mb-2 text-xs text-background/60">Human response · {selected.answered_by}</p><p className="font-medium">{selected.answer}</p></CardContent></Card><Avatar className="size-9"><AvatarFallback><UserRound /></AvatarFallback></Avatar></div> : <Card className="ml-0 bg-muted/40 shadow-none sm:ml-12"><CardContent className="p-4 text-sm text-muted-foreground">No human response was recorded. This session is {selected.status}.</CardContent></Card>}
        </div></ScrollArea>
        <footer className="border-t px-4 py-3 text-[11px] text-muted-foreground sm:px-6"><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><span>Session</span><code className="max-w-[180px] truncate text-foreground sm:max-w-none">{selected.id}</code><Separator orientation="vertical" className="hidden h-3 sm:block" /><span>{new Date(selected.created_at).toLocaleString()}</span></div></footer>
      </>}
    </section>
  </div>;
}
