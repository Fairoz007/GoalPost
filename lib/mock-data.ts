// Central mock data layer for the GoalPost tournament platform.
// Everything here is deterministic seed data so the UI feels alive without a backend.

export type MatchStatus = 'live' | 'upcoming' | 'finished' | 'ht'
export type TournamentFormat =
  | 'League'
  | 'Round Robin'
  | 'Single Elimination'
  | 'Double Elimination'
  | 'Group Stage + Knockout'
  | 'Swiss System'
export type TournamentStatus = 'ongoing' | 'upcoming' | 'completed'
export type Position = 'GK' | 'DF' | 'MF' | 'FW'

export interface Team {
  id: string
  name: string
  short: string
  color: string
  city: string
  stadium: string
  founded: number
  coach: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
}

export interface Player {
  id: string
  name: string
  teamId: string
  position: Position
  number: number
  age: number
  nationality: string
  height: number
  weight: number
  goals: number
  assists: number
  yellow: number
  red: number
  appearances: number
  rating: number
  mvp: number
}

export interface MatchEvent {
  minute: number
  type: 'goal' | 'yellow' | 'red' | 'sub' | 'penalty' | 'injury'
  teamId: string
  player: string
  detail?: string
}

export interface Match {
  id: string
  tournamentId: string
  homeId: string
  awayId: string
  homeScore: number
  awayScore: number
  status: MatchStatus
  minute?: number
  date: string
  time: string
  venue: string
  round: string
  group?: string
  referee: string
  events: MatchEvent[]
  possession?: [number, number]
  shots?: [number, number]
  corners?: [number, number]
}

export interface Tournament {
  id: string
  name: string
  format: TournamentFormat
  status: TournamentStatus
  location: string
  startDate: string
  endDate: string
  teams: number
  matches: number
  ageCategory: string
  gender: string
  logo: string
}

export interface NewsItem {
  id: string
  title: string
  excerpt: string
  category: string
  date: string
  author: string
  image: string
}

export interface Sponsor {
  id: string
  name: string
  tier: 'Platinum' | 'Gold' | 'Silver'
}

export const teams: Team[] = [
  { id: 't1', name: 'Northgate United', short: 'NGU', color: '#00c853', city: 'Northgate', stadium: 'Emerald Arena', founded: 1998, coach: 'Diego Marchetti', played: 12, won: 9, drawn: 2, lost: 1, gf: 28, ga: 9 },
  { id: 't2', name: 'Riverside FC', short: 'RIV', color: '#38bdf8', city: 'Riverside', stadium: 'Delta Park', founded: 2001, coach: 'Owen Blackwood', played: 12, won: 8, drawn: 3, lost: 1, gf: 24, ga: 11 },
  { id: 't3', name: 'Ironvale Athletic', short: 'IRA', color: '#facc15', city: 'Ironvale', stadium: 'Forge Stadium', founded: 1985, coach: 'Marcus Hale', played: 12, won: 7, drawn: 2, lost: 3, gf: 22, ga: 14 },
  { id: 't4', name: 'Crestwood City', short: 'CRW', color: '#a78bfa', city: 'Crestwood', stadium: 'Summit Field', founded: 2010, coach: 'Ana Verlaine', played: 12, won: 6, drawn: 4, lost: 2, gf: 19, ga: 12 },
  { id: 't5', name: 'Baytown Rovers', short: 'BAY', color: '#fb7185', city: 'Baytown', stadium: 'Harbour Ground', founded: 1992, coach: 'Kenji Nakamura', played: 12, won: 6, drawn: 2, lost: 4, gf: 20, ga: 16 },
  { id: 't6', name: 'Highland Wanderers', short: 'HLW', color: '#34d399', city: 'Highland', stadium: 'Glenfield', founded: 1978, coach: 'Sofia Almeida', played: 12, won: 5, drawn: 3, lost: 4, gf: 17, ga: 15 },
  { id: 't7', name: 'Meadowbrook SC', short: 'MDB', color: '#f97316', city: 'Meadowbrook', stadium: 'Willow Park', founded: 2005, coach: 'Tomas Ruiz', played: 12, won: 4, drawn: 3, lost: 5, gf: 15, ga: 18 },
  { id: 't8', name: 'Stonebridge FC', short: 'STB', color: '#60a5fa', city: 'Stonebridge', stadium: 'Castle Ground', founded: 1969, coach: 'Liam Foster', played: 12, won: 4, drawn: 2, lost: 6, gf: 14, ga: 20 },
  { id: 't9', name: 'Ashford Town', short: 'ASH', color: '#e879f9', city: 'Ashford', stadium: 'Oak Lane', founded: 2012, coach: 'Priya Nair', played: 12, won: 3, drawn: 3, lost: 6, gf: 12, ga: 21 },
  { id: 't10', name: 'Westport Dynamo', short: 'WPD', color: '#22d3ee', city: 'Westport', stadium: 'Pier Stadium', founded: 1999, coach: 'Erik Solberg', played: 12, won: 2, drawn: 3, lost: 7, gf: 11, ga: 24 },
  { id: 't11', name: 'Greenfield Rangers', short: 'GFR', color: '#4ade80', city: 'Greenfield', stadium: 'Clover Field', founded: 1988, coach: 'Hassan Ali', played: 12, won: 2, drawn: 2, lost: 8, gf: 10, ga: 26 },
  { id: 't12', name: 'Lakeview FC', short: 'LKV', color: '#c084fc', city: 'Lakeview', stadium: 'Shoreline', founded: 2003, coach: 'Nora Bennett', played: 12, won: 1, drawn: 2, lost: 9, gf: 8, ga: 28 },
]

