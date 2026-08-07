'use client'

import Link from 'next/link'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { topScorers, topAssists, fairPlay, teamById } from '@/lib/mock-data'

function LeaderTable({
  rows,
  metric,
  label,
}: {
  rows: { id: string; name: string; teamId: string; value: number }[]
  metric: string
  label: string
}) {
  const max = Math.max(...rows.map((r) => r.value), 1)
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Player</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-right">{metric}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={r.id}>
                <TableCell className="font-display tabular-nums text-muted-foreground">{i + 1}</TableCell>
                <TableCell>
                  <Link href={`/players/${r.id}`} className="font-medium hover:text-primary">{r.name}</Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{teamById(r.teamId).short}</TableCell>
                <TableCell className="text-right font-display tabular-nums text-primary">{r.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Card className="p-5">
        <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={rows.slice(0, 8)} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid horizontal={false} stroke="var(--border)" />
            <XAxis type="number" domain={[0, max]} stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickFormatter={(v: string) => v.split(' ')[1] ?? v}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {rows.slice(0, 8).map((r) => (
                <Cell key={r.id} fill={teamById(r.teamId).color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}

export function StatsView() {
  const scorers = topScorers(10).map((p) => ({ id: p.id, name: p.name, teamId: p.teamId, value: p.goals }))
  const assists = topAssists(10).map((p) => ({ id: p.id, name: p.name, teamId: p.teamId, value: p.assists }))
  const fair = fairPlay()

  return (
    <Tabs defaultValue="scorers">
      <TabsList>
        <TabsTrigger value="scorers">Top Scorers</TabsTrigger>
        <TabsTrigger value="assists">Top Assists</TabsTrigger>
        <TabsTrigger value="fairplay">Fair Play</TabsTrigger>
      </TabsList>

      <TabsContent value="scorers" className="mt-6">
        <LeaderTable rows={scorers} metric="Goals" label="Goals scored" />
      </TabsContent>

      <TabsContent value="assists" className="mt-6">
        <LeaderTable rows={assists} metric="Assists" label="Assists provided" />
      </TabsContent>

      <TabsContent value="fairplay" className="mt-6">
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Yellow</TableHead>
                <TableHead className="text-right">Red</TableHead>
                <TableHead className="text-right">Fair Play Pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fair.map((t, i) => (
                <TableRow key={t.id}>
                  <TableCell className="font-display tabular-nums text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    <Link href={`/teams/${t.id}`} className="font-medium hover:text-primary">{t.name}</Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="tabular-nums">{t.yellow}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{t.red}</TableCell>
                  <TableCell className="text-right font-display tabular-nums text-primary">{t.pts}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
