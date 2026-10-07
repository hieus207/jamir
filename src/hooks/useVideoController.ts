import { useCallback, useEffect, useRef, useState } from 'react'

export interface VideoState {
  playing: boolean
  currentTime: number
  duration: number
  buffered: number
  muted: boolean
  rate: number
  waiting: boolean
  ended: boolean
  error: boolean
}

/**
 * Thin controller around an HTMLVideoElement so the player chrome and the
 * chapter list (separate components) can share one source of truth.
 */
export function useVideoController(initialDuration = 0) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<VideoState>({
    playing: false,
    currentTime: 0,
    duration: initialDuration,
    buffered: 0,
    muted: true,
    rate: 1,
    waiting: false,
    ended: false,
    error: false,
  })

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const patch = (p: Partial<VideoState>) => setState((s) => ({ ...s, ...p }))
    const onTime = () => patch({ currentTime: v.currentTime })
    const onProgress = () => {
      const b = v.buffered
      patch({ buffered: b.length ? b.end(b.length - 1) : 0 })
    }
    const handlers: [keyof HTMLVideoElementEventMap, () => void][] = [
      ['play', () => patch({ playing: true, ended: false })],
      ['pause', () => patch({ playing: false })],
      ['timeupdate', onTime],
      ['seeking', onTime],
      ['progress', onProgress],
      ['loadedmetadata', () => patch({ duration: v.duration || initialDuration, error: false })],
      ['durationchange', () => patch({ duration: v.duration || initialDuration })],
      ['volumechange', () => patch({ muted: v.muted })],
      ['ratechange', () => patch({ rate: v.playbackRate })],
      ['waiting', () => patch({ waiting: true })],
      ['playing', () => patch({ waiting: false })],
      ['canplay', () => patch({ waiting: false })],
      ['ended', () => patch({ ended: true, playing: false })],
      ['error', () => patch({ error: true, waiting: false })],
    ]
    handlers.forEach(([e, h]) => v.addEventListener(e, h))
    return () => handlers.forEach(([e, h]) => v.removeEventListener(e, h))
  }, [initialDuration])

  const play = useCallback(() => {
    videoRef.current?.play().catch(() => {
      /* autoplay can be blocked — the big play button stays visible */
    })
  }, [])
  const pause = useCallback(() => videoRef.current?.pause(), [])
  const toggle = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) play()
    else v.pause()
  }, [play])
  const seek = useCallback((time: number, autoplay = false) => {
    const v = videoRef.current
    if (!v) return
    const d = v.duration || initialDuration
    v.currentTime = Math.min(Math.max(0, time), Math.max(0, d - 0.05))
    setState((s) => ({ ...s, currentTime: v.currentTime, ended: false }))
    if (autoplay && v.paused) play()
  }, [initialDuration, play])
  const seekBy = useCallback((delta: number) => seek((videoRef.current?.currentTime ?? 0) + delta), [seek])
  const setMuted = useCallback((muted: boolean) => {
    if (videoRef.current) videoRef.current.muted = muted
  }, [])
  const setRate = useCallback((rate: number) => {
    if (videoRef.current) videoRef.current.playbackRate = rate
  }, [])
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    const v = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null
    if (document.fullscreenElement) document.exitFullscreen()
    else if (el?.requestFullscreen) el.requestFullscreen()
    else v?.webkitEnterFullscreen?.() // iOS Safari
  }, [])
  const togglePip = useCallback(async () => {
    const v = videoRef.current
    if (!v || !document.pictureInPictureEnabled) return
    if (document.pictureInPictureElement) await document.exitPictureInPicture()
    else await v.requestPictureInPicture().catch(() => {})
  }, [])

  return {
    videoRef,
    containerRef,
    state,
    play,
    pause,
    toggle,
    seek,
    seekBy,
    setMuted,
    setRate,
    toggleFullscreen,
    togglePip,
  }
}

export type VideoController = ReturnType<typeof useVideoController>