const firstNames = ['James', 'Lucas', 'Mateo', 'Kai', 'Ethan', 'Noah', 'Leo', 'Aaron', 'Diego', 'Omar', 'Yuki', 'Andre', 'Felix', 'Ivan', 'Marco']
const lastNames = ['Carter', 'Silva', 'Nguyen', 'Okafor', 'Petrov', 'Larsson', 'Costa', 'Haas', 'Mensah', 'Rossi', 'Tanaka', 'Novak', 'Diaz', 'Bauer', 'Khan']
const nations = ['England', 'Brazil', 'Spain', 'France', 'Germany', 'Japan', 'Ghana', 'Argentina', 'Italy', 'Portugal']
const positions: Position[] = ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW']

function seeded(n: number) {
  const x = Math.sin(n) * 10000
  return x - Math.floor(x)
}

export const players: Player[] = teams.flatMap((team, ti) =>
  Array.from({ length: 11 }).map((_, pi) => {
    const seed = ti * 11 + pi
    const pos = positions[pi]
    const goals = pos === 'FW' ? Math.floor(seeded(seed) * 12) : pos === 'MF' ? Math.floor(seeded(seed) * 6) : Math.floor(seeded(seed) * 2)
    return {
      id: `p${seed}`,
      name: `${firstNames[(seed) % firstNames.length]} ${lastNames[(seed * 3) % lastNames.length]}`,
      teamId: team.id,
      position: pos,
      number: pi + 1,
      age: 19 + Math.floor(seeded(seed + 1) * 15),
      nationality: nations[(seed) % nations.length],
      height: 168 + Math.floor(seeded(seed + 2) * 22),
      weight: 62 + Math.floor(seeded(seed + 3) * 25),
      goals,
      assists: Math.floor(seeded(seed + 4) * 9),
      yellow: Math.floor(seeded(seed + 5) * 5),
      red: seeded(seed + 6) > 0.9 ? 1 : 0,
      appearances: 8 + Math.floor(seeded(seed + 7) * 5),
      rating: Number((6.4 + seeded(seed + 8) * 3).toFixed(1)),
      mvp: pos === 'FW' && seeded(seed + 9) > 0.5 ? Math.floor(seeded(seed + 9) * 4) : 0,
    }
  }),
)

