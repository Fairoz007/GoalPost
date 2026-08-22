'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Disc3, Sparkles, Volume2, VolumeX, RotateCw, Trophy, Check, ArrowRight, RotateCcw, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface WheelParticipant {
  _id: string
  name: string
  countryCode?: string
  captain?: string
  teamName?: string
}

interface SpinWheelProps {
  participants: WheelParticipant[]
  onSelectPair?: (p1: WheelParticipant, p2: WheelParticipant) => void
  player1?: WheelParticipant | null
  player2?: WheelParticipant | null
  onAssignPlayer1?: (p: WheelParticipant | null) => void
  onAssignPlayer2?: (p: WheelParticipant | null) => void
}

const PALETTE = [
  '#EF233C', '#1E293B', '#D90429', '#0F172A',
  '#2563EB', '#16A34A', '#D97706', '#7C3AED',
  '#DB2777', '#0891B2', '#4F46E5', '#0D9488',
  '#E11D48', '#334155', '#B91C1C', '#1E1B4B',
]

// Synthesize clean mechanical tick & celebratory victory sounds with Web Audio API
function playSound(type: 'tick' | 'win', soundEnabled: boolean) {
  if (!soundEnabled || typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    if (type === 'tick') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(520, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.035)
      gain.gain.setValueAtTime(0.14, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.035)
    } else {
      // 3-chord fanfare
      const freqs = [523.25, 659.25, 783.99, 1046.5]
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const startTime = ctx.currentTime + idx * 0.08
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, startTime)
        gain.gain.setValueAtTime(0.18, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(startTime)
        osc.stop(startTime + 0.5)
      })
    }
  } catch {
    // Ignore autoplay restrictions
  }
}

