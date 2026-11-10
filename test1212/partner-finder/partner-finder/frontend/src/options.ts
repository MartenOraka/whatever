// Suggestions shown as chips. Users can also add their own values.
export const pretty = (s: string) => s.replace(/-/g, ' ');

// Game-specific optional fields (stored in game.extra)
export const EXTRA_FIELDS: Record<string, { key: string; label: string; min: number; max: number }[]> = {
  'Counter-Strike 2': [{ key: 'faceit_level', label: 'FACEIT level', min: 1, max: 10 }],
};

export const MODES = ['Ranked', 'Casual', 'Co-op', 'PvE', 'Competitive team', 'Custom games'];
export const G_GOALS = ['Climb ranks', 'Have fun', 'Find a regular squad', 'Learn the game', 'Play competitively'];
export const SLOTS = ['weekday-morning', 'weekday-evening', 'weekday-night', 'weekend-day', 'weekend-evening', 'weekend-night'];
export const G_TAGS = ['Looking for a teammate', 'Team player', 'Looking for regular games', 'Casual player', 'Competitive player'];

export const SKILLS = ['Programming', '3D Modeling', 'Video Editing', 'Graphic Design', 'Music Production', 'Game Design', 'Writing', 'Animation', 'Sound Design', 'UI/UX'];
export const TOOLS = ['Blender', 'Unity', 'Unreal Engine', 'Godot', 'DaVinci Resolve', 'Premiere Pro', 'Figma', 'Photoshop', 'VS Code', 'FL Studio', 'Aseprite'];
export const INTERESTS = ['Indie games', 'Short films', 'Pixel art', 'Game jams', 'Web apps', 'Music', 'Comics', 'VR', 'Mods', 'Open source'];
export const EXPERIENCE = ['beginner', 'intermediate', 'advanced', 'professional'];
export const ROLES = ['Programmer', '3D Artist', 'Video Editor', 'Designer', 'Composer', 'Writer', 'Producer'];
export const C_GOALS = ['Finish a portfolio project', 'Join a game jam', 'Learn together', 'Build a startup', 'Just for fun'];
export const C_TAGS = ['Looking for a project', 'Looking for a collaborator', 'Learning together', 'Programmer', '3D Artist', 'Video Editor', 'Designer'];

// Match priorities the user can adjust (key = backend factor name)
export const GAMING_FACTORS = [['games', 'Shared games'], ['rank', 'Similar rank'], ['playtime', 'Similar playtime'], ['modes', 'Preferred modes'], ['availability', 'Availability'], ['goals', 'Goals']] as const;
export const CREATIVE_FACTORS = [['interests', 'Shared interests'], ['tools', 'Same tools'], ['roles', 'Roles I look for'], ['goals', 'Goals'], ['skills', 'Skills'], ['experience', 'Experience level']] as const;

// For people who cannot or do not want to share GPS
export const CITIES = [
  { name: 'Tallinn', lat: 59.437, lng: 24.7536 }, { name: 'Tartu', lat: 58.378, lng: 26.729 }, { name: 'Pärnu', lat: 58.385, lng: 24.4971 },
  { name: 'Narva', lat: 59.377, lng: 28.1903 }, { name: 'Helsinki', lat: 60.1699, lng: 24.9384 }, { name: 'Riga', lat: 56.9496, lng: 24.1052 },
  { name: 'Stockholm', lat: 59.3293, lng: 18.0686 }, { name: 'Berlin', lat: 52.52, lng: 13.405 }, { name: 'London', lat: 51.5072, lng: -0.1276 },
  { name: 'New York', lat: 40.7128, lng: -74.006 },
];

// The four QREW roles. Stored on the profile as crew_roles (keys), shown with icons.
export const CREW_ROLES = [
  { key: 'ideator', label: 'Ideator / Creator', short: 'Ideator', hint: 'Comes up with ideas and looks for people to build them' },
  { key: 'gamer', label: 'Gamer', short: 'Gamer', hint: 'Plays, competes and teams up' },
  { key: 'developer', label: 'Developer', short: 'Developer', hint: 'Writes code and builds the thing' },
  { key: 'artist', label: 'Artist / Designer', short: 'Artist / Designer', hint: 'Makes it look and feel great' },
] as const;
export const PLATFORMS = ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile', 'VR'];
