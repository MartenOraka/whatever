export interface ProfileData { id: number; bio: string; links: string[]; banner_url?: string | null; username?: string | null; crew_roles?: string[] }
export interface Game { name: string; playtime_hours?: number; rank?: string; extra?: Record<string, string | number> }
export interface Gaming { games: Game[]; platforms?: string[]; modes: string[]; goals: string[]; availability: string[]; tags: string[]; steam_url: string | null }
export interface Creative { skills: string[]; interests: string[]; tools: string[]; roles: string[]; goals: string[]; tags: string[]; experience: string | null }
export interface Location { city: string | null; lat: number | null; lng: number | null; radius_km: number }
export interface Bio { id: number; location: Location; gaming: Gaming; creative: Creative; preferences?: { gaming?: Record<string, string>; creative?: Record<string, string> } }

// What other users' profiles look like: city only, never coordinates.
export type PublicBio = Omit<Bio, 'location'> & { location: { city: string | null } };
export interface UserBrief { id: number; name: string; avatar_url: string | null }
export interface Why { id: number; score: number; reasons: string[] }
export type Mode = 'gaming' | 'creative';
// One recommendation card = the results of several small API calls combined
export interface CardData extends UserBrief { about: string; username: string | null; crew_roles: string[]; banner_url: string | null; bio: PublicBio; why: Why }
