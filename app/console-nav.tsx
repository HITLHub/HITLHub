"use client";

import Link from "next/link";
import { KeyRound, LogOut, Menu, MessagesSquare, PlugZap } from "lucide-react";
import { signOut } from "@/app/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  { id: "inbox", href: "/", label: "Inbox", icon: MessagesSquare },
  { id: "keys", href: "/api-keys", label: "API Keys", icon: KeyRound },
  { id: "setup", href: "/mcp-setup", label: "MCP Setup", icon: PlugZap },
] as const;

function Brand() {
  return <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight"><span className="grid size-9 place-items-center rounded-xl bg-foreground text-xl text-background">∞</span><span>HITLHub</span></Link>;
}

function NavLinks({ active, mobile = false }: { active: "inbox" | "keys" | "setup"; mobile?: boolean }) {
  return <div className={cn("flex", mobile ? "flex-col gap-1" : "items-center gap-1")}>{links.map(({ id, href, label, icon: Icon }) => <Button key={id} variant={active === id ? "secondary" : "ghost"} className={cn(mobile && "w-full justify-start")} asChild><Link href={href}><Icon data-icon="inline-start" />{label}</Link></Button>)}</div>;
}

export function ConsoleNav({ active, user }: { active: "inbox" | "keys" | "setup"; user: { name: string; email: string } }) {
  return <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-xl">
    <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6">
      <Brand />
      <div className="hidden md:block"><NavLinks active={active} /></div>
      <div className="hidden items-center gap-3 md:flex"><Avatar className="size-8"><AvatarFallback>{user.name.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar><div className="max-w-44 leading-tight"><p className="truncate text-xs font-medium">{user.name}</p><p className="truncate text-[11px] text-muted-foreground">{user.email}</p></div><form action={signOut}><Button variant="ghost" size="icon" aria-label="Sign out"><LogOut /></Button></form></div>
      <Sheet><SheetTrigger asChild><Button className="md:hidden" variant="outline" size="icon" aria-label="Open navigation"><Menu /></Button></SheetTrigger><SheetContent side="right" className="w-[min(88vw,340px)] p-5"><SheetHeader className="px-0"><SheetTitle><Brand /></SheetTitle></SheetHeader><div className="mt-8"><NavLinks active={active} mobile /></div><div className="mt-auto border-t pt-5"><div className="mb-4 flex items-center gap-3"><Avatar><AvatarFallback>{user.name.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar><div className="min-w-0"><p className="truncate text-sm font-medium">{user.name}</p><p className="truncate text-xs text-muted-foreground">{user.email}</p></div></div><form action={signOut}><Button variant="outline" className="w-full"><LogOut data-icon="inline-start" />Sign out</Button></form></div></SheetContent></Sheet>
    </div>
  </header>;
}
