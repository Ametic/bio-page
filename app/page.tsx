"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Github, Instagram, Linkedin, MessageSquare, Loader2, Twitter } from "lucide-react"
import Particles, { initParticlesEngine } from "@tsparticles/react"
import { loadSlim } from "@tsparticles/slim"
import { getDiscordActivity } from "@/app/actions"

// Discord data types
type DiscordActivity = {
  name: string
  type: number
  state?: string
  details?: string
  application_id?: string
  timestamps?: {
    start?: number
    end?: number
  }
  assets?: {
    large_image?: string
    large_text?: string
    small_image?: string
    small_text?: string
  }
}

type DiscordPresence = {
  user: {
    id: string
    username: string
    discriminator: string
    avatar: string | null
    nickname: string
  }
  status: string
  activities: DiscordActivity[]
  spotify?: {
    album_art_url: string
    album: string
    artist: string
    song: string
    timestamps: {
      start: number
      end: number
    }
  }
}

export default function BioPage() {
  const [init, setInit] = useState(false)
  const [discordPresence, setDiscordPresence] = useState<DiscordPresence | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const DISCORD_USER_ID = "256470398961582080"

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => {
      setInit(true)
    })

    // Fetch Discord activity
    const fetchDiscordActivity = async () => {
      try {
        setLoading(true)
        const data = await getDiscordActivity(DISCORD_USER_ID)
        setDiscordPresence(data)
      } catch (err) {
        console.error("Failed to fetch Discord activity:", err)
        setError("Couldn't load Discord activity")
      } finally {
        setLoading(false)
      }
    }

    fetchDiscordActivity()

    // Refresh Discord activity every 60 seconds
    const interval = setInterval(fetchDiscordActivity, 60000)
    return () => clearInterval(interval)
  }, [])

  // Helper function to format elapsed time
  const formatElapsedTime = (startTimestamp) => {
    if (!startTimestamp) return ""

    const now = Date.now()
    const elapsed = now - startTimestamp
    const minutes = Math.floor(elapsed / 60000)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m elapsed`
    }
    return `${minutes}m elapsed`
  }

  // Get the current activity if available
  const currentActivity = discordPresence?.activities?.find((a) => a.type === 0 || a.type === 1)

  // Helper function to get asset URL
  const getAssetUrl = (activity) => {
    if (!activity.assets?.large_image) return null

    if (activity.assets.large_image.startsWith("spotify:")) {
      return activity.assets.large_image.replace("spotify:", "https://i.scdn.co/image/")
    }

    if (activity.assets.large_image.startsWith("mp:")) {
      return `https://media.discordapp.net/${activity.assets.large_image.replace("mp:", "")}`
    }

    return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-10 px-4 relative overflow-hidden">
      {init && (
        <Particles
          id="tsparticles"
          options={{
            background: {
              color: {
                value: "#050505",
              },
            },
            particles: {
              color: {
                value: ["#9c27b0", "#673ab7", "#3f51b5"],
              },
              links: {
                color: "#ffffff",
                distance: 150,
                enable: true,
                opacity: 0.1,
                width: 1,
              },
              move: {
                enable: true,
                speed: 0.5,
                direction: "none",
                outModes: {
                  default: "out",
                },
              },
              number: {
                density: {
                  enable: true,
                  area: 800,
                },
                value: 80,
              },
              opacity: {
                value: 0.2,
              },
              size: {
                value: { min: 1, max: 3 },
              },
              shape: {
                type: "circle",
              },
            },
          }}
          className="absolute inset-0 -z-10"
        />
      )}

      <div className="max-w-md w-full backdrop-blur-xl bg-black/40 rounded-2xl shadow-xl border border-purple-500/20 p-8 relative z-10">
        {/* Profile Section */}
        <div className="mb-8 flex flex-col items-center">
          <div className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-2 border-purple-500 shadow-glow">
            {discordPresence?.user?.avatar ? (
              <Image
                src={discordPresence.user.avatar || "/placeholder.svg"}
                alt={discordPresence.user.username}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold mb-1 text-white text-glow">
            {discordPresence?.user?.nickname || "@username"}
          </h1>
          <p className="text-gray-200 text-center max-w-xs">
            Web developer, designer, and music enthusiast. Building cool things on the web.
          </p>
          <div className="flex items-center mt-2 text-sm text-gray-300">
            <span className="mr-4">
              <span className="font-semibold text-purple-400">1.2k</span> views
            </span>
            <span>
              <span className="font-semibold text-purple-400">42</span> clicks
            </span>
          </div>
        </div>

        {/* Social Icons */}
        <div className="flex gap-4 mb-8 justify-center">
          <Link
            href="#"
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-purple-600 transition-colors shadow-glow-sm"
          >
            <Twitter className="w-5 h-5 text-white" />
          </Link>
          <Link
            href="#"
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-purple-600 transition-colors shadow-glow-sm"
          >
            <Instagram className="w-5 h-5 text-white" />
          </Link>
          <Link
            href="#"
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-purple-600 transition-colors shadow-glow-sm"
          >
            <Github className="w-5 h-5 text-white" />
          </Link>
          <Link
            href="#"
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-purple-600 transition-colors shadow-glow-sm"
          >
            <Linkedin className="w-5 h-5 text-white" />
          </Link>
        </div>

        {/* Discord Activity Section */}
        <div className="w-full">
          <h2 className="text-lg font-semibold mb-3 flex items-center text-white text-glow-sm">
            <MessageSquare className="w-4 h-4 mr-2" />
            Discord
          </h2>
          <div className="bg-black/60 rounded-lg p-4 border border-purple-500/20 shadow-glow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                <span className="ml-2 text-gray-300">Loading Discord status...</span>
              </div>
            ) : error ? (
              <div className="text-gray-300 text-sm py-2">{error}</div>
            ) : (
              <>
                {/* Discord Profile */}
                <div className="flex items-center mb-4">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 mr-3">
                    {discordPresence?.user?.avatar ? (
                      <Image
                        src={discordPresence.user.avatar || "/placeholder.svg"}
                        alt={discordPresence.user.username}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-gray-900 ${
                        discordPresence?.status === "online"
                          ? "bg-green-500"
                          : discordPresence?.status === "idle"
                            ? "bg-yellow-500"
                            : discordPresence?.status === "dnd"
                              ? "bg-red-500"
                              : "bg-gray-500"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{discordPresence?.user?.nickname}</h3>
                    <p className="text-sm text-gray-300">
                      {discordPresence?.user?.username}
                      {discordPresence?.user?.discriminator !== "0" ? `#${discordPresence?.user?.discriminator}` : ""}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {discordPresence?.status === "online"
                        ? "Online"
                        : discordPresence?.status === "idle"
                          ? "Idle"
                          : discordPresence?.status === "dnd"
                            ? "Do Not Disturb"
                            : "Offline"}
                    </p>
                  </div>
                </div>

                {/* Discord Activity */}
                {currentActivity ? (
                  <div className="mt-2 border-t border-white/10 pt-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 relative rounded overflow-hidden mr-3 bg-gray-800 flex items-center justify-center">
                        {currentActivity.assets?.large_image ? (
                          <Image
                            src={getAssetUrl(currentActivity) || "/placeholder.svg"}
                            alt={currentActivity.assets.large_text || currentActivity.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <MessageSquare className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-white text-sm">{currentActivity.name}</h3>
                        <p className="text-xs text-gray-300">
                          {currentActivity.details || (currentActivity.state ? currentActivity.state : "Playing")}
                        </p>
                        {currentActivity.timestamps?.start && (
                          <p className="text-xs text-gray-400">{formatElapsedTime(currentActivity.timestamps.start)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : discordPresence?.spotify ? (
                  <div className="mt-2 border-t border-white/10 pt-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 relative rounded overflow-hidden mr-3 bg-gray-800 flex items-center justify-center">
                        <Image
                          src={discordPresence.spotify.album_art_url || "/placeholder.svg"}
                          alt={discordPresence.spotify.album}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-white text-sm">{discordPresence.spotify.song}</h3>
                        <p className="text-xs text-gray-300">by {discordPresence.spotify.artist}</p>
                        {discordPresence.spotify.timestamps?.start && (
                          <p className="text-xs text-gray-400">
                            {formatElapsedTime(discordPresence.spotify.timestamps.start)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 border-t border-white/10 pt-3 text-gray-300 text-sm">Not currently active</div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>© 2025 • Made with Next.js</p>
        </div>
      </div>
    </div>
  )
}
