import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getChatMessages } from "@/lib/queries";
import { ChatPage } from "@/components/dashboard/chat-page";

interface ChatPageRouteProps {
  searchParams: Promise<{ session?: string }>;
}

export default async function ChatPageRoute({ searchParams }: ChatPageRouteProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const sessionId = params.session ?? null;

  // If resuming an existing session, load its messages
  let existingMessages: Awaited<ReturnType<typeof getChatMessages>> = [];
  if (sessionId) {
    existingMessages = await getChatMessages(sessionId);
  }

  return (
    <ChatPage
      userId={user.id}
      existingSessionId={sessionId}
      existingMessages={existingMessages}
    />
  );
}
