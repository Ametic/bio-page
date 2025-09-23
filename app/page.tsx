"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Github,
  Instagram,
  Linkedin,
  MessageSquare,
  Loader2,
  Twitter,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react"
import Particles, { initParticlesEngine } from "@tsparticles/react"
import { loadSlim } from "@tsparticles/slim"
import { getDiscordActivity, incrementPageViews, getPageViews } from "@/app/actions"

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
  emoji?: {
    name: string
    id?: string
    animated?: boolean
  }
  buttons?: string[]
  created_at?: number
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
  discord_user: any
  kv: Record<string, any>
  active_on_discord_desktop: boolean
  active_on_discord_mobile: boolean
  active_on_discord_web: boolean
  listening_to_spotify: boolean
}

export default function BioPage() {
  const [init, setInit] = useState(false)
  const [discordPresence, setDiscordPresence] = useState<DiscordPresence | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewCount, setViewCount] = useState(0)
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0)
  const [progressPercent, setProgressPercent] = useState<number>(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Mouse position for parallax effect
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const DISCORD_USER_ID = "256470398961582080"

  // Calculate and update progress percentage
  const updateProgress = useCallback(() => {
    if (!discordPresence?.activities && !discordPresence?.spotify) {
      setProgressPercent(0)
      return
    }

    // Get all displayable activities (excluding custom status which is shown separately)
    const displayableActivities = discordPresence?.activities?.filter((a) => a.type !== 4) || []

    // Add Spotify as an activity if it exists and isn't already in activities
    const allActivities =
      discordPresence?.spotify && !displayableActivities.some((a) => a.name === "Spotify")
        ? [
            ...displayableActivities,
            {
              name: "Spotify",
              type: 2,
              details: discordPresence.spotify.song,
              state: `by ${discordPresence.spotify.artist}`,
              assets: {
                large_image: discordPresence.spotify.album_art_url,
                large_text: discordPresence.spotify.album,
              },
              timestamps: discordPresence.spotify.timestamps,
            },
          ]
        : displayableActivities

    if (!allActivities || allActivities.length === 0 || !allActivities[currentActivityIndex]) {
      setProgressPercent(0)
      return
    }

    const activity = allActivities[currentActivityIndex]
    const now = Date.now()

    // If activity has both start and end time (like Spotify)
    if (activity.timestamps?.start && activity.timestamps?.end) {
      const start = activity.timestamps.start
      const end = activity.timestamps.end
      const total = end - start
      const elapsed = now - start

      // Calculate percentage (clamped between 0-100)
      const percent = Math.max(0, Math.min(100, (elapsed / total) * 100))
      setProgressPercent(percent)
    }
    // If activity only has start time (like games, etc.)
    else if (activity.timestamps?.start) {
      const start = activity.timestamps.start
      const elapsed = now - start

      // For activities with only start time, we'll use a 2-hour maximum
      // This is arbitrary but provides a reasonable scale
      const maxDuration = 2 * 60 * 60 * 1000 // 2 hours in milliseconds

      // Calculate percentage (capped at 100%)
      const percent = Math.min(100, (elapsed / maxDuration) * 100)
      setProgressPercent(percent)
    } else {
      // For activities without timestamps, use a pulsing effect
      // This creates a progress bar that moves back and forth
      const time = now / 1000
      const pulse = (Math.sin(time) + 1) / 2 // Oscillates between 0 and 1
      setProgressPercent(pulse * 30) // Scale to max 30% for subtle effect
    }
  }, [discordPresence, currentActivityIndex])

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
        // Reset activity index when data changes
        setCurrentActivityIndex(0)
      } catch (err) {
        console.error("Failed to fetch Discord activity:", err)
        setError("Couldn't load Discord activity")
      } finally {
        setLoading(false)
      }
    }

    fetchDiscordActivity()

    // Increment page views
    const trackPageView = async () => {
      try {
        const views = await incrementPageViews()
        setViewCount(views)
      } catch (err) {
        console.error("Failed to track page view:", err)
      }
    }

    trackPageView()

    // Refresh Discord activity every 60 seconds
    const interval = setInterval(fetchDiscordActivity, 60000)

    // Refresh view count every 30 seconds
    const viewInterval = setInterval(async () => {
      const views = await getPageViews()
      setViewCount(views)
    }, 30000)

    // Mouse move handler for parallax effect
    const handleMouseMove = (e: MouseEvent) => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left - rect.width / 2
        const y = e.clientY - rect.top - rect.height / 2
        setMousePosition({ x, y })
      }
    }

    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      clearInterval(interval)
      clearInterval(viewInterval)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  // Update progress whenever the current activity changes
  useEffect(() => {
    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    // Initial update
    updateProgress()

    // Set up new interval
    progressIntervalRef.current = setInterval(() => {
      updateProgress()
    }, 1000)

    // Cleanup on unmount or when activity changes
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [updateProgress])

  // Helper function to get asset URL
  const getAssetUrl = (activity: any) => {
    if (!activity.assets?.large_image) return null

    if (activity.assets.large_image.startsWith("spotify:")) {
      return activity.assets.large_image.replace("spotify:", "https://i.scdn.co/image/")
    }

    if (activity.assets.large_image.startsWith("mp:")) {
      return `https://media.discordapp.net/${activity.assets.large_image.replace("mp:", "")}`
    }

    return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`
  }

  // Helper function to get small asset URL
  const getSmallAssetUrl = (activity: any) => {
    if (!activity.assets?.small_image) return null

    if (activity.assets.small_image.startsWith("spotify:")) {
      return activity.assets.small_image.replace("spotify:", "https://i.scdn.co/image/")
    }

    if (activity.assets.small_image.startsWith("mp:")) {
      return `https://media.discordapp.net/${activity.assets.small_image.replace("mp:", "")}`
    }

    return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.small_image}.png`
  }

  // Helper function to get activity type name
  const getActivityTypeName = (type: number) => {
    switch (type) {
      case 0:
        return "Playing"
      case 1:
        return "Streaming"
      case 2:
        return "Listening to"
      case 3:
        return "Watching"
      case 4:
        return "Custom Status"
      case 5:
        return "Competing in"
      default:
        return "Using"
    }
  }

  // Format milliseconds to a human-readable time string
  const formatTime = (ms: number): string => {
    if (ms < 0) ms = 0

    const seconds = Math.floor((ms / 1000) % 60)
    const minutes = Math.floor((ms / (1000 * 60)) % 60)
    const hours = Math.floor(ms / (1000 * 60 * 60))

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  // Get all displayable activities (excluding custom status which is shown separately)
  const displayableActivities = discordPresence?.activities?.filter((a) => a.type !== 4) || []

  // Add Spotify as an activity if it exists and isn't already in activities
  const allActivities =
    discordPresence?.spotify && !displayableActivities.some((a) => a.name === "Spotify")
      ? [
          ...displayableActivities,
          {
            name: "Spotify",
            type: 2,
            details: discordPresence.spotify.song,
            state: `by ${discordPresence.spotify.artist}`,
            assets: {
              large_image: discordPresence.spotify.album_art_url,
              large_text: discordPresence.spotify.album,
            },
            timestamps: discordPresence.spotify.timestamps,
          },
        ]
      : displayableActivities

  // Get current activity
  const currentActivity = allActivities[currentActivityIndex]

  // Navigation functions
  const nextActivity = () => {
    if (allActivities.length > 1) {
      setCurrentActivityIndex((prev) => (prev + 1) % allActivities.length)
    }
  }

  const prevActivity = () => {
    if (allActivities.length > 1) {
      setCurrentActivityIndex((prev) => (prev - 1 + allActivities.length) % allActivities.length)
    }
  }

  // Calculate parallax transform based on mouse position
  const parallaxTransform = () => {
    if (!cardRef.current) return {}

    const { x, y } = mousePosition
    const rect = cardRef.current.getBoundingClientRect()
    const maxX = rect.width / 2
    const maxY = rect.height / 2

    // Limit the movement to a small range (5px in each direction)
    const moveX = (x / maxX) * 5
    const moveY = (y / maxY) * 5

    return {
      transform: `perspective(1000px) rotateX(${-moveY * 0.5}deg) rotateY(${moveX * 0.5}deg) translateX(${moveX}px) translateY(${moveY}px)`,
      transition: "transform 0.1s ease-out",
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-10 px-4 relative overflow-hidden">
      {/* Particles.js container */}
      {init && (
        <Particles
          id="tsparticles"
          options={{
            fpsLimit: 120,
            fullScreen: {
              enable: true,
              zIndex: -1,
            },
            background: {
              color: {
                value: "#050505",
              },
            },
            particles: {
              color: {
                value: "#ffffff",
              },
              links: {
                color: "#ffffff",
                distance: 150,
                enable: true,
                opacity: 0.3,
                width: 1,
              },
              move: {
                enable: true,
                speed: 0.8,
                direction: "none",
                random: true,
                straight: false,
                outModes: {
                  default: "out",
                },
              },
              number: {
                density: {
                  enable: true,
                  area: 800,
                },
                value: 120,
              },
              opacity: {
                value: 0.5,
              },
              size: {
                value: { min: 1, max: 3 },
              },
              shape: {
                type: "circle",
              },
            },
            detectRetina: true,
          }}
          className="absolute inset-0 -z-10"
        />
      )}

      <div
        ref={cardRef}
        style={parallaxTransform()}
        className="max-w-md w-full backdrop-blur-xl bg-black/40 rounded-2xl shadow-xl border border-purple-500/20 p-8 relative z-10"
      >
        {/* View Counter */}
        <div className="absolute top-3 left-3 mt-1 flex items-center text-xs text-gray-300 bg-black/60 px-2 py-1 rounded-full shadow-glow-sm">
          <Eye className="w-3 h-3 mr-1 text-purple-400" />
          <span>{viewCount} views</span>
        </div>

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
              <div>
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
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                      <p className="text-xs text-gray-400">
                        {discordPresence?.status === "online"
                          ? "Online"
                          : discordPresence?.status === "idle"
                            ? "Idle"
                            : discordPresence?.status === "dnd"
                              ? "Do Not Disturb"
                              : "Offline"}
                      </p>
                      {discordPresence?.active_on_discord_mobile && <p className="text-xs text-gray-400">Mobile</p>}
                      {discordPresence?.active_on_discord_web && <p className="text-xs text-gray-400">Web</p>}
                    </div>
                  </div>
                </div>

                {/* Custom Status */}
                {discordPresence?.activities?.find((a) => a.type === 4) && (
                  <div className="mb-3 pb-3 border-b border-white/10">
                    <div className="text-sm text-gray-300 flex items-center">
                      <span className="text-xs text-purple-400 mr-2">Status:</span>
                      {discordPresence.activities.find((a) => a.type === 4)?.emoji?.name && (
                        <span className="mr-1">
                          {discordPresence.activities.find((a) => a.type === 4)?.emoji?.name}
                        </span>
                      )}
                      {discordPresence.activities.find((a) => a.type === 4)?.state || ""}
                    </div>
                  </div>
                )}

                {/* Discord Activity with Navigation */}
                {allActivities.length > 0 ? (
                  <div className="relative">
                    {/* Activity Navigation */}
                    {allActivities.length > 1 && (
                      <div className="flex justify-between absolute -top-1 right-0 text-xs text-gray-400">
                        <span>
                          {currentActivityIndex + 1}/{allActivities.length}
                        </span>
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex">
                        <div className="w-20 flex-shrink-0">
                          <div className="relative">
                            {/* Increased size of album art */}
                            <div className="w-20 h-20 relative rounded overflow-hidden bg-gray-800 flex items-center justify-center">
                              {currentActivity?.assets?.large_image ? (
                                <Image
                                  src={getAssetUrl(currentActivity) || "/placeholder.svg"}
                                  alt={currentActivity.assets.large_text || currentActivity.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <MessageSquare className="w-6 h-6 text-gray-400" />
                              )}
                            </div>

                            {/* Small image overlay - adjusted position for larger image */}
                            {currentActivity?.assets?.small_image && (
                              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full overflow-hidden border-2 border-black bg-gray-800">
                                <Image
                                  src={getSmallAssetUrl(currentActivity) || "/placeholder.svg"}
                                  alt={currentActivity.assets.small_text || ""}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 ml-3">
                          <div className="flex items-center">
                            <span className="text-xs text-purple-400 mr-2">
                              {getActivityTypeName(currentActivity?.type)}
                            </span>
                            <h3 className="font-medium text-white text-sm">{currentActivity?.name}</h3>
                          </div>

                          {currentActivity?.details && (
                            <p className="text-xs text-gray-300">{currentActivity.details}</p>
                          )}

                          {currentActivity?.state && <p className="text-xs text-gray-400">{currentActivity.state}</p>}

                          {/* Buttons - only show if we have them */}
                          {currentActivity?.buttons && currentActivity.buttons.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {currentActivity.buttons.map((button, idx) => (
                                <span key={idx} className="text-xs bg-purple-900/50 text-white px-2 py-1 rounded-md">
                                  {button}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Progress Bar with Time Elapsed/Remaining - only show for Spotify */}
                          {currentActivity?.timestamps && currentActivity?.name === "Spotify" && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between mb-1 text-xs text-gray-400">
                                {currentActivity.timestamps.start && (
                                  <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1 text-purple-400" />
                                    {formatTime(Date.now() - currentActivity.timestamps.start)}
                                  </span>
                                )}
                                {currentActivity.timestamps.end && (
                                  <span>{formatTime(currentActivity.timestamps.end - Date.now())}</span>
                                )}
                              </div>
                              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full shadow-glow-xs"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Navigation Controls - aligned with the larger image */}
                      {allActivities.length > 1 && (
                        <div className="flex justify-between mt-3">
                          <button
                            onClick={prevActivity}
                            className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-purple-900/50 transition-colors"
                            aria-label="Previous activity"
                          >
                            <ChevronLeft className="w-4 h-4 text-white" />
                          </button>

                          {/* Activity Indicators */}
                          <div className="flex items-center gap-1">
                            {allActivities.map((_, idx) => (
                              <div
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  idx === currentActivityIndex ? "bg-purple-500" : "bg-gray-600"
                                }`}
                              />
                            ))}
                          </div>

                          <button
                            onClick={nextActivity}
                            className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-purple-900/50 transition-colors"
                            aria-label="Next activity"
                          >
                            <ChevronRight className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-300 text-sm py-2">Not currently active</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-400">
          <p>© 2025 • Made with Next.js</p>
        </div>
      </div>
    </div>
  )
}
