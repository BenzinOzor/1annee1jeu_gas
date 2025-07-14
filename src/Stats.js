class NumberedStat
{
    constructor()
    {
        this.m_name = "";   // Platform name, version, etc..
        this.m_number = 0;  // How many has been encountered.
    }
}

class Stats
{
    constructor()
    {
        this.m_nb_games = 0;
        this.m_nb_finished_games = 0;
        this.m_platform_numbers = new Map();
        this.m_versions_numbers = [];
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

    sheets.forEach( function( _sheet )
    {
        if( is_sheet_name_valid( _sheet ) == false )
            return;

        let sheet_results = collect_sheet_stats( _sheet, stats );
    });

    Logger.log( "Done collecting" );
    insert_platforms_chart( home_sheet, stats );
}

function insert_platforms_chart( _sheet, _stats )
{
    const sorted_platforms = new Map([..._stats.m_platform_numbers.entries()].sort((a, b) => b[1] - a[1]));

    let data = Charts.newDataTable()
    .addColumn( Charts.ColumnType.STRING, 'Plateforme' )
    .addColumn( Charts.ColumnType.NUMBER, 'Nombre' );

    sorted_platforms.forEach( function( _value, _key, _map )
    {
        data.addRow( [ _key, _value ] );
        Logger.log( "%s : %d", _key, _value );
    });

    data.build();

    let chart = Charts.newPieChart()
    .setDataTable( data )
    .setTitle( "Répartition des plateformes" )
    //.setPosition( HOME_STATS_FIRST_COL, HOME_STATS_FIRST_ROW, 0, 0 )
    .setDimensions(906, 906)
    .build();

    //var htmlOutput = HtmlService.createHtmlOutput().setTitle('Répartition des plateformes');
    var imageData = Utilities.base64Encode(chart.getAs('image/png').getBytes());
    var imageUrl = "data:image/png;base64," + encodeURI(imageData);

    // Insert the image in the A1
    _sheet.insertImage(imageUrl, HOME_STATS_FIRST_COL, HOME_STATS_FIRST_ROW);
    


    //_sheet.insertChart( chart );
}

function collect_sheet_stats( _sheet, _stats )
{
    Logger.log( "Collecting stats for '%s'", _sheet.getName() );
    const header_row = get_header_row( _sheet, "A:A", MODEL_STATE_COL_NAME );
    Logger.log( "looking for number of row, header row : %d", header_row );
    const nb_rows = get_number_of_rows( _sheet, header_row + 1 );
    const nb_cols = get_number_of_columns( _sheet );

    const sheet_range = _sheet.getRange( header_row + 1, 1, nb_rows, nb_cols );
    const range_data = sheet_range.getValues();

    const state_col_index = get_column_data_index( _sheet, MODEL_STATE_COL_NAME, header_row );
    const platform_col_index = get_column_data_index( _sheet, MODEL_PLATFORM_COL_NAME, header_row );

    var years = get_birth_year_and_season( _sheet, header_row, nb_rows );

    let finished_games = 0;
    let nb_games = years._season - years._birth_year + 1;

    for( data_row = 0; data_row < range_data.length; ++data_row )
    {
        if( range_data[ data_row ][ state_col_index ] == GAME_STATE_IGNORED )
            --nb_games;

        if( range_data[ data_row ][ state_col_index ] == GAME_STATE_DONE || range_data[ data_row ][ state_col_index ] == GAME_STATE_ABANDONED )
            ++finished_games;

        if( _stats.m_platform_numbers.get( range_data[ data_row ][ platform_col_index ] ) )
        {
            let temp = _stats.m_platform_numbers.get( range_data[ data_row ][ platform_col_index ] );
            ++temp;
            _stats.m_platform_numbers.set( range_data[ data_row ][ platform_col_index ], temp );
        }
        else
            _stats.m_platform_numbers.set( range_data[ data_row ][ platform_col_index ], 1 );
    }

    // on s'arrête un jeu trop tôt ? calcul du nombre de jeu pas bon et différent de celui de l'accueil, plutot faire saison - birth comme sur l'accueil ?
    Logger.log( "Found %d finished games out of %d total games in '%s'", finished_games, nb_games, _sheet.getName() );
    var result = {m_finished_games: finished_games, m_total_nb_games: nb_games};
    return result;
}