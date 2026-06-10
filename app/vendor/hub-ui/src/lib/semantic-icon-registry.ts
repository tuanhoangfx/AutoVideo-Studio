import { createElement, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Archive,
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Columns3,
  Database,
  Eye,
  Facebook,
  FileStack,
  FileText,
  Filter,
  Fingerprint,
  FolderOpen,
  Gauge,
  Globe2,
  Hand,
  Inbox,
  Keyboard,
  KeyRound,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  LayoutList,
  LayoutTemplate,
  LibraryBig,
  Link2,
  List,
  ListOrdered,
  Lock,
  Mail,
  MessageSquare,
  Package,
  PanelTop,
  Pencil,
  Play,
  Puzzle,
  Radio,
  RefreshCw,
  Rows3,
  ScrollText,
  Server,
  Shield,
  ShieldCheck,
  Terminal,
  Timer,
  UserMinus,
  UserRound,
  Users,
  Wand2,
  Webhook,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { FilterIconMeta } from "../types/filter-badge";
import type { KpiStripTone } from "../shell/KpiStrip";
import type {
  DeprecatedSemanticIconKey,
  SemanticIconKey,
  SemanticIconLookupKey,
  SemanticIconMeta,
} from "../types/semantic-icon";
import { compactIconSize } from "../ui-scale";

const REGISTRY: Record<SemanticIconKey, SemanticIconMeta> = {
  "agent.rule": { icon: Shield, className: "text-emerald-300", tone: "emerald" },
  "agent.skill": { icon: Puzzle, className: "text-purple-300", tone: "purple" },
  "agent.pattern": { icon: LayoutTemplate, className: "text-violet-300", tone: "violet" },
  "agent.command": { icon: Terminal, className: "text-cyan-300", tone: "cyan" },
  "agent.doc": { icon: BookOpen, className: "text-amber-300", tone: "amber" },
  "agent.subagent": { icon: Bot, className: "text-indigo-300", tone: "indigo" },
  "agent.alwaysApply": { icon: BookOpen, className: "text-amber-300", tone: "amber" },
  "agent.requestable": { icon: Hand, className: "text-purple-300", tone: "purple" },
  "agent.scope.workspace": { icon: FolderOpen, className: "text-cyan-300", tone: "cyan" },
  "agent.scope.user": { icon: UserRound, className: "text-emerald-300", tone: "emerald" },
  "agent.scope.package": { icon: Package, className: "text-indigo-300", tone: "indigo" },
  "template.total": { icon: LayoutGrid, className: "text-indigo-300", tone: "indigo" },
  "template.locked": { icon: Lock, className: "text-amber-300", tone: "amber" },
  "template.preview": { icon: Eye, className: "text-purple-300", tone: "purple" },
  "template.draft": { icon: FileStack, className: "text-purple-300", tone: "purple" },
  "template.published": { icon: Globe2, className: "text-emerald-300", tone: "emerald" },
  "template.variants": { icon: Layers, className: "text-indigo-300", tone: "indigo" },
  "template.features": { icon: Bot, className: "text-blue-300", tone: "blue" },
  "template.archived": { icon: Archive, className: "text-rose-300", tone: "rose" },
  "personality.profile": { icon: UserRound, className: "text-sky-300", tone: "sky" },
  "personality.prompt": { icon: ScrollText, className: "text-violet-300", tone: "violet" },
  "personality.model": { icon: Bot, className: "text-indigo-300", tone: "indigo" },
  "personality.rag": { icon: LibraryBig, className: "text-emerald-300", tone: "emerald" },
  "personality.messages": { icon: MessageSquare, className: "text-cyan-300", tone: "cyan" },
  "field.custom": { icon: Columns3, className: "text-indigo-300", tone: "indigo" },
  "kpi.total": { icon: LayoutGrid, className: "text-indigo-300", tone: "indigo" },
  "kpi.live": { icon: Activity, className: "text-emerald-300", tone: "emerald" },
  "kpi.catalog": { icon: FolderOpen, className: "text-purple-300", tone: "purple" },
  "kpi.orgs": { icon: Building2, className: "text-emerald-300", tone: "emerald" },
  "kpi.errors": { icon: AlertTriangle, className: "text-rose-300", tone: "rose" },
  "kpi.restricted": { icon: Lock, className: "text-rose-300", tone: "rose" },
  "kpi.hosts": { icon: Server, className: "text-emerald-300", tone: "emerald" },
  "kpi.drift": { icon: AlertTriangle, className: "text-rose-300", tone: "rose" },
  "kpi.toolsLinked": { icon: Link2, className: "text-blue-300", tone: "blue" },
  "kpi.ready": { icon: CheckCircle2, className: "text-purple-300", tone: "purple" },
  "kpi.apiTotal": { icon: BarChart3, className: "text-blue-300", tone: "blue" },
  "kpi.apiRest": { icon: Timer, className: "text-purple-300", tone: "purple" },
  "kpi.agent.items": { icon: List, className: "text-indigo-300", tone: "indigo" },
  "kpi.agent.rules": { icon: ScrollText, className: "text-emerald-300", tone: "emerald" },
  "kpi.agent.skills": { icon: Puzzle, className: "text-purple-300", tone: "purple" },
  "kpi.agent.patterns": { icon: Wand2, className: "text-indigo-300", tone: "indigo" },
  "kpi.agent.subagents": { icon: Users, className: "text-indigo-300", tone: "indigo" },
  "kpi.agent.commands": { icon: Terminal, className: "text-amber-300", tone: "amber" },
  "kpi.agent.always": { icon: BookOpen, className: "text-amber-300", tone: "amber" },
  "kpi.agent.requestable": { icon: Hand, className: "text-purple-300", tone: "purple" },
  "settings.display": { icon: Layers, className: "text-indigo-300", tone: "indigo" },
  "settings.range": { icon: Clock, className: "text-sky-300", tone: "sky" },
  "settings.pageSize": { icon: ListOrdered, className: "text-cyan-300", tone: "cyan" },
  "settings.rows": { icon: Rows3, className: "text-violet-300", tone: "violet" },
  "settings.header": { icon: PanelTop, className: "text-amber-300", tone: "amber" },
  "settings.kpi": { icon: Gauge, className: "text-emerald-300", tone: "emerald" },
  "settings.charts": { icon: BarChart3, className: "text-indigo-300", tone: "indigo" },
  "settings.filters": { icon: Filter, className: "text-cyan-300", tone: "cyan" },
  "settings.headerStats": { icon: LayoutDashboard, className: "text-orange-300" },
  "settings.table": { icon: LayoutList, className: "text-violet-300", tone: "violet" },
  "settings.shortcuts": { icon: Keyboard, className: "text-indigo-300", tone: "indigo" },
  "kpi.schema.fields": { icon: Database, className: "text-indigo-300", tone: "indigo" },
  "kpi.schema.groups": { icon: Layers, className: "text-emerald-300", tone: "emerald" },
  "kpi.schema.input": { icon: Pencil, className: "text-amber-300", tone: "amber" },
  "kpi.schema.options": { icon: List, className: "text-purple-300", tone: "purple" },
  "kpi.schema.pk": { icon: Fingerprint, className: "text-blue-300", tone: "blue" },
  "kpi.schema.auto": { icon: Bot, className: "text-purple-300", tone: "purple" },
  "kpi.schema.derive": { icon: RefreshCw, className: "text-indigo-300", tone: "indigo" },
  "kpi.schema.readonly": { icon: Lock, className: "text-rose-300", tone: "rose" },
  "user.account": { icon: UserRound, className: "text-sky-300", tone: "sky" },
  "user.session": { icon: KeyRound, className: "text-violet-300", tone: "violet" },
  "user.linkEmail": { icon: Mail, className: "text-sky-300", tone: "sky" },
  "user.security": { icon: ShieldCheck, className: "text-amber-300", tone: "amber" },
  "log.session": { icon: ScrollText, className: "text-cyan-300", tone: "cyan" },
  "log.scope": { icon: ScrollText, className: "text-cyan-300", tone: "cyan" },
  "log.panel": { icon: FileText, className: "text-cyan-300", tone: "cyan" },
  "kpi.fanpages.pages": { icon: LayoutGrid, className: "text-indigo-300", tone: "indigo" },
  "kpi.fanpages.linked": { icon: Users, className: "text-emerald-300", tone: "emerald" },
  "kpi.fanpages.chatbotLive": { icon: Facebook, className: "text-blue-300", tone: "blue" },
  "kpi.fanpages.posts": { icon: FileText, className: "text-purple-300", tone: "purple" },
  "kpi.fanpages.reactions": { icon: BarChart3, className: "text-amber-300", tone: "amber" },
  "kpi.groups.total": { icon: Users, className: "text-indigo-300", tone: "indigo" },
  "kpi.groups.listed": { icon: Check, className: "text-emerald-300", tone: "emerald" },
  "kpi.groups.off": { icon: UserMinus, className: "text-amber-300", tone: "amber" },
  "kpi.groups.selected": { icon: Users, className: "text-blue-300", tone: "blue" },
  "kpi.groups.saved": { icon: Check, className: "text-cyan-300", tone: "cyan" },
  "kpi.channels.total": { icon: Radio, className: "text-indigo-300", tone: "indigo" },
  "kpi.channels.connected": { icon: Wifi, className: "text-emerald-300", tone: "emerald" },
  "kpi.channels.planned": { icon: WifiOff, className: "text-amber-300", tone: "amber" },
  "kpi.channels.setup": { icon: Radio, className: "text-rose-300", tone: "rose" },
  "kpi.personalities.total": { icon: Brain, className: "text-indigo-300", tone: "indigo" },
  "kpi.personalities.ragOn": { icon: Brain, className: "text-purple-300", tone: "purple" },
  "kpi.personalities.noRag": { icon: Brain, className: "text-amber-300", tone: "amber" },
  "kpi.inbox.threads": { icon: Inbox, className: "text-indigo-300", tone: "indigo" },
  "kpi.inbox.groups": { icon: Users, className: "text-purple-300", tone: "purple" },
  "kpi.inbox.dms": { icon: MessageSquare, className: "text-blue-300", tone: "blue" },
  "kpi.inbox.unread": { icon: MessageSquare, className: "text-amber-300", tone: "amber" },
  "kpi.inbox.zaloReplies": { icon: MessageSquare, className: "text-purple-300", tone: "purple" },
  "kpi.inbox.messengerReplies": { icon: Facebook, className: "text-blue-300", tone: "blue" },
  "kpi.bots.total": { icon: Bot, className: "text-indigo-300", tone: "indigo" },
  "kpi.bots.online": { icon: CheckCircle2, className: "text-emerald-300", tone: "emerald" },
  "kpi.bots.chatbotLive": { icon: Play, className: "text-blue-300", tone: "blue" },
  "kpi.fanpages.worker": { icon: Activity, className: "text-emerald-300", tone: "emerald" },
  "kpi.fanpages.webhook": { icon: Webhook, className: "text-emerald-300", tone: "emerald" },
  "kpi.fanpages.tokenHealth": { icon: ShieldCheck, className: "text-emerald-300", tone: "emerald" },
  "kpi.fanpages.lastReply": { icon: Clock, className: "text-emerald-300", tone: "emerald" },
  "kpi.fanpages.rag": { icon: Brain, className: "text-purple-300", tone: "purple" },
};

/** Legacy `kpi.analytics.*` → domain keys (P0016 Analytics tab removed). */
export const SEMANTIC_ICON_ALIASES: Record<DeprecatedSemanticIconKey, SemanticIconKey> = {
  "kpi.analytics.worker": "kpi.fanpages.worker",
  "kpi.analytics.bots": "kpi.bots.total",
  "kpi.analytics.running": "kpi.bots.chatbotLive",
  "kpi.analytics.threads": "kpi.inbox.threads",
  "kpi.analytics.zaloReplies": "kpi.inbox.zaloReplies",
  "kpi.analytics.messengerReplies": "kpi.inbox.messengerReplies",
  "kpi.analytics.replies24h": "kpi.inbox.unread",
  "kpi.analytics.latency": "kpi.fanpages.lastReply",
  "kpi.analytics.botReplies": "kpi.inbox.unread",
  "kpi.analytics.repliesToday": "kpi.inbox.unread",
  "kpi.analytics.latencyP50": "kpi.fanpages.lastReply",
  "kpi.analytics.latencyP95": "kpi.fanpages.lastReply",
  "kpi.analytics.chatbotLive": "kpi.bots.chatbotLive",
  "kpi.analytics.router": "kpi.channels.connected",
};

/** Agent kind slug → semantic key (Cursor skills / rules manifest). */
export const AGENT_KIND_SEMANTIC: Record<string, SemanticIconKey> = {
  rule: "agent.rule",
  skill: "agent.skill",
  pattern: "agent.pattern",
  command: "agent.command",
  doc: "agent.doc",
  agent: "agent.subagent",
};

/** Agent scope slug → semantic key. */
export const AGENT_SCOPE_SEMANTIC: Record<string, SemanticIconKey> = {
  workspace: "agent.scope.workspace",
  user: "agent.scope.user",
  package: "agent.scope.package",
};

let overrides: Partial<Record<SemanticIconKey, SemanticIconMeta>> = {};

export function configureSemanticIcons(next: Partial<Record<SemanticIconKey, SemanticIconMeta>>) {
  overrides = { ...overrides, ...next };
}

export function normalizeSemanticIconKey(key: SemanticIconLookupKey): SemanticIconKey {
  return SEMANTIC_ICON_ALIASES[key as DeprecatedSemanticIconKey] ?? (key as SemanticIconKey);
}

export function resolveSemanticIcon(key: SemanticIconLookupKey): SemanticIconMeta {
  const resolved = normalizeSemanticIconKey(key);
  return { ...REGISTRY[resolved], ...overrides[resolved] };
}

export function semanticFilterMeta(key: SemanticIconLookupKey): FilterIconMeta {
  const { icon, className } = resolveSemanticIcon(key);
  return { icon, className };
}

export function semanticKpiIcon(key: SemanticIconLookupKey): {
  icon: SemanticIconMeta["icon"];
  tone: KpiStripTone;
} {
  const spec = resolveSemanticIcon(key);
  return { icon: spec.icon, tone: spec.tone ?? "indigo" };
}

/** Tab header stat line — icon + Tailwind tone class. */
export function semanticHeaderStat(key: SemanticIconLookupKey): {
  icon: SemanticIconMeta["icon"];
  toneClass: string;
} {
  const { icon, className } = resolveSemanticIcon(key);
  return { icon, toneClass: className };
}

/** TOC rail + HubToolDetailSection header — golden Settings pattern. */
export function buildSemanticTocIcon(key: SemanticIconLookupKey, size = 11): ReactNode {
  const { icon: Icon, className } = resolveSemanticIcon(key);
  return createElement(
    "span",
    { "aria-hidden": true, className: "inline-flex" },
    createElement(Icon, { size: compactIconSize(size), className }),
  );
}
