'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Check, Flame, Shield, Sparkles, User, UserCheck, X } from 'lucide-react'
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
  const [discordTag, setDiscordTag] = useState('')
  const [captainName, setCaptainName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Determine if modal should automatically open for new users
  useEffect(() => {
    if (forceOpen) {
      setOpen(true)
      return
    }
    // If user is authenticated and profile is not completed, prompt onboarding
    if (profile !== undefined && profile !== null && !profile.profileCompleted) {
      setOpen(true)
    }
  }, [profile, forceOpen])

  // Sync state with existing profile
  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setGamerTag(profile.gamerTag || profile.name || '')
      setPhone(profile.phone || '')
      setCountryCode(profile.countryCode || '')
      setDiscordTag(profile.discordTag || '')
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
      const cleanPhone = phone.trim()
      const cleanCountry = countryCode.trim().toUpperCase()

      if (!cleanName) throw new Error('Your full name is required.')
      if (!cleanCountry) throw new Error('Please select your country.')
      if (cleanPhone.replace(/\D/g, '').length < 7) throw new Error('Please enter a valid phone number.')

      await updateProfile({
        name: cleanName,
        gamerTag: cleanGamerTag,
        phone: cleanPhone,
        countryCode: cleanCountry,
        discordTag: discordTag.trim() || undefined,
        captainName: captainName.trim() || cleanGamerTag,
      })

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        if (onClose) onClose()
        setSuccess(false)
      }, 1200)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-8">
        {/* Close Button (if profile already completed) */}
        {profile?.profileCompleted && (
          <button
            onClick={handleClose}
            className="absolute right-5 top-5 rounded-full border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-rose-500 shadow-lg shadow-primary/30">
            <Sparkles className="size-7 text-white" />
          </div>

          <h2 className="mt-4 font-display text-2xl font-bold uppercase text-foreground sm:text-3xl">
            {profile?.profileCompleted ? 'Edit Player Profile' : 'Welcome to EG Tournament'}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete your profile once to unlock instant <strong className="text-primary font-bold">1-Click Registration</strong> across all eFootball & VALORANT tournaments!
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-400">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-400">
              <Check className="size-4" /> Profile saved! 1-Click registration enabled.
            </div>
          )}

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
              className="mt-1.5 h-11"
            />
          </div>

          {/* Gamer Tag / In-Game Name */}
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Gamer Tag / In-Game Name (IGN) <span className="text-primary">*</span>
            </Label>
            <Input
              value={gamerTag}
              onChange={(e) => setGamerTag(e.target.value)}
              placeholder="e.g. Striker99 / PhantomAce#EU"
              required
              className="mt-1.5 h-11"
            />
          </div>

          {/* Phone Number */}
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Contact Phone Number <span className="text-primary">*</span>
            </Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +971 50 123 4567"
              required
              className="mt-1.5 h-11"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">Used strictly by tournament organizers for match check-in coordination.</p>
          </div>

          {/* Country Selection */}
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Country <span className="text-primary">*</span>
            </Label>
            <Select value={countryCode} onValueChange={(val) => setCountryCode(val || '')}>
              <SelectTrigger className="mt-1.5 h-11">
                <SelectValue placeholder="Choose your country..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {COUNTRY_OPTIONS.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Discord Tag */}
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Discord Handle (Optional)
            </Label>
            <Input
              value={discordTag}
              onChange={(e) => setDiscordTag(e.target.value)}
              placeholder="e.g. player#0001"
              className="mt-1.5 h-11"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              disabled={saving || success}
              className="w-full gap-2 bg-gradient-to-r from-red-600 to-rose-600 font-bold shadow-lg shadow-red-500/20"
            >
              <UserCheck className="size-4" />
              {saving ? 'Saving Profile...' : 'Save & Enable 1-Click Entry'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
