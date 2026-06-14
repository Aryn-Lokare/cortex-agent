"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { upsertBrandProfile } from "@/lib/queries";
import type { BrandProfile } from "@/lib/types";

export async function saveBrandProfile(profileData: {
  user_id: string;
  user_name: string;
  brand_name: string;
  brand_description: string;
  brand_voice: string;
  tone_preferences: string;
  writing_style_parameters: string;
  content_constraints: string;
  connected_accounts: string[];
  oauth_tokens: Record<string, string>;
}) {
  if (!profileData.user_id) {
    throw new Error("User ID is required");
  }

  // Format matching the Database Schema
  await upsertBrandProfile({
    user_id: profileData.user_id,
    user_name: profileData.user_name,
    brand_name: profileData.brand_name,
    brand_description: profileData.brand_description,
    brand_voice: profileData.brand_voice,
    tone_preferences: profileData.tone_preferences,
    writing_style_parameters: profileData.writing_style_parameters,
    content_constraints: profileData.content_constraints,
    connected_accounts: profileData.connected_accounts as any, // Cast array to match DB JSONB
    oauth_tokens: profileData.oauth_tokens,
  });

  // Revalidate dashboard routes so the layout guard detects the new profile
  revalidatePath("/dashboard", "layout");
  revalidatePath("/onboarding");

  redirect("/dashboard");
}
