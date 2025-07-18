const MODEL_SHEET_NAME = "⚙️ Modèle";
const HOME_SHEET_NAME = "🏠 Accueil";

const DEFAULT_ROW_HEIGHT = 21;

const GAME_STATE_NOT_STARTED = "Pas commencé";
const GAME_STATE_PLAYING = "En cours";
const GAME_STATE_DONE = "Terminé";
const GAME_STATE_ABANDONED = "Abandonné";
const GAME_STATE_REPLACED = "Remplacé";
const GAME_STATE_IGNORED = "Ignoré";

const MODEL_STATE_COL_NAME = "Complétion";
const MODEL_YEAR_COL_NAME = "Année";
const MODEL_GAME_COL_NAME = "Jeu";
const MODEL_GENRE_COL_NAME = "Genre";
const MODEL_PLATFORM_COL_NAME = "Plateforme";
const MODEL_VERSION_COL_NAME = "Version";
const MODEL_ESTIMATE_COL_NAME = "Estimation";
const MODEL_PLAYED_COL_NAME = "Temps Passé";
const MODEL_DELTA_COL_NAME = "Différence";
const MODEL_RATING_COL_NAME = "Note";
const MODEL_COMMENT_COL_NAME = "Commentaire";
const MODEL_VERDICT_COL_NAME = "Commentaire Pendant / Post Jeu";

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

// STATS
const HOME_STATS_FIRST_COL = 8;     // H
const HOME_STATS_FIRST_ROW = 34;
const HOME_STATS_FINISHED_GAMES = "J31";
const HOME_STATS_NB_GAMES = "N31";
const HOME_STATS_PLATFORM_CELL = "H35";

const Family =
{
    None: 'None',
    PC: 'PC',
    Sony: 'Sony',
    Xbox: 'Xbox',
    Nintendo: 'Nintendo',
    Sega: 'Sega'
}

const PlatformName = 
{
    None: 'None',
    PC: 'PC',
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
    NeoGeo: 'Neo-Geo'
}

class Platform
{
    constructor()
    {
        this.m_family = Family.None;
        this.m_background_color = "#ffffff";
        this.m_foreground_color = "#000000";
        this.m_name = PlatformName.None;
    }
}