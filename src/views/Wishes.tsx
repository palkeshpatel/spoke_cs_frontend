import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Loader2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SectionCard from "@/components/SectionCard";
import { getMe } from "@/services/auth";
import {
  getWishNotifications,
  markAllWishNotificationsRead,
  markWishNotificationRead,
} from "@/services/wishes";
import type { WishNotification } from "@/services/auth";
import type { ReceivedWish } from "@/services/wishes";

type LocationState = { returnTo?: string } | null;

/* ─── helpers ────────────────────────────────────────────────────────────── */
function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}
function emojiFor(t: "birthday" | "anniversary") { return t === "birthday" ? "🎂" : "🏆"; }
function labelFor(t: "birthday" | "anniversary") { return t === "birthday" ? "Birthday" : "Anniversary"; }

/* ─── global keyframes ───────────────────────────────────────────────────── */
const STYLES = `
@keyframes wishFadeUp  { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
@keyframes wishFadeIn  { from{opacity:0;transform:scale(.9)}        to{opacity:1;transform:scale(1)}     }
@keyframes wishFloat   { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-16px) rotate(1deg)} }
@keyframes wishFloatSm { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes wishGlow    { 0%,100%{box-shadow:0 0 0 0 hsl(var(--primary)/.3)} 50%{box-shadow:0 0 0 18px hsl(var(--primary)/0)} }
@keyframes wishShimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
@keyframes confettiFall{ 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(130px) rotate(720deg);opacity:0} }
@keyframes ringPulse   { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.18);opacity:.1} }
@keyframes badgeBounce { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} 60%{transform:translateY(-2px)} }

.wish-fade-up  { animation:wishFadeUp  .55s cubic-bezier(.22,1,.36,1) both; }
.wish-fade-in  { animation:wishFadeIn  .45s cubic-bezier(.22,1,.36,1) both; }
.wish-float    { animation:wishFloat   3.8s ease-in-out infinite; }
.wish-float-sm { animation:wishFloatSm 3.2s ease-in-out infinite; }
.wish-glow     { animation:wishGlow    2.4s ease-in-out infinite; }
.badge-bounce  { animation:badgeBounce 1.4s ease-in-out infinite; }
`;

