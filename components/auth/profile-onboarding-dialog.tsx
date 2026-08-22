'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Check, Gamepad2, Sparkles, UserCheck, X } from 'lucide-react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { COUNTRY_OPTIONS } from '@/lib/countries'

interface ProfileOnboardingDialogProps {
  forceOpen?: boolean
  onClose?: () => void
}

export function ProfileOnboardingDialog({ forceOpen, onClose }: ProfileOnboardingDialogProps) {
  const profile = useQuery(api.users.getProfile)
  const updateProfile = useMutation(api.users.updateProfile)

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [gamerTag, setGamerTag] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [efootballId, setEfootballId] = useState('')
  const [valorantId, setValorantId] = useState('')
  const [captainName, setCaptainName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Determine if modal should automatically open for users with incomplete profiles
  useEffect(() => {
    if (forceOpen) {
      setOpen(true)
      return
    }
    // If user is authenticated and profile is not yet completed, open dialog automatically
    if (profile !== undefined && profile !== null && !profile.profileCompleted) {
      setOpen(true)
    }
  }, [profile, forceOpen])

  // Sync state with existing profile (preserves whatever is already saved)
  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setGamerTag(profile.gamerTag || profile.name || '')
      setPhone(profile.phone || '')
      setCountryCode(profile.countryCode || '')
      setEfootballId(profile.efootballId || '')
      setValorantId(profile.valorantId || '')
      setCaptainName(profile.captainName || profile.gamerTag || profile.name || '')
    }
  }, [profile])

  if (!open) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const cleanName = name.trim()
      const cleanGamerTag = gamerTag.trim() || cleanName
      const cleanPhone = phone.replace(/[\s().-]/g, '')
      const cleanCountry = countryCode.trim().toUpperCase()

      if (!cleanName) throw new Error('Your full name is required.')
      if (!cleanCountry) throw new Error('Please select your country.')
      if (!/^\+[1-9]\d{7,14}$/.test(cleanPhone)) {
        throw new Error('Enter a valid WhatsApp number with country code, for example +968 9123 4567.')
      }
      const phoneDigits = cleanPhone.slice(1)
      if (/^(\d)\1+$/.test(phoneDigits) || '01234567890123456789'.includes(phoneDigits)) {
        throw new Error('Enter a genuine WhatsApp contact number.')
      }

      await updateProfile({
        name: cleanName,
        gamerTag: cleanGamerTag,
        phone: cleanPhone,
        countryCode: cleanCountry,
        efootballId: efootballId.trim() || undefined,
        valorantId: valorantId.trim() || undefined,
        captainName: captainName.trim() || cleanGamerTag,
      })

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        if (onClose) onClose()
        setSuccess(false)
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    if (onClose) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-3 sm:p-4 backdrop-blur-md">
      <div className="relative my-auto flex max-h-[92dvh] w-full max-w-lg flex-col rounded-2xl sm:rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-2xl overflow-y-auto">
        {/* Close Button (always available if already completed or opened manually) */}
        {(profile?.profileCompleted || forceOpen) && (
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close profile dialog"
            className="absolute right-4 top-4 rounded-full border border-border p-1.5 sm:p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        )}

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-rose-500 shadow-lg shadow-primary/30">
            <Sparkles className="size-6 sm:size-7 text-white" />
          </div>

          <h2 className="mt-3 sm:mt-4 font-display text-xl sm:text-2xl font-bold uppercase text-foreground">
            {profile?.profileCompleted ? 'Player Profile & Game IDs' : 'Complete Your Player Profile'}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
            {profile?.profileCompleted
              ? 'Manage your contact details and optional eFootball & VALORANT IDs.'
              : 'Fill in your details once to unlock instant 1-Click Registration across all D-One Arena tournaments!'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-400">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs sm:text-sm font-semibold text-emerald-400">
              <Check className="size-4 shrink-0" /> Profile saved! 1-Click registration enabled.
            </div>
          )}

          {/* Contact Information Section */}
          <div className="space-y-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Personal & Contact Info</p>

            {/* Display Name */}
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Full Name <span className="text-primary">*</span>
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                required
                className="mt-1.5 h-10 sm:h-11 text-sm"
              />
            </div>

            {/* Gamer Tag / In-Game Name */}
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Gamer Tag / Display Name <span className="text-primary">*</span>
              </Label>
              <Input
                value={gamerTag}
                onChange={(e) => setGamerTag(e.target.value)}
                placeholder="e.g. Striker99 / PhantomAce"
                required
                className="mt-1.5 h-10 sm:h-11 text-sm"
              />
            </div>

            {/* Phone Number */}
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                WhatsApp Number <span className="text-primary">*</span>
              </Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +968 9123 4567"
                autoComplete="tel"
                required
                className="mt-1.5 h-10 sm:h-11 text-sm"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">Required so tournament organizers can contact you for match check-in.</p>
            </div>

            {/* Country Selection */}
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Country <span className="text-primary">*</span>
              </Label>
              <Select value={countryCode} onValueChange={(val) => setCountryCode(val || '')}>
                <SelectTrigger className="mt-1.5 h-10 sm:h-11 text-sm">
                  <SelectValue placeholder="Choose your country..." />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {COUNTRY_OPTIONS.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Game IDs Section (Optional) */}
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <Gamepad2 className="size-4" />
              Game Accounts (Optional)
            </div>
            <p className="text-[11px] text-muted-foreground">
              Add your game IDs here to auto-fill tournament registrations and score verification.
            </p>

            {/* eFootball User ID */}
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                eFootball User ID / Konami Name
              </Label>
              <Input
                value={efootballId}
                onChange={(e) => setEfootballId(e.target.value)}
                placeholder="e.g. 123-456-789 or Konami Username"
                className="mt-1.5 h-10 sm:h-11 text-sm bg-background"
              />
            </div>

            {/* VALORANT Riot ID */}
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                VALORANT Riot ID & Tag
              </Label>
              <Input
                value={valorantId}
                onChange={(e) => setValorantId(e.target.value)}
                placeholder="e.g. Player#EUW or Agent#1234"
                className="mt-1.5 h-10 sm:h-11 text-sm bg-background"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              disabled={saving || success}
              className="w-full gap-2 bg-gradient-to-r from-red-600 to-rose-600 font-bold shadow-lg shadow-red-500/20 h-11 sm:h-12"
            >
              <UserCheck className="size-4" />
              {saving ? 'Saving Profile...' : 'Save Profile & Game IDs'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
