function set_participants_stats_rules( _range )
{
  Logger.log( "Adding format rules to participants table..." );

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  var home_sheet = ss.getSheetByName( HOME_SHEET_NAME );

  const rules = home_sheet.getConditionalFormatRules();

  const finished_list_rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied( '=$' + get_column_letter(HOME_FINISHED_GAMES_COL) + HOME_PARTICIPANTS_FIRST_ROW + '=$' + get_column_letter(HOME_GAMES_TO_FINISH_COL) + HOME_PARTICIPANTS_FIRST_ROW )
    .setBold( true )
    .setBackground( "#d9ead3" )
    .setRanges( [_range] )
    .build();

  const no_current_game_rule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains( "<Pas de jeu en cours>" )
    .setFontColor( "#b7b7b7" )
    .setItalic( true )
    .setRanges( [_range] )
    .build();

  rules.push( finished_list_rule );
  rules.push( no_current_game_rule );
  home_sheet.setConditionalFormatRules( rules );
  Logger.log( "All rules added!" );
}