export const tournaments: Tournament[] = [
  { id: 'tr1', name: 'Premier Champions League', format: 'League', status: 'ongoing', location: 'National', startDate: '2026-06-01', endDate: '2026-09-15', teams: 12, matches: 132, ageCategory: 'Senior', gender: 'Men', logo: 'PCL' },
  { id: 'tr2', name: 'City Knockout Cup', format: 'Single Elimination', status: 'ongoing', location: 'Metro City', startDate: '2026-07-10', endDate: '2026-08-02', teams: 8, matches: 7, ageCategory: 'Senior', gender: 'Men', logo: 'CKC' },
  { id: 'tr3', name: 'University Championship', format: 'Group Stage + Knockout', status: 'upcoming', location: 'State University', startDate: '2026-09-20', endDate: '2026-11-01', teams: 16, matches: 32, ageCategory: 'U-23', gender: 'Mixed', logo: 'UC' },
  { id: 'tr4', name: 'Youth Development Series', format: 'Round Robin', status: 'upcoming', location: 'Regional', startDate: '2026-10-05', endDate: '2026-12-10', teams: 10, matches: 90, ageCategory: 'U-17', gender: 'Men', logo: 'YDS' },
  { id: 'tr5', name: 'Spring Community Shield', format: 'Swiss System', status: 'completed', location: 'Community', startDate: '2026-03-01', endDate: '2026-04-15', teams: 14, matches: 35, ageCategory: 'Amateur', gender: 'Mixed', logo: 'SCS' },
]

export const venues = ['Emerald Arena', 'Delta Park', 'Forge Stadium', 'Summit Field', 'Harbour Ground', 'Glenfield']
export const referees = ['Michael Osei', 'Clara Jensen', 'Rafael Mendez', 'Ingrid Holt', 'Sam Whitfield']

export const matches: Match[] = [
  {
    id: 'm1', tournamentId: 'tr1', homeId: 't1', awayId: 't3', homeScore: 2, awayScore: 1, status: 'live', minute: 67,
    date: '2026-08-05', time: '19:45', venue: 'Emerald Arena', round: 'Matchday 13', referee: 'Michael Osei',
    possession: [58, 42], shots: [12, 7], corners: [6, 3],
    events: [
      { minute: 12, type: 'goal', teamId: 't1', player: 'James Carter', detail: 'Right foot finish' },
      { minute: 34, type: 'yellow', teamId: 't3', player: 'Marco Rossi' },
      { minute: 41, type: 'goal', teamId: 't3', player: 'Leo Costa', detail: 'Header' },
      { minute: 58, type: 'goal', teamId: 't1', player: 'Kai Nguyen', detail: 'Penalty' },
      { minute: 63, type: 'sub', teamId: 't1', player: 'Aaron Mensah', detail: 'on for Noah Silva' },
    ],
  },
  {
    id: 'm2', tournamentId: 'tr1', homeId: 't2', awayId: 't5', homeScore: 1, awayScore: 1, status: 'live', minute: 52,
    date: '2026-08-05', time: '19:45', venue: 'Delta Park', round: 'Matchday 13', referee: 'Clara Jensen',
    possession: [49, 51], shots: [8, 9], corners: [4, 5],
    events: [
      { minute: 22, type: 'goal', teamId: 't5', player: 'Diego Diaz' },
      { minute: 45, type: 'goal', teamId: 't2', player: 'Ethan Petrov', detail: 'Volley' },
    ],
  },
  {
    id: 'm3', tournamentId: 'tr1', homeId: 't4', awayId: 't6', homeScore: 0, awayScore: 0, status: 'upcoming',
    date: '2026-08-06', time: '18:00', venue: 'Summit Field', round: 'Matchday 13', referee: 'Rafael Mendez', events: [],
  },
  {
    id: 'm4', tournamentId: 'tr1', homeId: 't7', awayId: 't8', homeScore: 0, awayScore: 0, status: 'upcoming',
    date: '2026-08-06', time: '20:15', venue: 'Willow Park', round: 'Matchday 13', referee: 'Ingrid Holt', events: [],
  },
  {
    id: 'm5', tournamentId: 'tr1', homeId: 't9', awayId: 't10', homeScore: 0, awayScore: 0, status: 'upcoming',
    date: '2026-08-07', time: '19:00', venue: 'Oak Lane', round: 'Matchday 13', referee: 'Sam Whitfield', events: [],
  },
  {
    id: 'm6', tournamentId: 'tr1', homeId: 't2', awayId: 't1', homeScore: 1, awayScore: 3, status: 'finished',
    date: '2026-08-01', time: '19:45', venue: 'Delta Park', round: 'Matchday 12', referee: 'Michael Osei',
    possession: [52, 48], shots: [10, 14], corners: [5, 7],
    events: [
      { minute: 9, type: 'goal', teamId: 't1', player: 'James Carter' },
      { minute: 25, type: 'goal', teamId: 't2', player: 'Ethan Petrov' },
      { minute: 51, type: 'goal', teamId: 't1', player: 'Kai Nguyen' },
      { minute: 78, type: 'goal', teamId: 't1', player: 'Aaron Mensah' },
    ],
  },
  {
    id: 'm7', tournamentId: 'tr1', homeId: 't3', awayId: 't4', homeScore: 2, awayScore: 2, status: 'finished',
    date: '2026-08-01', time: '18:00', venue: 'Forge Stadium', round: 'Matchday 12', referee: 'Clara Jensen',
    possession: [46, 54], shots: [11, 12], corners: [4, 6], events: [],
  },
  {
    id: 'm8', tournamentId: 'tr1', homeId: 't5', awayId: 't6', homeScore: 0, awayScore: 1, status: 'finished',
    date: '2026-07-31', time: '20:00', venue: 'Harbour Ground', round: 'Matchday 12', referee: 'Rafael Mendez',
    possession: [55, 45], shots: [9, 6], corners: [7, 2], events: [],
  },
]

