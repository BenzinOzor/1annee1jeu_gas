function compute_stats()
{
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    let home_sheet = ss.getSheetByName( HOME_SHEET_NAME );

    let stats = {m_finished_games: 0, m_total_nb_games: 0};

    sheets.forEach( function( _sheet )
    {
        if( is_sheet_name_valid( _sheet ) == false )
            return;

        Logger.log( "Collecting stats for '%s'", _sheet.getName() );
        let sheet_results = collect_sheet_stats( _sheet );

        stats.m_finished_games += sheet_results.m_finished_games;
        stats.m_total_nb_games += sheet_results.m_total_nb_games;
    });

    home_sheet.getRange( HOME_PARTICIPANTS_FIRST_ROW, HOME_STATS_FIRST_COL ).setValue( stats.m_finished_games );
    home_sheet.getRange( HOME_PARTICIPANTS_FIRST_ROW, HOME_STATS_FIRST_COL + 1 ).setValue( stats.m_total_nb_games );
}

function collect_sheet_stats( _sheet )
{
    const header_row = get_header_row( _sheet, "A:A", MODEL_STATE_COL_NAME ) + 1;
    Logger.log( "looking for number of row, header row : %d", header_row );
    const nb_rows = get_number_of_rows( _sheet, header_row + 1 );
    const nb_cols = get_number_of_columns( _sheet );

    const sheet_range = _sheet.getRange( header_row + 1, 1, nb_rows, nb_cols );
    const range_data = sheet_range.getValues();

    const state_col_index = get_column_data_index( _sheet, MODEL_STATE_COL_NAME, header_row );

    let finished_games = 0;
    let nb_games = 0;

    for( data_row = 0; data_row < range_data.length; ++data_row )
    {
        if( range_data[ data_row ][ state_col_index ] != GAME_STATE_REMPLACED && range_data[ data_row ][ state_col_index ] != GAME_STATE_IGNORED )
            ++nb_games;

        if( range_data[ data_row ][ state_col_index ] == GAME_STATE_DONE || range_data[ data_row ][ state_col_index ] == GAME_STATE_ABANDONED )
            ++finished_games;
    }

    // on s'arrête un jeu trop tôt ? calcul du nombre de jeu pas bon et différent de celui de l'accueil, plutot faire saison - birth comme sur l'accueil ?
    Logger.log( "Found %d finished games out of %d total games in '%s'", finished_games, nb_games, _sheet.getName() );
    var result = {m_finished_games: finished_games, m_total_nb_games: nb_games};
    return result;
}