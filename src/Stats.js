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

class Version
{
    constructor()
    {
        this.m_version = VersionName.Original;
        this.m_background_color = "#ffffff";
        this.m_foreground_color = "#000000";
        this.m_count = 0;
    }
}

class Stats
{
    constructor()
    {
        this.m_nb_games = 0;
        this.m_nb_finished_games = 0;
        this.m_versions = [];           // Array of Version
        this.m_platforms = [];          // Array of Platform
        this.m_families_counts = new Map();
    }
}

/* **********************************************************
*  Parse all sheets and collect then display stats on the home sheet
*/
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
    fill_families_stats( home_sheet, stats );
    fill_versions_stats( home_sheet, stats );
}

/* **********************************************************
*  After data collection, sort the found stats and add missing platforms
*/
function handle_stats( _stats )
{
    Logger.log( "   Sorting and handling collected stats..." );

    // Sort found platform from most used to least.
    _stats.m_platforms.sort( (a,b) => b.m_count - a.m_count );

    // Add any missing platform so we always have a complete list in the sheet.
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

    // Compute all the platforms families to make their own stats.
    _stats.m_families_counts = new Map();

    _stats.m_families_counts.set( Family.PC, 0 );
    _stats.m_families_counts.set( Family.Sony, 0 );
    _stats.m_families_counts.set( Family.Xbox, 0 );
    _stats.m_families_counts.set( Family.Nintendo, 0 );
    _stats.m_families_counts.set( Family.Sega, 0 );

    _stats.m_platforms.forEach( function( _platform )
    {
        if( _platform.m_family == Family.None )
            return;

        _stats.m_families_counts.set( _platform.m_family, _stats.m_families_counts.get( _platform.m_family ) + _platform.m_count );
    });

    _stats.m_families_counts = new Map([..._stats.m_families_counts.entries()].sort((a, b) => b[1] - a[1]));

    // Sort version from most occuring to the least.
    _stats.m_versions.sort( (a,b) => b.m_count - a.m_count );

    // Seems quite unlikely but adding any missing version we didn't find in the read sheets.
    for( const version in VersionName )
    {
        if( !_stats.m_versions.find( Version => Version.m_version === VersionName[ version ] ) )
        {
            let new_version = new Version;
            new_version.m_version = version;
            let colors = get_version_colors( new_version.m_version );

            new_version.m_background_color = colors.m_background_color;
            new_version.m_foreground_color = colors.m_foreground_color;

            _stats.m_versions.push( new_version );
        }
    }
}

/* **********************************************************
*  Fill the platform stats columns
*/
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

        ++platform_row;
    });
}

/* **********************************************************
*  Fill the families stats columns
*/
function fill_families_stats( _sheet, _stats )
{
    let family_row = _sheet.getRange( HOME_STATS_FAMILY_CELL ).getRow();
    const family_name_col = _sheet.getRange( HOME_STATS_FAMILY_CELL ).getColumn();
    const family_count_col = family_name_col + 1;
    
    _stats.m_families_counts.forEach( function( _value, _key, _map )
    {
        let percentage = _value/_stats.m_nb_games*100;
        _sheet.getRange( family_row, family_name_col ).setValue( _key );

        if( _value == 0 )
            _sheet.getRange( family_row, family_count_col ).setValue( "-" );
        else
            _sheet.getRange( family_row, family_count_col ).setValue( _value + " (" + percentage.toFixed() + "%)" );

        const family_colors = get_family_colors( _key );
        let platform_range = _sheet.getRange( family_row, family_name_col, 1, 2 );
        platform_range.setBackground( family_colors.m_background_color );
        platform_range.setFontColor( family_colors.m_foreground_color );

        ++family_row;
    });
}

/* **********************************************************
*  Fill the version stats columns
*/
function fill_versions_stats( _sheet, _stats )
{
    let version_row = _sheet.getRange( HOME_STATS_VERSION_CELL ).getRow();
    const version_name_col = _sheet.getRange( HOME_STATS_VERSION_CELL ).getColumn();
    const version_number_col = version_name_col + 1;
    
    _stats.m_versions.forEach( function( _version )
    {
        let percentage = _version.m_count/_stats.m_nb_games*100;
        _sheet.getRange( version_row, version_name_col ).setValue( _version.m_version );

        if( _version.m_count == 0 )
            _sheet.getRange( version_row, version_number_col ).setValue( "-" );
        else
            _sheet.getRange( version_row, version_number_col ).setValue( _version.m_count + " (" + percentage.toFixed() + "%)" );

        let platform_range = _sheet.getRange( version_row, version_name_col, 1, 2 );
        platform_range.setBackground( _version.m_background_color );
        platform_range.setFontColor( _version.m_foreground_color );

        Logger.log( "%d - %s : %d", version_row, _version.m_version, _version.m_count );
        ++version_row;
    });
}

/* **********************************************************
*  Retrieve stats from a given sheet and update the stat class
*/
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
    const version_col_index = get_column_data_index( _sheet, MODEL_VERSION_COL_NAME, header_row );

    let treated_games = 0;

    for( data_row = 0; data_row < range_data.length; ++data_row )
    {
        if( state_col_index < 0 || game_col_index < 0 )
            continue;

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

        if( version_col_index >= 0 )
        {
            Logger.log( "       Looking for version %s", range_data[ data_row ][ version_col_index ] );
            let version = _stats.m_versions.find( Version => Version.m_version === range_data[ data_row ][ version_col_index ] );
            if( version != null )
            {
                ++version.m_count;
            }
            else
            {
                let new_version = new Version;
                new_version.m_version = range_data[ data_row ][ version_col_index ];
                let colors = get_version_colors( new_version.m_version );
            
                new_version.m_background_color = colors.m_background_color;
                new_version.m_foreground_color = colors.m_foreground_color;
            
                new_version.m_count = 1;
                _stats.m_versions.push( new_version );
            }
        
            version = _stats.m_versions.find( Version => Version.m_version === range_data[ data_row ][ version_col_index ] );
            Logger.log( "       %s - %d", version.m_version, version.m_count );
        }
        ++treated_games;
    }

    Logger.log( "   %d treated games", treated_games );
}