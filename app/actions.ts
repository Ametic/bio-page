"use server"

import { cookies } from "next/headers"

// Fetch Discord data from Lanyard's public API
export async function getDiscordActivity(userId: string) {
  try {
    // Call Lanyard API to get Discord data
    const response = await fetch(`https://api.lanyard.rest/v1/users/${userId}`, {
      cache: "no-store", // Don't cache the response
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Discord data: ${response.status}`)
    }

    const data = await response.json()

    // If the API request was successful but the user isn't being tracked
    if (!data.success) {
      throw new Error("User not found or not being tracked by Lanyard")
    }

    // Return the data in our expected format
    return {
      user: {
        id: data.data.discord_user.id,
        username: data.data.discord_user.username,
        discriminator: data.data.discord_user.discriminator || "0",
        avatar: data.data.discord_user.avatar
          ? `https://cdn.discordapp.com/avatars/${data.data.discord_user.id}/${data.data.discord_user.avatar}.${
              data.data.discord_user.avatar.startsWith("a_") ? "gif" : "png"
            }`
          : null,
        nickname: data.data.discord_user.global_name || data.data.discord_user.username,
      },
      status: data.data.discord_status,
      activities: data.data.activities || [],
      spotify: data.data.spotify || null,
      discord_user: data.data.discord_user,
      kv: data.data.kv || {},
      active_on_discord_desktop: data.data.active_on_discord_desktop,
      active_on_discord_mobile: data.data.active_on_discord_mobile,
      active_on_discord_web: data.data.active_on_discord_web,
      listening_to_spotify: data.data.listening_to_spotify,
    }
  } catch (error) {
    console.error("Error in getDiscordActivity:", error)
    throw error
  }
}

// Track page views
let viewCount = 0 // This will reset when the server restarts

export async function incrementPageViews() {
  try {
    // Get the client IP to track unique views
    const cookieStore = cookies()
    const lastView = cookieStore.get("last_view")
    const now = Date.now()

    // If the user viewed the page in the last 1 minute, don't increment the counter
    if (lastView && now - Number.parseInt(lastView.value) < 60 * 1000) {
      return viewCount
    }

    // Increment the view count
    viewCount++

    // Set the last view time with 1 minute cooldown
    cookieStore.set("last_view", now.toString(), {
      maxAge: 60 * 60 * 24 * 30, // 30 days cookie expiration
      path: "/",
    })

    return viewCount
  } catch (error) {
    console.error("Error incrementing page views:", error)
    return viewCount // Return current count even if there's an error
  }
}

export async function getPageViews() {
  return viewCount
}