export const news: NewsItem[] = [
  { id: 'n1', title: 'Northgate United extend lead at the top with derby win', excerpt: 'A clinical second-half display saw the Emerald men take all three points in a heated cross-city clash.', category: 'Match Report', date: '2026-08-02', author: 'Editorial Desk', image: '/news-derby.png' },
  { id: 'n2', title: 'City Knockout Cup quarter-final draw revealed', excerpt: 'Eight teams learn their fate as the knockout stage bracket takes shape for the summer showpiece.', category: 'Tournament', date: '2026-08-01', author: 'Competitions Team', image: '/news-draw.png' },
  { id: 'n3', title: 'Rising star Kai Nguyen named Player of the Month', excerpt: 'Seven goals in five games earns the young forward the league\u2019s top individual honour.', category: 'Awards', date: '2026-07-30', author: 'Editorial Desk', image: '/news-player.png' },
  { id: 'n4', title: 'University Championship opens registration for 16 sides', excerpt: 'Campuses across the state prepare for the autumn group stage kicking off in September.', category: 'Announcement', date: '2026-07-28', author: 'Operations', image: '/news-university.png' },
]

export const sponsors: Sponsor[] = [
  { id: 's1', name: 'Vantage Sports', tier: 'Platinum' },
  { id: 's2', name: 'Aeris Airlines', tier: 'Platinum' },
  { id: 's3', name: 'NovaBank', tier: 'Gold' },
  { id: 's4', name: 'PulseFit', tier: 'Gold' },
  { id: 's5', name: 'GridIron Energy', tier: 'Silver' },
  { id: 's6', name: 'Metro Telecom', tier: 'Silver' },
]

// ---------- Derived helpers ----------

export function teamById(id: string) {
  return teams.find((t) => t.id === id)!
}

export function playerById(id: string) {
  return players.find((p) => p.id === id)!
}

export function tournamentById(id: string) {
  return tournaments.find((t) => t.id === id)!
}

export function matchById(id: string) {
  return matches.find((m) => m.id === id)!
}

export function playersByTeam(teamId: string) {
  return players.filter((p) => p.teamId === teamId)
}

export interface StandingRow extends Team {
  points: number
  gd: number
  form: ('W' | 'D' | 'L')[]
  rank: number
}

export function standings(): StandingRow[] {
  const forms: Record<string, ('W' | 'D' | 'L')[]> = {}
  return teams
    .map((t) => ({
      ...t,
      points: t.won * 3 + t.drawn,
      gd: t.gf - t.ga,
      form: (forms[t.id] ??= (['W', 'W', 'D', 'L', 'W'] as const).slice(0, 5).map((_, i) => (['W', 'D', 'L'] as const)[Math.floor(seeded(t.founded + i) * 3)])),
      rank: 0,
    }))
    .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf)
    .map((t, i) => ({ ...t, rank: i + 1 }))
}