export function SpinWheel({
  participants,
  onSelectPair,
  player1,
  player2,
  onAssignPlayer1,
  onAssignPlayer2,
}: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)

  const [spinning, setSpinning] = useState(false)
  const [currentAngle, setCurrentAngle] = useState(0)
  const [flapperAngle, setFlapperAngle] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [lastWinner, setLastWinner] = useState<WheelParticipant | null>(null)
  const [removedIds, setRemovedIds] = useState<string[]>([])
  const [recentMatchups, setRecentMatchups] = useState<Array<{ p1: WheelParticipant; p2: WheelParticipant }>>([])
  const [canvasSize, setCanvasSize] = useState(340)

  useEffect(() => {
    const updateSize = () => {
      if (typeof window === 'undefined') return
      const screenW = window.innerWidth
      if (screenW < 380) {
        setCanvasSize(260)
      } else if (screenW < 500) {
        setCanvasSize(300)
      } else {
        setCanvasSize(340)
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Dynamic step: If player1 is not yet chosen, step is 1. If player1 is chosen but player2 is not, step is 2. If both chosen, step is 'done'.
  const currentStep: 'p1' | 'p2' | 'done' = !player1 ? 'p1' : !player2 ? 'p2' : 'done'

  // Available participants pool for the active wheel:
  // 1. If in step 'p1': exclude permanently removed players (from previous matches in session)
  // 2. If in step 'p2': exclude permanently removed players AND player1 (so player1 slice is removed!)
  const activePool = participants.filter((p) => {
    if (removedIds.includes(p._id)) return false
    if (currentStep === 'p2' && player1?._id === p._id) return false
    return true
  })

  // Fallback to all participants if pool runs low
  const pool = activePool.length > 0 ? activePool : participants.filter((p) => !player1 || p._id !== player1._id)

  // Draw wheel on canvas with crisp Retina scaling
  const drawWheel = useCallback(
    (angle: number, flapperDeg: number = 0) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
      const size = canvasSize
      if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
        canvas.width = size * dpr
        canvas.height = size * dpr
        canvas.style.width = `${size}px`
        canvas.style.height = `${size}px`
      }

      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, size, size)

      const center = size / 2
      const radius = center - 24
      const numSegments = pool.length

      if (numSegments === 0) {
        ctx.fillStyle = '#18181b'
        ctx.beginPath()
        ctx.arc(center, center, radius, 0, 2 * Math.PI)
        ctx.fill()
        ctx.fillStyle = '#a1a1aa'
        ctx.font = 'bold 14px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('All participants drawn', center, center)
        ctx.restore()
        return
      }

      const arcSize = (2 * Math.PI) / numSegments

      // Outer glow and rim
      ctx.save()
      ctx.beginPath()
      ctx.arc(center, center, radius + 8, 0, 2 * Math.PI)
      ctx.fillStyle = '#09090b'
      ctx.shadowColor = 'rgba(239, 35, 60, 0.45)'
      ctx.shadowBlur = 18
      ctx.fill()
      ctx.lineWidth = 4
      ctx.strokeStyle = '#EF233C'
      ctx.stroke()
      ctx.restore()

      // Outer golden decorative border dots
      const numPegs = Math.max(numSegments * 2, 16)
      for (let p = 0; p < numPegs; p++) {
        const pegAngle = angle + (p * 2 * Math.PI) / numPegs
        const px = center + (radius + 4) * Math.cos(pegAngle)
        const py = center + (radius + 4) * Math.sin(pegAngle)
        ctx.beginPath()
        ctx.arc(px, py, 2.5, 0, 2 * Math.PI)
        ctx.fillStyle = p % 2 === 0 ? '#FBBF24' : '#FFFFFF'
        ctx.fill()
      }

      // Draw slices
      for (let i = 0; i < numSegments; i++) {
        const segAngle = angle + i * arcSize
        const color = PALETTE[i % PALETTE.length]

        ctx.beginPath()
        ctx.moveTo(center, center)
        ctx.arc(center, center, radius, segAngle, segAngle + arcSize)
        ctx.closePath()

        ctx.fillStyle = color
        ctx.fill()

        // Slice stroke border
        ctx.lineWidth = 2
        ctx.strokeStyle = '#ffffff25'
        ctx.stroke()

        // Participant label
        ctx.save()
        ctx.translate(center, center)
        ctx.rotate(segAngle + arcSize / 2)
        ctx.textAlign = 'right'
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 12px sans-serif'
        ctx.shadowColor = 'rgba(0,0,0,0.9)'
        ctx.shadowBlur = 5

        const rawName = pool[i].name
        const displayName = rawName.length > 14 ? rawName.slice(0, 12) + '…' : rawName
        ctx.fillText(displayName, radius - 16, 4)
        ctx.restore()
      }

      // Center Hub
      ctx.save()
      ctx.beginPath()
      ctx.arc(center, center, 38, 0, 2 * Math.PI)
      ctx.fillStyle = '#09090b'
      ctx.shadowColor = 'rgba(0,0,0,0.8)'
      ctx.shadowBlur = 10
      ctx.fill()
      ctx.lineWidth = 3
      ctx.strokeStyle = '#EF233C'
      ctx.stroke()

      // Center Hub Logo / Text
      ctx.fillStyle = '#EF233C'
      ctx.font = 'black 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(currentStep === 'p1' ? 'P1' : currentStep === 'p2' ? 'P2' : 'READY', center, center - 4)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 9px sans-serif'
      ctx.fillText('D-ONE', center, center + 9)
      ctx.restore()

      // Realistic Pointer at Top with Physical Deflection (flapperDeg)
      ctx.save()
      ctx.translate(center, 14)
      ctx.rotate((flapperDeg * Math.PI) / 180)
      ctx.beginPath()
      ctx.moveTo(-10, -6)
      ctx.lineTo(10, -6)
      ctx.lineTo(0, 20)
      ctx.closePath()
      ctx.fillStyle = '#EF233C'
      ctx.shadowColor = 'rgba(239, 35, 60, 0.9)'
      ctx.shadowBlur = 12
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#FFFFFF'
      ctx.stroke()

      // Pin center of flapper
      ctx.beginPath()
      ctx.arc(0, -2, 3, 0, 2 * Math.PI)
      ctx.fillStyle = '#FFFFFF'
      ctx.fill()
      ctx.restore()

      ctx.restore()
    },
    [pool, currentStep],
  )

  useEffect(() => {
    drawWheel(currentAngle, flapperAngle)
  }, [drawWheel, currentAngle, flapperAngle])

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  // Execute Spin: Handles both Step 1 (Player 1) and Step 2 (Player 2)
  const handleSpin = () => {
    if (spinning || pool.length === 0) return

    // If both players were already selected, start a fresh match draw
    if (currentStep === 'done') {
      if (player1 && player2) {
        setRemovedIds((prev) => [...prev, player1._id, player2._id])
        setRecentMatchups((prev) => [{ p1: player1, p2: player2 }, ...prev.slice(0, 4)])
      }
      if (onAssignPlayer1) onAssignPlayer1(undefined as unknown as WheelParticipant)
      if (onAssignPlayer2) onAssignPlayer2(undefined as unknown as WheelParticipant)
      setLastWinner(null)
      return
    }

    setSpinning(true)
    setLastWinner(null)

    const numSegments = pool.length
    const arcSize = (2 * Math.PI) / numSegments

    // Pick random target index in current pool
    const targetIndex = Math.floor(Math.random() * numSegments)
    const winningParticipant = pool[targetIndex]

    // Pointer is at Top: angle = 1.5 * PI (270 deg)
    const pointerAngle = 1.5 * Math.PI
    const segmentCenterAngle = targetIndex * arcSize + arcSize / 2

    // Calculate required delta so that segmentCenterAngle lands directly at pointerAngle
    const rotations = 6 + Math.floor(Math.random() * 3) // 6 to 8 full spins for excitement
    const normalizedTarget = (pointerAngle - segmentCenterAngle) % (2 * Math.PI)
    const diff = (normalizedTarget - (currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    const totalDelta = rotations * 2 * Math.PI + diff

    const startAngle = currentAngle
    const finalAngle = startAngle + totalDelta
    const duration = 3600 // 3.6 seconds smooth deceleration
    const startTime = performance.now()
    let lastPegIndex = -1

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Quintic ease-out for realistic wheel deceleration
      const easeOut = 1 - Math.pow(1 - progress, 4)
      const newAngle = startAngle + totalDelta * easeOut
      setCurrentAngle(newAngle)

      // Flapper deflection & Audio Ticks
      const currentSegment = Math.floor(((pointerAngle - (newAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / arcSize)
      if (currentSegment !== lastPegIndex) {
        playSound('tick', soundEnabled)
        lastPegIndex = currentSegment
        setFlapperAngle(16 * (1 - progress * 0.8)) // Deflect pointer
        setTimeout(() => setFlapperAngle(0), 40)
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        setCurrentAngle(finalAngle)
        setFlapperAngle(0)
        setSpinning(false)
        setLastWinner(winningParticipant)
        playSound('win', soundEnabled)

        if (currentStep === 'p1') {
          // Assign Player 1 and automatically prepare for Player 2
          if (onAssignPlayer1) onAssignPlayer1(winningParticipant)
        } else if (currentStep === 'p2') {
          // Assign Player 2
          if (onAssignPlayer2) onAssignPlayer2(winningParticipant)
          if (player1 && onSelectPair) {
            onSelectPair(player1, winningParticipant)
          }
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(animate)
  }

  // Reset entire wheel pool and match selection
  const handleResetAll = () => {
    if (spinning) return
    setRemovedIds([])
    setLastWinner(null)
    if (onAssignPlayer1) onAssignPlayer1(undefined as unknown as WheelParticipant)
    if (onAssignPlayer2) onAssignPlayer2(undefined as unknown as WheelParticipant)
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Left: Spin Wheel Canvas & Unified Spin Button */}
      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm">
        {/* Step Indicator Banner */}
        <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          {currentStep === 'p1' && (
            <span className="flex items-center gap-1.5 text-primary">
              <span className="flex size-2 rounded-full bg-primary animate-ping" />
              Step 1: Spin to Draw Player 1 (Home)
            </span>
          )}
          {currentStep === 'p2' && (
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="flex size-2 rounded-full bg-amber-400 animate-ping" />
              Step 2: Spin to Draw Player 2 (Away)
            </span>
          )}
          {currentStep === 'done' && (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Check className="size-3.5" />
              Matchup Ready! Both Players Drawn
            </span>
          )}
        </div>

        {/* Wheel Canvas Container */}
        <div className="relative flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="rounded-full select-none cursor-pointer drop-shadow-[0_10px_35px_rgba(0,0,0,0.6)]"
            onClick={!spinning ? handleSpin : undefined}
          />
        </div>

        {/* Celebration Winner Banner */}
        {lastWinner && (
          <div className="mt-4 flex animate-in fade-in zoom-in-90 duration-300 items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-5 py-2.5 text-sm font-bold text-primary shadow-lg shadow-primary/10">
            <Sparkles className="size-4" />
            Selected: <span className="text-foreground">{lastWinner.name}</span>
            {lastWinner.countryCode ? ` (${lastWinner.countryCode})` : ''}
          </div>
        )}

        {/* Unified Single Action Spin Button */}
        <div className="mt-6 flex w-full max-w-sm flex-col items-center gap-3">
          <Button
            size="lg"
            onClick={handleSpin}
            disabled={spinning || (pool.length < 1 && currentStep !== 'done')}
            className={`w-full gap-2 text-base font-extrabold shadow-xl transition-all ${
              currentStep === 'done'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/20'
                : currentStep === 'p2'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-amber-500/20'
                : 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-red-500/25'
            }`}
          >
            {spinning ? (
              <>
                <RotateCw className="size-5 animate-spin" />
                Drawing Winner...
              </>
            ) : currentStep === 'p1' ? (
              <>
                <Disc3 className="size-5" />
                🎰 SPIN FOR PLAYER 1
              </>
            ) : currentStep === 'p2' ? (
              <>
                <Disc3 className="size-5" />
                🎰 SPIN FOR PLAYER 2
              </>
            ) : (
              <>
                <RotateCcw className="size-5" />
                🔄 DRAW NEXT MATCHUP
              </>
            )}
          </Button>

          {/* Secondary Controls: Sound & Pool Reset */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              {soundEnabled ? <Volume2 className="size-3.5 text-primary" /> : <VolumeX className="size-3.5" />}
              {soundEnabled ? 'Sound On' : 'Sound Muted'}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={handleResetAll}
              disabled={spinning}
              className="hover:text-foreground transition-colors"
            >
              Reset Drawn Pool
            </button>
          </div>
        </div>
      </div>

      {/* Right: Real-Time Matchup Card */}
      <div className="flex w-full flex-col gap-4 lg:w-80">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Live Draw Matchup</p>
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
              {pool.length} in wheel
            </Badge>
          </div>

          <div className="mt-4 space-y-3">
            {/* Slot 1: Home Player */}
            <div className={`rounded-xl border p-3.5 transition-all ${
              player1 ? 'border-primary/50 bg-primary/10' : 'border-border bg-background'
            }`}>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                <span className="text-muted-foreground">Participant 1 (Home)</span>
                {player1 && <span className="text-primary flex items-center gap-1"><Check className="size-3" /> Selected</span>}
              </div>
              <p className="mt-1.5 text-base font-bold text-foreground">
                {player1 ? player1.name : <span className="text-xs text-muted-foreground font-normal italic">Waiting for Spin 1...</span>}
              </p>
              {player1?.teamName && <p className="text-[11px] text-muted-foreground">{player1.teamName}</p>}
            </div>

            {/* VS Badge */}
            <div className="flex items-center justify-center">
              <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-black tracking-wider text-primary">
                VS
              </span>
            </div>

            {/* Slot 2: Away Player */}
            <div className={`rounded-xl border p-3.5 transition-all ${
              player2 ? 'border-primary/50 bg-primary/10' : 'border-border bg-background'
            }`}>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                <span className="text-muted-foreground">Participant 2 (Away)</span>
                {player2 && <span className="text-primary flex items-center gap-1"><Check className="size-3" /> Selected</span>}
              </div>
              <p className="mt-1.5 text-base font-bold text-foreground">
                {player2 ? player2.name : <span className="text-xs text-muted-foreground font-normal italic">Waiting for Spin 2...</span>}
              </p>
              {player2?.teamName && <p className="text-[11px] text-muted-foreground">{player2.teamName}</p>}
            </div>
          </div>

          {currentStep === 'done' && (
            <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-xs font-semibold text-emerald-400">
              <Check className="mx-auto mb-1 size-4" />
              Matchup complete! You can now configure match details below and click &quot;Create Fixture&quot;.
            </div>
          )}
        </div>

        {/* Session Matchup Draw History */}
        {recentMatchups.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4 text-xs shadow-md">
            <p className="font-bold uppercase tracking-wider text-muted-foreground">Completed Draws</p>
            <div className="mt-3 space-y-2">
              {recentMatchups.map((d, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-background px-3 py-2 border border-border">
                  <span className="font-medium text-foreground truncate max-w-[95px]">{d.p1.name}</span>
                  <span className="text-primary font-bold text-[10px]">VS</span>
                  <span className="font-medium text-foreground truncate max-w-[95px]">{d.p2.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
