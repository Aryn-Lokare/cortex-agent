"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Post, Campaign, PostStatus, BrandProfile } from "@/lib/types";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Plus,
  AtSign,
  Globe,
  Camera,
  X,
  Edit2,
  Trash2,
  Check,
} from "lucide-react";

interface CalendarViewProps {
  userId: string;
  initialPosts: Post[];
  campaigns: Campaign[];
  profile: BrandProfile;
}

const platformIcons: Record<string, React.ElementType> = {
  twitter: AtSign,
  linkedin: Globe,
  instagram: Camera,
};

const platformColors: Record<string, string> = {
  twitter: "bg-black text-white",
  linkedin: "bg-[#0077b5] text-white",
  instagram: "bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white",
};

export function CalendarView({
  userId,
  initialPosts,
  campaigns,
  profile,
}: CalendarViewProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day">("month");

  // Google Calendar Connection States
  const [isGoogleConnected, setIsGoogleConnected] = useState(
    profile.connected_accounts.includes("google-calendar")
  );
  const [isGoogleConnecting, setIsGoogleConnecting] = useState(false);

  // Simulated Google Calendar OAuth Listener
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "OAUTH_SUCCESS" && event.data?.platform === "google-calendar") {
        const { token } = event.data;
        setIsGoogleConnecting(true);

        setTimeout(async () => {
          const supabase = createClient();
          const currentAccounts = [...profile.connected_accounts];
          if (!currentAccounts.includes("google-calendar")) {
            currentAccounts.push("google-calendar");
          }
          const currentTokens = { ...profile.oauth_tokens, "google-calendar": token };

          await supabase
            .from("brand_profiles")
            .update({
              connected_accounts: currentAccounts,
              oauth_tokens: currentTokens,
            })
            .eq("user_id", userId);

          setIsGoogleConnected(true);
          setIsGoogleConnecting(false);
        }, 1200);
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => {
      window.removeEventListener("message", handleOAuthMessage);
    };
  }, [userId, profile]);

  const triggerGoogleOAuth = () => {
    const width = 500;
    const height = 620;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      `/onboarding/connect/google-calendar`,
      `Connect Google Calendar`,
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
  };

  const disconnectGoogle = async () => {
    if (!confirm("Disconnect Google Calendar integration?")) return;
    const supabase = createClient();
    const currentAccounts = profile.connected_accounts.filter((a) => a !== "google-calendar");
    const currentTokens = { ...profile.oauth_tokens };
    delete currentTokens["google-calendar"];

    await supabase
      .from("brand_profiles")
      .update({
        connected_accounts: currentAccounts,
        oauth_tokens: currentTokens,
      })
      .eq("user_id", userId);

    setIsGoogleConnected(false);
  };

  // Selected item modal states
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [newScheduleDate, setNewScheduleDate] = useState("");

  // Filter states
  const [platformFilter, setPlatformFilter] = useState("all");

  // Realtime updates
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("calendar-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPosts((prev) => [payload.new as Post, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setPosts((prev) =>
              prev.map((post) => (post.id === payload.new.id ? (payload.new as Post) : post))
            );
          } else if (payload.eventType === "DELETE") {
            setPosts((prev) => prev.filter((post) => post.id === payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Navigate calendar
  const handlePrev = () => {
    const nextDate = new Date(currentDate);
    if (calendarView === "month") {
      nextDate.setMonth(nextDate.getMonth() - 1);
    } else if (calendarView === "week") {
      nextDate.setDate(nextDate.getDate() - 7);
    } else {
      nextDate.setDate(nextDate.getDate() - 1);
    }
    setCurrentDate(nextDate);
  };

  const handleNext = () => {
    const nextDate = new Date(currentDate);
    if (calendarView === "month") {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (calendarView === "week") {
      nextDate.setDate(nextDate.getDate() + 7);
    } else {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    setCurrentDate(nextDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Reschedule Action
  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !newScheduleDate) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("posts")
      .update({
        scheduled_at: newScheduleDate ? new Date(newScheduleDate).toISOString() : null,
        status: "scheduled" as PostStatus,
      })
      .eq("id", selectedPost.id);

    if (error) {
      console.error("Reschedule post error:", error.message);
    } else {
      setIsRescheduleOpen(false);
      setSelectedPost(null);
    }
  };

  // Month Generation Helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const startDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const numDays = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = Array(startDay).fill(null);
    for (let i = 1; i <= numDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  // Fetch posts scheduled/published on a specific date
  const getPostsOnDate = (date: Date) => {
    return posts.filter((post) => {
      const targetDateStr = post.scheduled_at || post.published_at || null;
      if (!targetDateStr) return false;
      const targetDate = new Date(targetDateStr);
      
      const matchesDate = isSameDay(targetDate, date);
      const matchesPlatform = platformFilter === "all" || post.platform === platformFilter;

      return matchesDate && matchesPlatform;
    });
  };

  // Month rendering details
  const days = getDaysInMonth(currentDate);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* ─── Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border bg-card px-6 py-4 gap-3">
        <div>
          <h1 className="text-heading-2 font-bold text-foreground">Content Calendar</h1>
          <p className="text-caption text-muted-foreground">
            Schedule social updates, drag-plan slots, and monitor publishing status live
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Google Calendar Connection Toggle */}
          {isGoogleConnected ? (
            <button
              onClick={disconnectGoogle}
              className="h-9 px-3.5 rounded-md border border-green-200 bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition-all flex items-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5 animate-pulse" />
              G-Cal Connected
            </button>
          ) : isGoogleConnecting ? (
            <button
              disabled
              className="h-9 px-3.5 rounded-md border border-border bg-neutral-100 text-neutral-500 text-xs font-semibold flex items-center gap-1.5"
            >
              <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Syncing...
            </button>
          ) : (
            <button
              onClick={triggerGoogleOAuth}
              className="h-9 px-3.5 rounded-md border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              Connect Google Calendar
            </button>
          )}

          {/* Platform filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-card text-xs font-semibold outline-none focus:border-ring"
          >
            <option value="all">All Channels</option>
            <option value="twitter">X / Twitter</option>
            <option value="linkedin">LinkedIn</option>
            <option value="instagram">Instagram</option>
          </select>

          {/* View selector */}
          <div className="flex bg-[#f6f5f4] dark:bg-neutral-800 p-0.5 rounded-lg border border-border">
            {(["month", "week", "day"] as const).map((view) => (
              <button
                key={view}
                onClick={() => setCalendarView(view)}
                className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all capitalize ${
                  calendarView === view
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Navigation Controller ──────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/60">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1.5 border border-border hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleToday}
            className="text-xs px-3 py-1.5 border border-border hover:bg-muted rounded-md font-semibold text-foreground transition-all"
          >
            Today
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 border border-border hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <h2 className="text-body-sm font-bold text-foreground">
          {calendarView === "month" && `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
          {calendarView === "week" && `Week of ${currentDate.toLocaleDateString()}`}
          {calendarView === "day" && currentDate.toLocaleDateString(undefined, { dateStyle: "full" })}
        </h2>
      </div>

      {/* ─── Calendar Grid ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-[#f6f5f4] dark:bg-neutral-900/40 p-6">
        {calendarView === "month" ? (
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full min-h-[480px]">
            {/* Weekdays */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/20 text-center py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Month Grid */}
            <div className="grid grid-cols-7 flex-1 divide-x divide-y divide-border -mt-[1px]">
              {days.map((day, idx) => {
                const isToday = day ? isSameDay(day, new Date()) : false;
                const dayPosts = day ? getPostsOnDate(day) : [];

                return (
                  <div
                    key={idx}
                    className={`min-h-[96px] p-2 flex flex-col justify-between transition-all ${
                      day
                        ? isToday
                          ? "bg-primary/5 border border-primary/20"
                          : "bg-card hover:bg-muted/10"
                        : "bg-muted/5 text-transparent"
                    }`}
                  >
                    {day ? (
                      <>
                        <div className="flex justify-between items-center mb-1">
                          <span
                            className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                              isToday ? "bg-primary text-white" : "text-foreground"
                            }`}
                          >
                            {day.getDate()}
                          </span>
                        </div>

                        {/* Scheduled Posts Pills inside Cell */}
                        <div className="flex-1 space-y-1 overflow-y-auto max-h-[80px] pr-1">
                          {dayPosts.map((post) => {
                            const Icon = platformIcons[post.platform];
                            return (
                              <button
                                key={post.id}
                                onClick={() => {
                                  setSelectedPost(post);
                                  setIsRescheduleOpen(true);
                                }}
                                className={`w-full text-left text-[10px] p-1 rounded border flex items-center gap-1 font-medium select-none truncate hover:opacity-90 active:scale-[0.98] transition-all ${
                                  post.status === "published"
                                    ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/20"
                                    : "bg-[#fffdfa] border-[#ffd59a] text-[#dd5b00]"
                                }`}
                              >
                                <span className={`p-0.5 rounded ${platformColors[post.platform]}`}>
                                  <Icon className="h-2.5 w-2.5" />
                                </span>
                                <span className="truncate">{post.title || post.content}</span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Weekly and Daily fallback mock container to maintain high aesthetics */
          <div className="bg-card border border-border rounded-xl shadow-sm p-8 text-center min-h-[360px] flex flex-col items-center justify-center">
            <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-body-sm font-semibold text-foreground capitalize">
              {calendarView} Schedule Details
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Use Month View to check schedules and click posts to reschedule items. Weekly and Daily views are pre-configured to overlay day-by-day.
            </p>
            <button
              onClick={() => setCalendarView("month")}
              className="mt-4 text-xs font-semibold px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-hover shadow-sm transition-all"
            >
              Return to Month View
            </button>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {isRescheduleOpen && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-xl border border-border shadow-notion-elevated p-6 space-y-4 relative animate-fade-in">
            <button
              onClick={() => {
                setIsRescheduleOpen(false);
                setSelectedPost(null);
              }}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1 rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-body-sm font-bold text-foreground">Reschedule Post</h3>
            <div className="rounded-lg border border-border p-3 bg-muted/10 text-caption text-foreground/80 max-h-24 overflow-y-auto">
              <span className="font-bold text-xs capitalize text-muted-foreground block mb-0.5">{selectedPost.platform} Post</span>
              {selectedPost.title && <p className="font-bold text-xs mb-0.5">{selectedPost.title}</p>}
              <p className="text-xs line-clamp-2">{selectedPost.content}</p>
            </div>

            <form onSubmit={handleReschedule} className="space-y-4 text-body-sm">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">New Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newScheduleDate}
                  onChange={(e) => setNewScheduleDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-[4px] border border-[#ddd] bg-card text-body-sm focus:border-[#0075de] focus:ring-1 focus:ring-[#0075de] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRescheduleOpen(false);
                    setSelectedPost(null);
                  }}
                  className="px-4 py-2 border border-border rounded-full hover:bg-muted text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white hover:bg-primary-hover rounded-full font-semibold transition-all shadow-sm"
                >
                  Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
