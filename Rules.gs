function set_participants_stats_rules( _nb_rows )
{
  Logger.log( "Adding format rules to participants table..." );

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  var home_sheet = ss.getSheetByName( HOME_SHEET_NAME );

  const rules = home_sheet.getConditionalFormatRules();
  const participants_range = home_sheet.getRange( HOME_PARTICIPANTS_FIRST_ROW, HOME_PARTICIPANTS_COL, _nb_rows, HOME_PARTICIPANTS_TABLE_WIDTH );

  const finished_list_rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied( '=$B' + HOME_PARTICIPANTS_FIRST_ROW + '=$C' + HOME_PARTICIPANTS_FIRST_ROW )
    .setBold( true )
    .setBackground( "#d9ead3" )
    .setRanges( [participants_range] )
    .build();

  const no_current_game_rule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains( "<Pas de jeu en cours>" )
    .setFontColor( "#b7b7b7" )
    .setItalic( true )
    .setRanges( [participants_range] )
    .build();

  rules.push( finished_list_rule );
  rules.push( no_current_game_rule );
  home_sheet.setConditionalFormatRules( rules );
  Logger.log( "All rules added!" );
}