export function topScorers(limit = 10) {
  return [...players].sort((a, b) => b.goals - a.goals || b.assists - a.assists).slice(0, limit)
}

export function topAssists(limit = 10) {
  return [...players].sort((a, b) => b.assists - a.assists).slice(0, limit)
}

export function fairPlay() {
  return [...teams]
    .map((t) => {
      const tp = playersByTeam(t.id)
      const yellow = tp.reduce((s, p) => s + p.yellow, 0)
      const red = tp.reduce((s, p) => s + p.red, 0)
      return { ...t, yellow, red, pts: yellow + red * 3 }
    })
    .sort((a, b) => a.pts - b.pts)
}

export function liveMatches() {
  return matches.filter((m) => m.status === 'live' || m.status === 'ht')
}

export function upcomingMatches() {
  return matches.filter((m) => m.status === 'upcoming')
}

export function finishedMatches() {
  return matches.filter((m) => m.status === 'finished')
}

// Knockout bracket for the City Knockout Cup (single elimination, 8 teams)
export interface BracketMatch {
  id: string
  home?: { teamId: string; score?: number }
  away?: { teamId: string; score?: number }
  winner?: string
}
export interface BracketRound {
  name: string
  matches: BracketMatch[]
}

export const bracket: BracketRound[] = [
  {
    name: 'Quarter-finals',
    matches: [
      { id: 'qf1', home: { teamId: 't1', score: 3 }, away: { teamId: 't8', score: 0 }, winner: 't1' },
      { id: 'qf2', home: { teamId: 't4', score: 1 }, away: { teamId: 't5', score: 2 }, winner: 't5' },
      { id: 'qf3', home: { teamId: 't2', score: 2 }, away: { teamId: 't7', score: 1 }, winner: 't2' },
      { id: 'qf4', home: { teamId: 't3', score: 4 }, away: { teamId: 't6', score: 2 }, winner: 't3' },
    ],
  },
  {
    name: 'Semi-finals',
    matches: [
      { id: 'sf1', home: { teamId: 't1', score: 2 }, away: { teamId: 't5', score: 1 }, winner: 't1' },
      { id: 'sf2', home: { teamId: 't2', score: 1 }, away: { teamId: 't3', score: 1 }, winner: 't2' },
    ],
  },
  {
    name: 'Final',
    matches: [{ id: 'f1', home: { teamId: 't1' }, away: { teamId: 't2' } }],
  },
]

export const activities = [
  { id: 'a1', text: 'Full-time: Riverside FC 1 - 3 Northgate United', time: '2h ago', type: 'result' },
  { id: 'a2', text: 'Fixtures published for Matchday 13', time: '5h ago', type: 'fixture' },
  { id: 'a3', text: 'Crestwood City registration approved', time: '1d ago', type: 'registration' },
  { id: 'a4', text: 'Kai Nguyen scored a hat-trick vs Baytown Rovers', time: '2d ago', type: 'goal' },
  { id: 'a5', text: 'New tournament "University Championship" created', time: '3d ago', type: 'tournament' },
]

export const roles = ['Super Admin', 'Tournament Organizer', 'Referee', 'Team Manager', 'Coach', 'Player']

export const adminUsers = [
  { id: 'u1', name: 'Alex Morgan', email: 'alex@goalpost.io', role: 'Super Admin', status: 'active' },
  { id: 'u2', name: 'Diego Marchetti', email: 'diego@northgate.fc', role: 'Coach', status: 'active' },
  { id: 'u3', name: 'Clara Jensen', email: 'clara@refs.org', role: 'Referee', status: 'active' },
  { id: 'u4', name: 'Priya Nair', email: 'priya@ashford.fc', role: 'Team Manager', status: 'pending' },
  { id: 'u5', name: 'Sam Whitfield', email: 'sam@refs.org', role: 'Referee', status: 'active' },
  { id: 'u6', name: 'Nora Bennett', email: 'nora@lakeview.fc', role: 'Coach', status: 'suspended' },
]
