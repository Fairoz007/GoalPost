'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Disc3, Sparkles, Volume2, VolumeX, RotateCw, Trophy, UserCheck } from 'lucide-react'
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
  onSelectSingle?: (participant: WheelParticipant, slot: 1 | 2) => void
  player1?: WheelParticipant | null
  player2?: WheelParticipant | null
  onAssignPlayer1?: (p: WheelParticipant) => void
  onAssignPlayer2?: (p: WheelParticipant) => void
}

const COLORS = [
  '#EF233C', '#2B2D42', '#D90429', '#1E293B',
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#6366F1', '#14B8A6',
]

// Synthesize tick and win audio with Web Audio API safely in browser
function playSound(type: 'tick' | 'win', soundEnabled: boolean) {
  if (!soundEnabled || typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'tick') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.04)
    } else {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1) // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2) // G5
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    }
  } catch {
    // Ignore audio autoplay restrictions
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
  const [spinning, setSpinning] = useState(false)
  const [currentAngle, setCurrentAngle] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [targetSlot, setTargetSlot] = useState<1 | 2>(1)
  const [selectedWinner, setSelectedWinner] = useState<WheelParticipant | null>(null)
  const [recentDraws, setRecentDraws] = useState<Array<{ p1: WheelParticipant; p2: WheelParticipant; timestamp: number }>>([])
  const [excludeAlreadyPicked, setExcludeAlreadyPicked] = useState(true)

  // Filter pool based on options
  const activePool = participants.filter((p) => {
    if (!excludeAlreadyPicked) return true
    if (targetSlot === 2 && player1?._id === p._id) return false
    return true
  })

  const pool = activePool.length > 0 ? activePool : participants

  // Draw the wheel onto canvas
  const drawWheel = useCallback(
    (angle: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const size = canvas.width
      const center = size / 2
      const radius = center - 18
      const numSegments = pool.length

      ctx.clearRect(0, 0, size, size)

      if (numSegments === 0) {
        ctx.fillStyle = '#27272a'
        ctx.beginPath()
        ctx.arc(center, center, radius, 0, 2 * Math.PI)
        ctx.fill()
        ctx.fillStyle = '#71717a'
        ctx.font = '14px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('No participants available', center, center)
        return
      }

      const arcSize = (2 * Math.PI) / numSegments

      // Outer glow and border ring
      ctx.save()
      ctx.beginPath()
      ctx.arc(center, center, radius + 8, 0, 2 * Math.PI)
      ctx.fillStyle = '#09090b'
      ctx.fill()
      ctx.lineWidth = 4
      ctx.strokeStyle = '#EF233C'
      ctx.shadowColor = '#EF233C'
      ctx.shadowBlur = 12
      ctx.stroke()
      ctx.restore()

      // Draw Segments
      for (let i = 0; i < numSegments; i++) {
        const segAngle = angle + i * arcSize
        const color = COLORS[i % COLORS.length]

        ctx.beginPath()
        ctx.moveTo(center, center)
        ctx.arc(center, center, radius, segAngle, segAngle + arcSize)
        ctx.closePath()

        ctx.fillStyle = color
        ctx.fill()
        ctx.lineWidth = 1.5
        ctx.strokeStyle = '#ffffff20'
        ctx.stroke()

        // Text
        ctx.save()
        ctx.translate(center, center)
        ctx.rotate(segAngle + arcSize / 2)
        ctx.textAlign = 'right'
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 12px sans-serif'
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 4

        const name = pool[i].name
        const truncated = name.length > 13 ? name.slice(0, 11) + '…' : name
        ctx.fillText(truncated, radius - 18, 4)
        ctx.restore()
      }

      // Center Hub
      ctx.beginPath()
      ctx.arc(center, center, 32, 0, 2 * Math.PI)
      ctx.fillStyle = '#09090b'
      ctx.fill()
      ctx.lineWidth = 3
      ctx.strokeStyle = '#EF233C'
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('SPIN', center, center + 3)
    },
    [pool],
  )

  useEffect(() => {
    drawWheel(currentAngle)
  }, [drawWheel, currentAngle])

  // Spin animation logic
  const spinWheelTo = useCallback(
    (slotToAssign: 1 | 2) => {
      if (spinning || pool.length < 2) return
      setSpinning(true)
      setSelectedWinner(null)

      const numSegments = pool.length
      const arcSize = (2 * Math.PI) / numSegments

      // Choose random index
      const targetIndex = Math.floor(Math.random() * numSegments)
      const fullRotations = 5 + Math.floor(Math.random() * 4) // 5-8 full spins
      const pointerAngle = 1.5 * Math.PI // Pointer is at top (270 deg / 1.5 PI)
      
      // Calculate target angle so pointer lands on segment
      const targetSegmentCenter = targetIndex * arcSize + arcSize / 2
      const totalDelta = fullRotations * 2 * Math.PI + (pointerAngle - (targetSegmentCenter % (2 * Math.PI)))
      
      const startAngle = currentAngle
      const finalAngle = startAngle + totalDelta
      const duration = 3800 // 3.8 seconds
      const startTime = performance.now()
      let lastTickSegment = -1

      const animate = (now: number) => {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Cubic ease-out
        const easeOut = 1 - Math.pow(1 - progress, 3)
        const newAngle = startAngle + totalDelta * easeOut
        setCurrentAngle(newAngle)

        // Sound tick calculation
        const normalizedAngle = (pointerAngle - (newAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
        const currentSegment = Math.floor(normalizedAngle / arcSize)
        if (currentSegment !== lastTickSegment) {
          playSound('tick', soundEnabled)
          lastTickSegment = currentSegment
        }

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setCurrentAngle(finalAngle)
          const winningParticipant = pool[targetIndex]
          setSelectedWinner(winningParticipant)
          playSound('win', soundEnabled)
          setSpinning(false)

          if (slotToAssign === 1 && onAssignPlayer1) {
            onAssignPlayer1(winningParticipant)
            setTargetSlot(2)
          } else if (slotToAssign === 2 && onAssignPlayer2) {
            onAssignPlayer2(winningParticipant)
            setTargetSlot(1)
          }
        }
      }

      requestAnimationFrame(animate)
    },
    [spinning, pool, currentAngle, soundEnabled, onAssignPlayer1, onAssignPlayer2],
  )

  // Fast Instant Random Pair
  const quickRandomPair = () => {
    if (participants.length < 2) return
    const shuffled = [...participants].sort(() => Math.random() - 0.5)
    const p1 = shuffled[0]
    const p2 = shuffled[1]
    if (onAssignPlayer1) onAssignPlayer1(p1)
    if (onAssignPlayer2) onAssignPlayer2(p2)
    if (onSelectPair) onSelectPair(p1, p2)
    setRecentDraws((prev) => [{ p1, p2, timestamp: Date.now() }, ...prev.slice(0, 4)])
    playSound('win', soundEnabled)
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Left: Spin Wheel Canvas */}
      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm">
        <div className="relative flex items-center justify-center">
          {/* Pointer Marker at the Top */}
          <div className="absolute -top-3 z-20 flex flex-col items-center">
            <div className="size-0 border-x-8 border-t-[16px] border-x-transparent border-t-primary drop-shadow-[0_2px_8px_rgba(239,35,60,0.8)]" />
          </div>

          <canvas
            ref={canvasRef}
            width={340}
            height={340}
            className="rounded-full shadow-2xl transition-transform"
          />
        </div>

        {/* Selected Announcement */}
        {selectedWinner && (
          <div className="mt-4 flex animate-bounce items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
            <Sparkles className="size-4" />
            Selected for {targetSlot === 1 ? 'Slot 2' : 'Slot 1'}: {selectedWinner.name}
          </div>
        )}

        {/* Spin Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={() => spinWheelTo(1)}
            disabled={spinning || pool.length < 2}
            className="gap-2 bg-gradient-to-r from-red-600 to-rose-600 font-bold shadow-lg shadow-red-500/20"
          >
            <RotateCw className={`size-4 ${spinning ? 'animate-spin' : ''}`} />
            Spin for Player 1
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => spinWheelTo(2)}
            disabled={spinning || pool.length < 2}
            className="gap-2 border-primary/40 font-bold hover:bg-primary/10"
          >
            <Disc3 className="size-4 text-primary" />
            Spin for Player 2
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="size-10 rounded-full"
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? <Volume2 className="size-4 text-primary" /> : <VolumeX className="size-4 text-muted-foreground" />}
          </Button>
        </div>
      </div>

      {/* Right: Selected Fixture Matchup Card & Quick Controls */}
      <div className="flex w-full flex-col gap-4 lg:w-80">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Drawn Matchup</p>
            <Badge variant="outline" className="text-[10px]">
              {pool.length} in wheel
            </Badge>
          </div>

          <div className="mt-4 space-y-3">
            {/* Slot 1 */}
            <div className="rounded-xl border border-border bg-background p-3">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Participant 1</span>
              <p className="mt-1 font-semibold text-foreground">
                {player1 ? player1.name : <span className="text-xs text-muted-foreground italic">Spin or select below</span>}
              </p>
            </div>

            <div className="flex items-center justify-center">
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-black text-primary">VS</span>
            </div>

            {/* Slot 2 */}
            <div className="rounded-xl border border-border bg-background p-3">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Participant 2</span>
              <p className="mt-1 font-semibold text-foreground">
                {player2 ? player2.name : <span className="text-xs text-muted-foreground italic">Spin or select below</span>}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <Button
              variant="secondary"
              className="w-full gap-2 font-semibold"
              onClick={quickRandomPair}
              disabled={participants.length < 2}
            >
              <Sparkles className="size-4 text-primary" />
              Quick Random 1v1 Draw
            </Button>

            <label className="flex cursor-pointer items-center gap-2 pt-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={excludeAlreadyPicked}
                onChange={(e) => setExcludeAlreadyPicked(e.target.checked)}
                className="rounded border-border"
              />
              Avoid duplicate player against self
            </label>
          </div>
        </div>

        {/* Recent Draws History */}
        {recentDraws.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4 text-xs">
            <p className="font-bold uppercase tracking-wider text-muted-foreground">Recent Random Draws</p>
            <div className="mt-3 space-y-2">
              {recentDraws.map((d, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-background px-3 py-2">
                  <span className="font-medium text-foreground truncate max-w-[100px]">{d.p1.name}</span>
                  <span className="text-primary font-bold">vs</span>
                  <span className="font-medium text-foreground truncate max-w-[100px]">{d.p2.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
