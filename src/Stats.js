class Platform
{
    constructor()
    {
        this.m_family = Family.None;
        this.m_background_color = "#ffffff";
        this.m_foreground_color = "#000000";
        this.m_name = PlatformName.None;
        this.m_count = 0;
    }
}

class Stats
{
    constructor()
    {
        this.m_nb_games = 0;
        this.m_nb_finished_games = 0;
        this.m_family_numbers = new Map();
        this.m_versions_numbers = [];
        this.m_platforms = [];
    }
}

function compute_stats()
{
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    let home_sheet = ss.getSheetByName( HOME_SHEET_NAME );

    let stats = new Stats;

    stats.m_nb_finished_games = home_sheet.getRange( HOME_STATS_FINISHED_GAMES ).getValue();
    stats.m_nb_games = home_sheet.getRange( HOME_STATS_NB_GAMES ).getValue();

    Logger.log( "Collecting stats of all sheets..." );
    Logger.log( "Values from sheet: %d finished games out of %d", stats.m_nb_finished_games, stats.m_nb_games );

    sheets.forEach( function( _sheet )
    {
        if( is_sheet_name_valid( _sheet ) == false )
            return;

        collect_sheet_stats( _sheet, stats );
    });

    Logger.log( "Done collecting" );
    handle_stats( stats );
    fill_platfroms_stats( home_sheet, stats );
}

function handle_stats( _stats )
{
    Logger.log( "   Sorting and handling collected stats..." );

    _stats.m_platforms.sort( (a,b) => b.m_count - a.m_count );

    for( const platform in PlatformName )
    {
        if( platform == PlatformName.None )
            continue;

        if( !_stats.m_platforms.find( Platform => Platform.m_name === PlatformName[ platform ] ) )
        {
            let new_platform = get_family_infos( PlatformName[ platform ] );

            if( new_platform.m_name != PlatformName.None )
            {
                _stats.m_platforms.push( new_platform );
            }
        }
    }
}

function fill_platfroms_stats( _sheet, _stats )
{
    let platform_row = _sheet.getRange( HOME_STATS_PLATFORM_CELL ).getRow();
    const platform_name_col = _sheet.getRange( HOME_STATS_PLATFORM_CELL ).getColumn();
    const platform_number_col = platform_name_col + 1;
    
    _stats.m_platforms.forEach( function( _platform )
    {
        let percentage = _platform.m_count/_stats.m_nb_games*100;
        _sheet.getRange( platform_row, platform_name_col ).setValue( _platform.m_name );

        if( _platform.m_count == 0 )
            _sheet.getRange( platform_row, platform_number_col ).setValue( "-" );
        else
            _sheet.getRange( platform_row, platform_number_col ).setValue( _platform.m_count + " (" + percentage.toFixed() + "%)" );

        let platform_range = _sheet.getRange( platform_row, platform_name_col, 1, 2 );
        platform_range.setBackground( _platform.m_background_color );
        platform_range.setFontColor( _platform.m_foreground_color );

        Logger.log( "%d - %s : %d", platform_row, _platform.m_name, _platform.m_count );
        ++platform_row;
    });
}

function collect_sheet_stats( _sheet, _stats )
{
    Logger.log( "   Collecting stats for '%s'", _sheet.getName() );
    const header_row = get_header_row( _sheet, "A:A", MODEL_STATE_COL_NAME );
    const nb_rows = get_number_of_rows( _sheet, header_row + 1 );
    const nb_cols = get_number_of_columns( _sheet );

    const sheet_range = _sheet.getRange( header_row + 1, 1, nb_rows, nb_cols );
    const range_data = sheet_range.getValues();

    const state_col_index = get_column_data_index( _sheet, MODEL_STATE_COL_NAME, header_row );
    const platform_col_index = get_column_data_index( _sheet, MODEL_PLATFORM_COL_NAME, header_row );
    const game_col_index = get_column_data_index( _sheet, MODEL_GAME_COL_NAME, header_row );

    var years = get_birth_year_and_season( _sheet, header_row, nb_rows );

    let finished_games = 0;
    let nb_games = years._season - years._birth_year + 1;
    let treated_games = 0;

    for( data_row = 0; data_row < range_data.length; ++data_row )
    {
        if( range_data[ data_row ][ state_col_index ] == GAME_STATE_IGNORED )
            --nb_games;

        if( range_data[ data_row ][ state_col_index ] == GAME_STATE_DONE || range_data[ data_row ][ state_col_index ] == GAME_STATE_ABANDONED )
            ++finished_games;

        // We don't want to do stats on ignored years or replaced games.
        if( range_data[ data_row ][ state_col_index ] == GAME_STATE_IGNORED || range_data[ data_row ][ state_col_index ] == GAME_STATE_REPLACED )
            continue;

        // We don't want to do stats on empty game rows.
        if( range_data[ data_row ][ game_col_index ] == "" )
            continue;

        let platform = _stats.m_platforms.find( Platform => Platform.m_name === range_data[ data_row ][ platform_col_index ] );
        if( platform != null )
        {
            ++platform.m_count;
        }
        else
        {
            let new_platform = get_family_infos( range_data[ data_row ][ platform_col_index ] );

            if( new_platform.m_name != PlatformName.None )
            {
                new_platform.m_count = 1;
                _stats.m_platforms.push( new_platform );
            }
        }

        ++treated_games;
    }

    Logger.log( "   %d treated games", treated_games );
}