/* ─── confetti ───────────────────────────────────────────────────────────── */
const CONF = ["#f59e0b","#a855f7","#ec4899","#22d3ee","#4ade80","#f97316"];
function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden h-32">
      {Array.from({ length: 18 }, (_, i) => (
        <span key={i} style={{
          position:"absolute", left:`${5+(i*5.5)%90}%`, top:"-12px",
          width: i%3===0?10:7, height: i%3===0?10:7,
          borderRadius: i%2===0?"50%":"2px",
          background: CONF[i%CONF.length],
          animation:`confettiFall ${1.1+(i%4)*.18}s ${(i*.09).toFixed(2)}s ease-in forwards`,
        }}/>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HERO A – IT'S MY OWN DAY (staff user is the celebrant)
   ═══════════════════════════════════════════════════════════════════════════ */
function HeroMyOwnDay({
  wishes, myName, myRole, onContinue,
}: { wishes: WishNotification[]; myName: string; myRole: string; onContinue: () => void }) {
  const hasBD  = wishes.some((w) => w.notification_type === "birthday");
  const hasAnn = wishes.some((w) => w.notification_type === "anniversary");

  const headline = hasBD && hasAnn ? "Birthday & Anniversary" : hasBD ? "Happy Birthday!" : "Happy Work Anniversary!";
  const badge    = hasBD && hasAnn ? "🎉 Your Special Day" : hasBD ? "🎂 Your Birthday Today" : "🏆 Your Work Anniversary";
  const sub = hasBD && hasAnn
    ? `Wow — today is extra special for you, ${myName}! Happy Birthday and Happy Work Anniversary. The whole team celebrates you! 🎊`
    : hasBD
    ? `Many happy returns of the day, ${myName}! Wishing you a fantastic year filled with joy, success, and great moments. 🎂`
    : `Congratulations on your work anniversary, ${myName}! Thank you for your dedication. The team appreciates you! 🏆`;

  return (
    <section
      className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-white shadow-2xl wish-fade-up"
      style={{ background:"linear-gradient(135deg,#7c3aed 0%,#a855f7 45%,#f59e0b 100%)" }}
    >
      <Confetti />
      <div className="pointer-events-none absolute -top-12 -left-12 h-48 w-48 rounded-full bg-white/10 blur-3xl"/>
      <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-yellow-400/20 blur-3xl"/>
      {["✨","⭐","🌟"].map((s,i)=>(
        <span key={i} className="pointer-events-none absolute text-3xl select-none wish-float-sm"
          style={{top:`${20+i*22}%`,right:`${8+i*4}%`,animationDelay:`${i*.5}s`}}>{s}</span>
      ))}

      <div className="relative grid items-center gap-10 lg:grid-cols-2">
        <div className="space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/25 px-4 py-1.5 text-sm font-semibold backdrop-blur-sm badge-bounce" style={{animationDelay:".2s"}}>
            {badge}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight wish-fade-up" style={{animationDelay:".1s"}}>
            {headline}<br/>
            <span style={{backgroundImage:"linear-gradient(90deg,#fde68a,#fbbf24,#fde68a,#fbbf24)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"wishShimmer 2.4s linear infinite"}}>
              {myName}! 🎊
            </span>
          </h1>
          <p className="max-w-lg text-base text-white/85 leading-relaxed wish-fade-up" style={{animationDelay:".2s"}}>{sub}</p>
          <div className="flex flex-wrap gap-3 pt-2 wish-fade-up" style={{animationDelay:".3s"}}>
            <button onClick={onContinue}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-purple-700 shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95">
              🎉 Celebrate &amp; Continue
            </button>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="relative wish-float" style={{animationDuration:"3s"}}>
            <span className="pointer-events-none absolute -top-12 -left-10 text-5xl select-none wish-fade-in" style={{animationDelay:".5s"}}>🎈</span>
            <span className="pointer-events-none absolute -top-10 -right-8 text-5xl select-none wish-fade-in" style={{animationDelay:".65s"}}>🎊</span>
            <span className="pointer-events-none absolute bottom-2 -right-10 text-4xl select-none wish-fade-in" style={{animationDelay:".8s"}}>✨</span>
            <div className="absolute -inset-3 rounded-full border-4 border-yellow-300/40" style={{animation:"ringPulse 2s ease-in-out infinite"}}/>
            <div className="h-44 w-44 sm:h-52 sm:w-52 rounded-full border-8 border-yellow-300/80 shadow-2xl flex items-center justify-center wish-glow"
              style={{background:"linear-gradient(135deg,#7c3aed55,#f59e0b66)"}}>
              <span className="text-5xl font-bold text-white drop-shadow-lg select-none">{initials(myName)}</span>
            </div>
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-yellow-300 px-5 py-2 text-sm font-bold text-purple-900 shadow-lg wish-fade-in" style={{animationDelay:".7s"}}>
              {myRole}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE HEADER – for admin / staff who are NOT celebrating today
   Simple, clean — no big hero card
   ═══════════════════════════════════════════════════════════════════════════ */
function CelebrationPageHeader({
  count, onContinue,
}: { count: number; onContinue: () => void }) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl px-8 py-7 wish-fade-up"
      style={{ background:"linear-gradient(135deg,hsl(var(--primary)) 0%,hsl(var(--primary)/.7) 55%,#f59e0b 100%)" }}
    >
      <div className="pointer-events-none absolute -top-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"/>
      <div className="pointer-events-none absolute bottom-0 right-0 h-44 w-44 rounded-full bg-amber-400/15 blur-2xl"/>
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm mb-2 badge-bounce" style={{animationDelay:".2s"}}>
            🎉 Today's Celebrations
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {count > 0
              ? <>{count} {count === 1 ? "person is" : "people are"} celebrating today!</>
              : "No celebrations today"}
          </h1>
          {count > 0 && (
            <p className="text-sm text-white/75 mt-1">Don't forget to send your wishes to the team below 👇</p>
          )}
        </div>
        <button onClick={onContinue}
          className="inline-flex items-center gap-2 rounded-xl border border-white/50 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/15 active:scale-95 shrink-0">
          🏠 Back to App
        </button>
      </div>
    </div>
  );
}

/* ─── Stat tile ───────────────────────────────────────────────────────────── */
function StatTile({ emoji, count, label, delay }: { emoji:string; count:number; label:string; delay:string }) {
  return (
    <div className="rounded-3xl bg-card border border-border p-5 shadow-sm wish-fade-up transition-transform hover:-translate-y-1 hover:shadow-md" style={{animationDelay:delay}}>
      <div className="text-3xl">{emoji}</div>
      <div className="mt-2 text-3xl font-bold text-foreground">{count}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

/* ─── Celebration Card ────────────────────────────────────────────────────── */
function CelebCard({
  item, onMarkRead, isPending, delay,
}: { item:WishNotification; onMarkRead:()=>void; isPending:boolean; delay:string }) {
  const name  = item.source_user?.name ?? "Unknown";
  const role  = item.source_user?.role_name ?? "Staff";
  const emoji = emojiFor(item.notification_type);
  const label = labelFor(item.notification_type);
  const isBD  = item.notification_type === "birthday";

  return (
    <div className="group rounded-3xl bg-card border border-border p-6 shadow-sm flex flex-col gap-5 transition-all hover:-translate-y-1 hover:shadow-lg wish-fade-up" style={{animationDelay:delay}}>
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full border-4 border-border flex items-center justify-center shrink-0 text-xl font-bold text-white shadow transition-transform group-hover:scale-110"
          style={{background:isBD?"linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary)/.6))":"linear-gradient(135deg,#f59e0b,#ef4444aa)"}}>
          {initials(name)}
        </div>
        <div>
          <p className="font-semibold text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </div>

      <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium w-fit ${isBD?"bg-pink-100 text-pink-700":"bg-amber-100 text-amber-700"}`}>
        {emoji} {label}
        {!item.is_read && <span className="ml-1 h-2 w-2 rounded-full bg-current animate-pulse"/>}
      </span>

      <p className="text-xs text-muted-foreground -mt-2">{format(new Date(item.event_date),"dd MMMM yyyy")}</p>

      <button onClick={onMarkRead} disabled={isPending||item.is_read}
        className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 ${item.is_read?"bg-muted text-muted-foreground cursor-default":"text-white shadow-md"}`}
        style={item.is_read?{}:{background:isBD?"hsl(var(--primary))":"linear-gradient(135deg,#f59e0b,#ef4444)"}}>
        {isPending ? <Loader2 className="mx-auto h-4 w-4 animate-spin"/> : item.is_read ? "✓ Wished" : isBD ? "🎂 Send Wishes" : "🏆 Congratulate"}
      </button>
    </div>
  );
}

/* ─── Received Wish row ───────────────────────────────────────────────────── */
function ReceivedWishRow({ item, delay }: { item: ReceivedWish; delay: string }) {
  const name = item.from_user?.name ?? "Someone";
  const role = item.from_user?.role_name ?? "Staff";
  const isBD = item.notification_type === "birthday";

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/60 px-5 py-4 wish-fade-up" style={{animationDelay:delay}}>
      <div className="h-11 w-11 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white shadow"
        style={{background:isBD?"linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary)/.6))":"linear-gradient(135deg,#f59e0b,#ef4444aa)"}}>
        {initials(name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground text-sm">{name}
          <span className="ml-1.5 text-xs text-muted-foreground font-normal">· {role}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {emojiFor(item.notification_type)} Wished you a Happy {labelFor(item.notification_type)}
        </p>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
        {format(new Date(item.wished_at), "hh:mm a")}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export default function WishesPage() {
  const queryClient = useQueryClient();
  const navigate    = useNavigate();
  const location    = useLocation();
  const state       = location.state as LocationState;

  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe });
  const currentUserId   = meData?.user?.id;
  const currentUserName = meData?.user?.name ?? "You";
  const currentUserRole =
    (meData?.user as any)?.role_record?.role_name ??
    (meData?.user as any)?.roleRecord?.role_name ??
    "Staff";

  const { data, isLoading } = useQuery({ queryKey: ["wishes"], queryFn: getWishNotifications });

  const markOne = useMutation({
    mutationFn: markWishNotificationRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["wishes"] });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
  const markAll = useMutation({
    mutationFn: markAllWishNotificationsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["wishes"] });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const todayWishes      = data?.today_wishes ?? [];
  const allNotifications = data?.notifications ?? [];
  const receivedWishes   = data?.received_wishes ?? [];

  const todayWishIds = useMemo(() => new Set(todayWishes.map((w) => w.id)), [todayWishes]);

  // My own celebrations today (I am the person being celebrated)
  const myOwnWishes  = useMemo(() => todayWishes.filter((w) => w.source_user_id === currentUserId), [todayWishes, currentUserId]);
  // Others celebrating today (I should wish them)
  const othersWishes = useMemo(() => todayWishes.filter((w) => w.source_user_id !== currentUserId), [todayWishes, currentUserId]);

  const olderNotifications = useMemo(
    () => allNotifications.filter((n) => !todayWishIds.has(n.id)),
    [allNotifications, todayWishIds],
  );

  const unreadCount      = data?.notification_count ?? 0;
  const returnTo         = state?.returnTo ?? "/";
  const birthdayCount    = todayWishes.filter((w) => w.notification_type === "birthday").length;
  const anniversaryCount = todayWishes.filter((w) => w.notification_type === "anniversary").length;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
        <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
        Loading celebrations...
      </div>
    );
  }

  const isMyOwnDay = myOwnWishes.length > 0;

  return (
    <>
      <style>{STYLES}</style>
      <div className="space-y-8 max-w-5xl mx-auto">

        {/* ── HERO / PAGE HEADER ── */}
        {isMyOwnDay ? (
          /* Personal greeting for the celebrant */
          <HeroMyOwnDay
            wishes={myOwnWishes}
            myName={currentUserName}
            myRole={currentUserRole}
            onContinue={() => navigate(returnTo, { replace: true })}
          />
        ) : (
          /* Compact header for everyone else (admin, other staff) */
          <CelebrationPageHeader
            count={othersWishes.length}
            onContinue={() => navigate(returnTo, { replace: true })}
          />
        )}

        {/* ── STATS ── */}
        {todayWishes.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile emoji="🎂" count={birthdayCount}                               label="Birthdays Today"     delay=".05s"/>
            <StatTile emoji="🏆" count={anniversaryCount}                            label="Anniversaries Today"  delay=".1s"/>
            <StatTile emoji="💌" count={todayWishes.filter((w)=>w.is_read).length}   label="Wishes Sent"          delay=".15s"/>
            <StatTile emoji="👥" count={todayWishes.length}                          label="Celebrating Today"    delay=".2s"/>
          </div>
        )}

        {/* ── TIP when it's MY day but others also celebrate ── */}
        {isMyOwnDay && othersWishes.length > 0 && (
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm text-yellow-800 flex items-center gap-3 dark:bg-yellow-900/20 dark:border-yellow-800/40 dark:text-yellow-300 wish-fade-up" style={{animationDelay:".25s"}}>
            <span className="text-2xl">🥳</span>
            <span>It's your special day — but your teammates are also celebrating! Don't forget to wish them below.</span>
          </div>
        )}

        {/* ── OTHERS TO WISH grid ── */}
        {othersWishes.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 wish-fade-up" style={{animationDelay:".25s"}}>
              <h2 className="text-2xl font-bold text-foreground">
                {isMyOwnDay ? "Others Celebrating Today" : "Today's Celebrations"}
              </h2>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Badge className="gap-1.5 rounded-full">
                    <Bell className="h-3.5 w-3.5"/> {unreadCount} unread
                  </Badge>
                )}
                <Button size="sm" variant="outline" className="rounded-full"
                  onClick={() => markAll.mutate()}
                  disabled={markAll.isPending || unreadCount === 0}>
                  {markAll.isPending
                    ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin"/>
                    : <CheckCheck className="mr-1.5 h-4 w-4"/>}
                  Mark all read
                </Button>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {othersWishes.map((item, i) => (
                <CelebCard
                  key={item.id}
                  item={item}
                  onMarkRead={() => markOne.mutate(item.id)}
                  isPending={markOne.isPending && markOne.variables === item.id}
                  delay={`${0.3+i*0.07}s`}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── WISHES YOU RECEIVED (only for celebrant) ── */}
        {isMyOwnDay && (
          <div className="space-y-4 wish-fade-up" style={{animationDelay:".35s"}}>
            <h2 className="text-2xl font-bold text-foreground">
              Wishes You Received
              {receivedWishes.length > 0 && (
                <span className="ml-2 text-base font-normal text-muted-foreground">
                  ({receivedWishes.length} {receivedWishes.length === 1 ? "person" : "people"} wished you)
                </span>
              )}
            </h2>

            {receivedWishes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
                <p className="text-3xl mb-2">💌</p>
                <p className="text-sm">No wishes yet — check back soon, your team will wish you!</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {receivedWishes.map((item, i) => (
                  <ReceivedWishRow key={item.id} item={item} delay={`${0.35+i*0.06}s`}/>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── OLDER NOTIFICATIONS ── */}
        {olderNotifications.length > 0 && (
          <SectionCard title={`Previous Notifications (${olderNotifications.length})`}>
            <div className="grid gap-3">
              {olderNotifications.map((item, i) => {
                const name  = item.source_user?.name ?? "Unknown";
                const emoji = emojiFor(item.notification_type);
                return (
                  <div key={item.id}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-card/50 p-4 transition-all hover:bg-card wish-fade-up"
                    style={{animationDelay:`${.05*i}s`}}>
                    <div className="flex gap-3 items-start">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground shrink-0">
                        {initials(name)}
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-medium text-foreground text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.body}</p>
                        <p className="text-xs text-muted-foreground">
                          {emoji} {labelFor(item.notification_type)} • {format(new Date(item.event_date),"dd-MMM-yyyy")}
                          {item.is_read && <span className="ml-2 text-green-600">✓ Read</span>}
                        </p>
                      </div>
                    </div>
                    {!item.is_read && (
                      <Button variant="outline" size="sm" className="shrink-0 rounded-full"
                        onClick={() => markOne.mutate(item.id)} disabled={markOne.isPending}>
                        Mark read
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* ── CONTINUE ── */}
        <div className="flex justify-center pb-4 wish-fade-up" style={{animationDelay:".4s"}}>
          <Button variant="outline" className="rounded-full px-8" onClick={() => navigate(returnTo, { replace: true })}>
            Continue to App <ArrowRight className="ml-2 h-4 w-4"/>
          </Button>
        </div>

      </div>
    </>
  );
}
