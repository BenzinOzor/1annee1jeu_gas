const MODEL_SHEET_NAME = "⚙️ Modèle";
const HOME_SHEET_NAME = "🏠 Accueil";

const DEFAULT_ROW_HEIGHT = 21;

const GameState =
{
	NotStarted: 'Pas commencé',
	Playing: 'En cours',
	Done: 'Terminé',
	Abandoned: 'Abandonné',
	Replaced: 'Remplacé',
	Ignored: 'Ignoré'
}

const ModelColumnName =
{
	State: 'Complétion',
	Year: 'Année',
	Game: 'Jeu',
	Genre: 'Genre',
	Platfrom: 'Plateforme',
	Version: 'Version',
	Estimate: 'Estimation',
	Played: 'Temps Passé',
	Delta: 'Delta',
	Rating: 'Note',
	Comment: 'Commentaire',
	Verdict: 'Commentaire Pendant / Post Jeu'
}

const MODEL_TABLE_HEADER_ROW = 6;
const MODEL_TABLE_FIRST_ROW = 7;
const MODEL_TABLE_YEAR_COL = 2;
const MODEL_TABLE_VERSION_COL = 6;

const HOME_PARTICIPANTS_FIRST_ROW = 28;
const HOME_PARTICIPANTS_TABLE_WIDTH = 5;
const HOME_PARTICIPANTS_COL = 2;    // B
const HOME_FINISHED_GAMES_COL = 3;  // C
const HOME_GAMES_TO_FINISH_COL = 4; // D
const HOME_PROGRESSION_BAR_COL = 5; // E
const HOME_CURRENT_GAME_COL = 6;    // F

const MIN_BIRTH_YEAR = 1950;
const MAX_DURATION_SECONDS = 3602439;	// 999:99:99

// STATS
const HOME_STATS_RANGE = "H26:P104";
const HOME_STATS_CELL = [ 26, 8 ];	// "H26"
const HOME_STATS_WIDTH = 9;
const HOME_STATS_EMPTY_CELL_BACKGROUND = "#efefef";
const HOME_STATS_EMPTY_CELL_FOREGROUND = "#b7b7b7";

const HomeStat = 
{
	FinishedGames: 'Jeux terminés',
	NumberOfGames: 'Nombre total de jeux',
	Platforms: 'Plateformes',
	TopPlatforms: 'Top 5 Plateformes',
	Families: 'Familles',
	Versions: 'Versions',
	Decade90s: '1990 - 1999',
	Decade2Ks: '2000 - 2009',
	Decade2K10s: '2010 - 2019',
	Decade2K20s: '2020 - 2029',
	EstimatedTime: 'Temps estimé',
	PlayedTime: 'Temps passé',
	AverageDelta: 'Delta moyen',
	ShortestEstimate: 'Temps estimé le plus court',
	LongestEstimate: 'Temps estimé le plus long',
	ShortestPlayed: 'Temps passé le plus court',
	LongestPlayed: 'Temps passé le plus long',
	NegativeDelta: 'Plus grand delta négatif',
	PositiveDelta: 'Plus grand delta positif'
}

const Family =
{
	None: 'None',
	PC: 'PC',
	Sony: 'Sony',
	Xbox: 'Xbox',
	Nintendo: 'Nintendo',
	Sega: 'Sega',
}

const PlatformName =
{
	None: 'None',
	PC: 'PC',
	Mobile: 'Mobile',
	PS1: 'PS1',
	PS2: 'PS2',
	PS3: 'PS3',
	PS4: 'PS4',
	PS5: 'PS5',
	PSP: 'PSP',
	Vita: 'Vita',
	Xbox: 'Xbox',
	Xbox360: 'X360',
	XONE: 'XONE',
	XboxSeries: 'Series X|S',
	NES: 'NES',
	SNES: 'SNES',
	N64: 'N64',
	GameCube: 'GameCube',
	Wii: 'Wii',
	WiiU: 'Wii U',
	Switch: 'Switch',
	Switch2: 'Switch 2',
	GameBoy: 'Game Boy',
	GameBoyColor: 'Game Boy Color',
	GBA: 'GBA',
	DS: 'DS',
	ThreeDS: '3DS',
	MasterSystem: 'Master System',
	MegaDrive: 'Mega Drive',
	GameGear: 'Game Gear',
	MegaCD: 'Mega-CD',
	Saturn: 'Saturn',
	Dreamcast: 'Dreamcast',
	NeoGeo: 'Neo-Geo',
	Arcade: 'Arcade',
}

const VersionName =
{
	None: 'None',
	Original: 'Original',
	Remake: 'Remake',
	Remaster: 'Remaster',
	Emulation: 'Émulation'
}

const Decade =
{
	OOB: -1,				// Out of handled decades
	Nineties: 0,			// 90 - 99
	TwoKs: 1,				// 2000 - 2009
	TwoKTens: 2,			// 2010 - 2019
	TwoKTwneties: 3,		// 2020 - 2029
	Count: 4
}
