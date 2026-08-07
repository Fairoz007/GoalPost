'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { players, teamById, type Position } from '@/lib/mock-data'

const posOptions: (Position | 'ALL')[] = ['ALL', 'GK', 'DF', 'MF', 'FW']

export function PlayersView() {
  const [q, setQ] = useState('')
  const [pos, setPos] = useState<Position | 'ALL'>('ALL')

  const rows = useMemo(() => {
    return players
      .filter((p) => (pos === 'ALL' ? true : p.position === pos))
      .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 60)
  }, [q, pos])

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search players..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={pos} onValueChange={(v) => setPos(v as Position | 'ALL')}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Position" />
          </SelectTrigger>
          <SelectContent>
            {posOptions.map((p) => (
              <SelectItem key={p} value={p}>
                {p === 'ALL' ? 'All positions' : p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground sm:ml-auto">{rows.length} players</span>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Pos</TableHead>
              <TableHead className="text-right">G</TableHead>
              <TableHead className="text-right">A</TableHead>
              <TableHead className="text-right">Apps</TableHead>
              <TableHead className="text-right">Rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => {
              const team = teamById(p.teamId)
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/players/${p.id}`} className="font-medium hover:text-primary">
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{team.short}</TableCell>
                  <TableCell><Badge variant="secondary">{p.position}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums">{p.goals}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.assists}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.appearances}</TableCell>
                  <TableCell className="text-right font-display tabular-nums text-primary">{p.rating}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
