// The QREW game library. One place to add or fix a game: edit this list, restart the server.
//  name      = the official name that is stored on profiles (everyone who picks it matches everyone else)
//  aliases   = other spellings people type (CS2, LoL, FIFA ...) -> they all become `name`
//  steam     = Steam app id when the game is on Steam (gives the real cover art; leave out if unsure)
//  color     = tile colour for the fallback artwork;  glyph = key of a brand glyph in frontend/src/gameGlyphs.ts
//  ranks     = rank ladder, lowest -> highest (used for the rank dropdown and the "similar rank" score)
export interface CatalogGame {
  name: string; category: string; platforms: string[]; color: string;
  aliases?: string[]; steam?: number; glyph?: string; ranks?: string[];
}

export const CATEGORIES = ['Shooters', 'Battle Royale', 'MOBA & Strategy', 'MMO & RPG', 'Sandbox & Survival', 'Co-op & Party', 'Action & Open World', 'Sports & Racing', 'Fighting', 'Mobile'] as const;

const PC = 'PC', PS = 'PlayStation', XB = 'Xbox', NS = 'Nintendo Switch', MB = 'Mobile';
const g = (name: string, category: string, platforms: string[], color: string, o: Partial<CatalogGame> = {}): CatalogGame => ({ name, category, platforms, color, ...o });
const R_STD = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master'];

