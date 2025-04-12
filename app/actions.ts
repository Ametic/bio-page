"use server"

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
          ? `https://cdn.discordapp.com/avatars/${data.data.discord_user.id}/${data.data.discord_user.avatar}.${data.data.discord_user.avatar.startsWith("a_") ? "gif" : "png"}`
          : null,
        nickname: data.data.discord_user.global_name || data.data.discord_user.username,
      },
      status: data.data.discord_status,
      activities: data.data.activities || [],
      spotify: data.data.spotify || null,
    }
  } catch (error) {
    console.error("Error in getDiscordActivity:", error)
    throw error
  }
}
