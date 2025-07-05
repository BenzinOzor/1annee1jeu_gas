function reset_participants_stats_rules( _sheet )
{
  // Retrieving last cell with text. Can't use GetLastRow because other things on the side of the participants list might be lower and we don't want to go too low.
  const participants_col_letter = get_column_letter( HOME_PARTICIPANTS_COL );
  const participants_col_values = _sheet.getRange( participants_col_letter + HOME_PARTICIPANTS_FIRST_ROW + ':' + participants_col_letter ).getValues();
  const nb_participants = participants_col_values.filter( String ).length;

  let participants_range = _sheet.getRange( HOME_PARTICIPANTS_FIRST_ROW, HOME_PARTICIPANTS_COL, nb_participants, HOME_PARTICIPANTS_TABLE_WIDTH );

  // Clearing old participants data from table first row to last row with data
  // It could mean that we clear more than necessary if there are more rows with data somewhere on the side but we don't plan to have anything under ther participants list so it doesn't really matter.
  // Recreating all the rules at the end will make just one big block of rules, easier to deal with, rather than multiple blocks for each added user.
  participants_range.clear( { formatOnly: true});
  participants_range.clear( { commentsOnly: true} );

  _sheet.getRange( HOME_PARTICIPANTS_FIRST_ROW, HOME_PARTICIPANTS_COL, nb_participants).setFontColor( '#1155cc' ); // #1155cc => default links color

  set_participants_stats_rules( _sheet, participants_range );
}

function set_participants_stats_rules( _sheet, _range )
{
  Logger.log( "Adding format rules to participants table..." );

  const rules = _sheet.getConditionalFormatRules();

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
  _sheet.setConditionalFormatRules( rules );
  _range.setHorizontalAlignment( "center" );

  Logger.log( "All rules added!" );
}