export const GAME_CATALOG: CatalogGame[] = [
  // ---- Shooters
  g('Counter-Strike 2', 'Shooters', [PC], '#de9b35', { aliases: ['CS2', 'CS:GO', 'CSGO', 'Counter-Strike', 'Counter-Strike: Global Offensive'], steam: 730, glyph: 'counterstrike', ranks: ['Silver', 'Gold Nova', 'Master Guardian', 'Legendary Eagle', 'Global Elite'] }),
  g('Valorant', 'Shooters', [PC, PS, XB], '#ff4655', { glyph: 'valorant', ranks: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'] }),
  g('Rainbow Six Siege', 'Shooters', [PC, PS, XB], '#3b8ed0', { aliases: ['R6', 'R6S', 'Rainbow 6 Siege'], steam: 359550, glyph: 'ubisoft', ranks: ['Copper', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Champion'] }),
  g('Overwatch 2', 'Shooters', [PC, PS, XB, NS], '#f99e1a', { aliases: ['Overwatch', 'OW2'], steam: 2357570, glyph: 'battledotnet', ranks: [...R_STD, 'Grandmaster', 'Champion'] }),
  g('Call of Duty', 'Shooters', [PC, PS, XB], '#6f8a3b', { aliases: ['CoD', 'Warzone', 'Call of Duty: Warzone', 'Modern Warfare', 'Black Ops 6', 'Call of Duty: Black Ops 6'], steam: 1938090, glyph: 'activision' }),
  g('Marvel Rivals', 'Shooters', [PC, PS, XB], '#e23636', { steam: 2767030, ranks: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Grandmaster', 'Celestial', 'Eternity', 'One Above All'] }),
  g('The Finals', 'Shooters', [PC, PS, XB], '#ff2d55', { steam: 2073850 }),
  g('Team Fortress 2', 'Shooters', [PC], '#c4592f', { aliases: ['TF2'], steam: 440 }),
  g('Deadlock', 'Shooters', [PC], '#8a6b3f', { steam: 1422450 }),
  g('Battlefield 2042', 'Shooters', [PC, PS, XB], '#2f9be0', { aliases: ['Battlefield'], steam: 1517290 }),
  g('Halo Infinite', 'Shooters', [PC, XB], '#4f8f3c', { steam: 1240440 }),
  g('Destiny 2', 'Shooters', [PC, PS, XB], '#6b7bd6', { steam: 1085660 }),
  g('Delta Force', 'Shooters', [PC, PS, XB, MB], '#7a8a52', { steam: 2507950 }),
  g('Escape from Tarkov', 'Shooters', [PC], '#8d8d7c', { aliases: ['Tarkov', 'EFT'] }),
  // ---- Battle Royale
  g('Fortnite', 'Battle Royale', [PC, PS, XB, NS, MB], '#6a5cff', { glyph: 'fortnite', ranks: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite', 'Champion', 'Unreal'] }),
  g('Apex Legends', 'Battle Royale', [PC, PS, XB, NS], '#da292a', { aliases: ['Apex'], steam: 1172470, glyph: 'ea', ranks: [...R_STD, 'Apex Predator'] }),
  g('PUBG: BATTLEGROUNDS', 'Battle Royale', [PC, PS, XB, MB], '#f2a900', { aliases: ['PUBG', 'Battlegrounds', "PlayerUnknown's Battlegrounds"], steam: 578080, glyph: 'pubg' }),
  // ---- MOBA & Strategy
  g('League of Legends', 'MOBA & Strategy', [PC], '#c89b3c', { aliases: ['LoL', 'League'], glyph: 'leagueoflegends', ranks: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'] }),
  g('Dota 2', 'MOBA & Strategy', [PC], '#a72b2b', { aliases: ['Dota'], steam: 570, glyph: 'dota2', ranks: ['Herald', 'Guardian', 'Crusader', 'Archon', 'Legend', 'Ancient', 'Divine', 'Immortal'] }),
  g('Teamfight Tactics', 'MOBA & Strategy', [PC, MB], '#1fb1b1', { aliases: ['TFT'], glyph: 'riotgames' }),
  g('SMITE', 'MOBA & Strategy', [PC, PS, XB, NS], '#3aa0d8', { aliases: ['Smite 2'], steam: 386360 }),
  g('Age of Empires II: Definitive Edition', 'MOBA & Strategy', [PC, XB], '#c9a14a', { aliases: ['AoE2', 'Age of Empires II', 'Age of Empires 2'], steam: 813780 }),
  g('Sid Meier\'s Civilization VI', 'MOBA & Strategy', [PC, PS, XB, NS], '#3e7fc4', { aliases: ['Civilization VI', 'Civ 6', 'Civ VI', 'Civilization'], steam: 289070 }),
  g('StarCraft II', 'MOBA & Strategy', [PC], '#2c7be5', { aliases: ['SC2', 'Starcraft 2'], glyph: 'battledotnet' }),
  g('Hearthstone', 'MOBA & Strategy', [PC, MB], '#f4a62a', { glyph: 'battledotnet' }),
  // ---- MMO & RPG
  g('World of Warcraft', 'MMO & RPG', [PC], '#0c6bb8', { aliases: ['WoW'], glyph: 'battledotnet' }),
  g('Final Fantasy XIV', 'MMO & RPG', [PC, PS], '#6a8fd8', { aliases: ['FFXIV', 'FF14', 'Final Fantasy 14'], steam: 39210, glyph: 'squareenix' }),
  g('Lost Ark', 'MMO & RPG', [PC], '#e0803a', { steam: 1599340 }),
  g('Path of Exile', 'MMO & RPG', [PC, PS, XB], '#9c6a3a', { aliases: ['PoE'], steam: 238960 }),
  g('Diablo IV', 'MMO & RPG', [PC, PS, XB], '#b11c1c', { aliases: ['Diablo 4'], steam: 2344520, glyph: 'battledotnet' }),
  g('ELDEN RING', 'MMO & RPG', [PC, PS, XB], '#c8a24a', { steam: 1245620 }),
  g("Baldur's Gate 3", 'MMO & RPG', [PC, PS, XB], '#a22a2a', { aliases: ['BG3', 'Baldurs Gate 3'], steam: 1086940 }),
  g('Black Desert', 'MMO & RPG', [PC, PS, XB], '#c05a2a', { aliases: ['Black Desert Online', 'BDO'], steam: 582660 }),
  g('Albion Online', 'MMO & RPG', [PC, MB], '#d49a2a', { steam: 761890 }),
  g('Warframe', 'MMO & RPG', [PC, PS, XB, NS], '#3aa7d9', { steam: 230410 }),
  g('Genshin Impact', 'MMO & RPG', [PC, PS, MB], '#6ab0e8', { aliases: ['Genshin'] }),
  g('Honkai: Star Rail', 'MMO & RPG', [PC, PS, MB], '#a98bd8', { aliases: ['HSR', 'Star Rail'] }),
  // ---- Sandbox & Survival
  g('Minecraft', 'Sandbox & Survival', [PC, PS, XB, NS, MB], '#5aa02c', { aliases: ['MC'], glyph: 'cube' }),
  g('Roblox', 'Sandbox & Survival', [PC, PS, XB, MB], '#e2231a', { glyph: 'roblox' }),
  g('Terraria', 'Sandbox & Survival', [PC, PS, XB, NS, MB], '#5ab05a', { steam: 105600 }),
  g('Rust', 'Sandbox & Survival', [PC, PS, XB], '#c1462e', { steam: 252490 }),
  g('ARK: Survival Evolved', 'Sandbox & Survival', [PC, PS, XB], '#4f9f6a', { aliases: ['ARK'], steam: 346110 }),
  g('Valheim', 'Sandbox & Survival', [PC, XB], '#4a7fa0', { steam: 892970 }),
  g('Palworld', 'Sandbox & Survival', [PC, XB, PS], '#3a9ad9', { steam: 1623730 }),
  g('Stardew Valley', 'Sandbox & Survival', [PC, PS, XB, NS, MB], '#6dbd4a', { steam: 413150 }),
  g("Don't Starve Together", 'Sandbox & Survival', [PC, PS, XB, NS], '#8a6a3a', { aliases: ['DST'], steam: 322330 }),
  g('Project Zomboid', 'Sandbox & Survival', [PC], '#7a8a4a', { steam: 108600 }),
  g('7 Days to Die', 'Sandbox & Survival', [PC, PS, XB], '#a04a2a', { aliases: ['7D2D'], steam: 251570 }),
  g('Satisfactory', 'Sandbox & Survival', [PC], '#e0a030', { steam: 526870 }),
  g('Factorio', 'Sandbox & Survival', [PC, NS], '#e08a2a', { steam: 427520 }),
  g('Raft', 'Sandbox & Survival', [PC], '#3aa0c8', { steam: 648800 }),
  // ---- Co-op & Party
  g('Helldivers 2', 'Co-op & Party', [PC, PS], '#f2c230', { aliases: ['Helldivers II'], steam: 553850 }),
  g('Left 4 Dead 2', 'Co-op & Party', [PC], '#b03a2a', { aliases: ['L4D2'], steam: 550 }),
  g('Deep Rock Galactic', 'Co-op & Party', [PC, XB, PS], '#e0903a', { aliases: ['DRG'], steam: 548430 }),
  g('Lethal Company', 'Co-op & Party', [PC], '#d04a2a', { steam: 1966720 }),
  g('Phasmophobia', 'Co-op & Party', [PC, PS, XB], '#7a4ad0', { steam: 739630 }),
  g('Content Warning', 'Co-op & Party', [PC], '#d0a030', { steam: 2881650 }),
  g('Among Us', 'Co-op & Party', [PC, MB, NS, PS, XB], '#c51111', { steam: 945360 }),
  g('Fall Guys', 'Co-op & Party', [PC, PS, XB, NS], '#e84a9a', { steam: 1097150 }),
  g('Overcooked! 2', 'Co-op & Party', [PC, PS, XB, NS], '#e07a2a', { aliases: ['Overcooked'], steam: 728880 }),
  g('It Takes Two', 'Co-op & Party', [PC, PS, XB, NS], '#e0a04a', { steam: 1426210 }),
  g('Dead by Daylight', 'Co-op & Party', [PC, PS, XB, NS, MB], '#a02a2a', { aliases: ['DBD'], steam: 381210 }),
  g('Sea of Thieves', 'Co-op & Party', [PC, XB, PS], '#2a8ac0', { steam: 1172620 }),
  g('Monster Hunter: World', 'Co-op & Party', [PC, PS, XB], '#c8a84a', { aliases: ['MHW'], steam: 582010 }),
  g('Monster Hunter Wilds', 'Co-op & Party', [PC, PS, XB], '#7ab04a', { aliases: ['MH Wilds', 'MHWilds'], steam: 2246340 }),
  // ---- Action & Open World
  g('Grand Theft Auto V', 'Action & Open World', [PC, PS, XB], '#5ac85a', { aliases: ['GTA V', 'GTA 5', 'GTA5', 'GTA Online', 'Grand Theft Auto 5', 'Grand Theft Auto Online'], steam: 271590, glyph: 'rockstargames' }),
  g('Red Dead Redemption 2', 'Action & Open World', [PC, PS, XB], '#b3342a', { aliases: ['RDR2', 'Red Dead Online', 'Red Dead'], steam: 1174180, glyph: 'rockstargames' }),
  // ---- Sports & Racing
  g('Rocket League', 'Sports & Racing', [PC, PS, XB, NS], '#0078f2', { aliases: ['RL'], steam: 252950, glyph: 'epicgames', ranks: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Champion', 'Grand Champion', 'Supersonic Legend'] }),
  g('EA SPORTS FC', 'Sports & Racing', [PC, PS, XB, NS], '#1fc16a', { aliases: ['FIFA', 'EA FC', 'FC 24', 'FC 25', 'FC 26', 'EA SPORTS FC 25', 'EA SPORTS FC 26'], glyph: 'ea' }),
  g('NBA 2K', 'Sports & Racing', [PC, PS, XB, NS], '#c8102e', { aliases: ['2K', 'NBA 2K25', 'NBA 2K26'] }),
  g('Forza Horizon 5', 'Sports & Racing', [PC, XB], '#f2a900', { aliases: ['Forza', 'FH5'], steam: 1551360 }),
  g('Trackmania', 'Sports & Racing', [PC, PS, XB], '#2a7ad0', { steam: 2225070 }),
  // ---- Fighting
  g('Street Fighter 6', 'Fighting', [PC, PS, XB], '#e0402a', { aliases: ['SF6'], steam: 1364780 }),
  g('Tekken 8', 'Fighting', [PC, PS, XB], '#c8a02a', { steam: 1778820 }),
  g('Mortal Kombat 1', 'Fighting', [PC, PS, XB, NS], '#b0202a', { aliases: ['MK1'], steam: 1971870 }),
  g('Brawlhalla', 'Fighting', [PC, PS, XB, NS, MB], '#2a8ad0', { steam: 291550 }),
  g('Super Smash Bros. Ultimate', 'Fighting', [NS], '#e0402a', { aliases: ['Smash', 'Smash Bros', 'SSBU'] }),
  // ---- Mobile
  g('Mobile Legends: Bang Bang', 'Mobile', [MB], '#2a6ad0', { aliases: ['MLBB', 'Mobile Legends'] }),
  g('Brawl Stars', 'Mobile', [MB], '#f2c230'),
  g('Clash Royale', 'Mobile', [MB], '#2a7ad0'),
  g('League of Legends: Wild Rift', 'Mobile', [MB], '#2aa0c8', { aliases: ['Wild Rift'], glyph: 'leagueoflegends' }),
  g('Call of Duty: Mobile', 'Mobile', [MB], '#6f8a3b', { aliases: ['CODM', 'COD Mobile'], glyph: 'activision' }),
];
