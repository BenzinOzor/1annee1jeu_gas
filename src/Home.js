function is_name_already_in_table( _home_sheet, _name )
{
  return get_participant_table_row( _home_sheet, _name ) >= 0;
}

function get_participant_table_row( _home_sheet, _name )
{
  if( _name.length == 0 )
  {
    return -1;
  }
  
  var data = _home_sheet.getRange( get_column_letter( HOME_PARTICIPANTS_COL ) + HOME_PARTICIPANTS_FIRST_ROW + ':' + get_column_letter( HOME_PARTICIPANTS_COL ) ).getValues();

  var data_row = 0;

  for( ; data_row < data.length; ++data_row )
  {
    if( data[ data_row ][ 0 ] == _name )
    {
      return HOME_PARTICIPANTS_FIRST_ROW + data_row;
    }
  }

  return -1;
}

function get_first_empty_row( _home_sheet, _column, _first_row )
{
  var data = _home_sheet.getRange( get_column_letter( _column ) + _first_row + ':' + get_column_letter( _column ) ).getValues();

  var data_row = 0;

  for( ; data_row < data.length; ++data_row )
  {
    if( data[ data_row ][ 0 ] == "" )
    {
      return _first_row + data_row;
    }
  }

  return _first_row;
}

/* **********************************************************
*  Helper function providing the participant range in which we look for the games status.
*/
function get_participant_status_range( _participant_sheet, _first_row, _nb_rows )
{
  const participant_name = _participant_sheet.getName();

  return participant_name + "!A" + _first_row + ":A" + (_first_row + _nb_rows);
}

/* **********************************************************
*  Helper function providing the participant range in which we look for the currently played game.
*/
function get_participant_game_lookup_range( _participant_sheet, _first_row, _nb_rows )
{
  const participant_name = _participant_sheet.getName();

  return participant_name + "!A" + _first_row + ":C" + (_first_row + _nb_rows);
}

/* **********************************************************
*  Helper function providing the formula that counts a given status text.
*/
function get_status_count_formula( _range, _status )
{
  return 'countif(indirect("' + _range + '");"' + _status + '")';
}

function get_finished_games_formula( _participant_sheet, _first_row, _nb_rows )
{
  const participant_range = get_participant_status_range( _participant_sheet, _first_row, _nb_rows );

  return "=" + get_status_count_formula( participant_range, GameState.Done ) + " + " + get_status_count_formula( participant_range, GameState.Abandoned );
}

/* **********************************************************
*  Fill the finished games column. We have to be careful to check that we might have more rows to count than the age of the user.
*/
function finished_games_column( _home_sheet, _participant_sheet, _row )
{
  Logger.log( "Filling finished games column..." );
  // First we find where the table begins.
  const completion_header_row = get_header_row( _participant_sheet, "A:A", MODEL_STATE_COL_NAME );
  // Then we determine how many rows there are in the participant table.
  // We send completion_header_row + 1 because we want to give the first valid row after the header.
  const nb_rows = get_number_of_rows( _participant_sheet, completion_header_row + 1 );

  // Now that we gathered all the informations we need, we can begin to fill the cell with the formula.
  _home_sheet.getRange( _row, HOME_FINISHED_GAMES_COL ).setValue( get_finished_games_formula( _participant_sheet, completion_header_row + 1, nb_rows ) );

  var sheet_infos = { header_row: completion_header_row, nb_rows: nb_rows };
  return sheet_infos;
}

/* **********************************************************
*  Looks for birth year and season in the participant sheet year column. It's not necessarily the first and last year since the order can change.
*/
function get_birth_year_and_season( _participant_sheet, _first_year_row, _nb_rows )
{
  Logger.log( "Retrieving birth year and season from participant sheet..." );
  // We increment _year_header_row to start at the first line under the header.
  var data = _participant_sheet.getRange( "B" + _first_year_row + ":B" ).getValues();
  
  // To find the birth year and the season, we'll look for the smallest and highest numbers in the year column.
  // Looking at the first and last might not suffise as the participant may have changed the order by sorting their table with an other parameter than the year.
  var birth_year = 9999;
  var season = 1;

  for( var row = 0; row < _nb_rows; ++row )
  {
   if( data[ row ][ 0 ] < birth_year )
    {
      birth_year = data[ row ][ 0 ];
    }

    if( data[ row ][ 0 ] > season )
    {
      season = data[ row ][ 0 ];
    }
  }

  Logger.log( "Birth year: %d - Season: %d", birth_year, season );
  var years = {_birth_year: birth_year, _season: season};
  return years;
}

/* **********************************************************
*  Fill the games to finish column. We have to be careful to check that we might have more rows to count than the age of the user.
*/
function games_to_finish_column( _home_sheet, _participant_sheet, _row, _sheet_infos )
{
  Logger.log( "Filling games to finish column..." );
  // We have to determine the birth year of the participant and the season they're participating in.
  var years = get_birth_year_and_season( _participant_sheet, _sheet_infos.header_row + 1, _sheet_infos.nb_rows );

  // We can't put a dynamic formula here, because the first year readable in the participant table can change if they reorder it.
  // Birth year could be the first row, it could be the 15th
  // So we're just gonna put the result of our calculation in the cell. It's pretty constant anyway as it should only change for a new season, at which point we'd do a new scan and replace the values.
  var range = _home_sheet.getRange( _row, HOME_GAMES_TO_FINISH_COL );

  const participant_range = get_participant_status_range( _participant_sheet, _sheet_infos.header_row + 1, _sheet_infos.nb_rows );

  range.setValue( "=" + (years._season - years._birth_year + 1) + " - " + get_status_count_formula( participant_range, GameState.Ignored ) );
}

/* **********************************************************
*  Fill the progression bar column. We just have to use what we gathered in the two previous columns.
*/
function progression_bar_column( _home_sheet, _row )
{
  Logger.log( "Filling progression bar column..." );
  const finished_games_string = get_column_letter(HOME_FINISHED_GAMES_COL) + _row;
  const games_to_finish_string = get_column_letter(HOME_GAMES_TO_FINISH_COL) + _row;
  
  var sparkline = '=sparkline({' + finished_games_string + ';' + games_to_finish_string + '};';
  sparkline += '{"charttype"\\"bar";"max"\\' + games_to_finish_string + ';"min"\\0;"color1"\\"green";';
  sparkline += '"color2"\\if(' + finished_games_string + '=0;"efefef";"dddddd")})';

  _home_sheet.getRange( _row, HOME_PROGRESSION_BAR_COL ).setValue( sparkline );
}

/* **********************************************************
*  Fill the current game column. Like the progression bar column, we use what we gathered in the finished games and games to finish columns.
*/
function current_game_column( _home_sheet, _participant_sheet, _row, _sheet_infos )
{
  Logger.log( "Filling current game column..." );
  const participant_status_range = get_participant_status_range( _participant_sheet, _sheet_infos.header_row + 1, _sheet_infos.nb_rows );
  const participant_lookup_range = get_participant_game_lookup_range( _participant_sheet, _sheet_infos.header_row + 1, _sheet_infos.nb_rows );
  
  var range = _home_sheet.getRange( _row, HOME_CURRENT_GAME_COL );
  
  var formula = '=if(' + get_column_letter(HOME_FINISHED_GAMES_COL) + _row + '=' + get_column_letter(HOME_GAMES_TO_FINISH_COL) + _row + ';"🎉 Liste terminée! 🎉";';  // If the list is finished, display a special text.
  formula += 'if(countif(indirect("' + participant_status_range + '");"En cours")=0;"<Pas de jeu en cours>";';   // Else, if no current game, display an other special text.
  formula += 'vlookup("En cours";indirect("' + participant_lookup_range + '");3;false)))';                        // Otherwise display the game currently played.
  
  range.setValue( formula );
}

function add_participant_info_to_table( _home_sheet, _participant_sheet, _row )
{
  if( is_sheet_name_valid( _participant_sheet ) == false )
  {
    return false;
  }

  Logger.log( "Adding participant to the list: %s", _participant_sheet.getName() );

  // Putting the name and a link to the sheet in the cell
  const richText = SpreadsheetApp.newRichTextValue()
                   .setText( _participant_sheet.getName() )
                   .setLinkUrl( "#gid=" + _participant_sheet.getSheetId() )
                   .build();

  _home_sheet.getRange( _row, HOME_PARTICIPANTS_COL ).setRichTextValue(richText);

  const sheet_infos = finished_games_column( _home_sheet, _participant_sheet, _row );

  games_to_finish_column( _home_sheet, _participant_sheet, _row, sheet_infos );
  progression_bar_column( _home_sheet, _row );
  current_game_column( _home_sheet, _participant_sheet, _row, sheet_infos );

  return true;
}

/* **********************************************************
*  Fill the home page participants list with all existing sheets names.
*/
function gather_participants()
{
  Logger.log( "Refreshing all participants in home sheet list." );
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  var home_sheet = ss.getSheetByName( HOME_SHEET_NAME );

  // Clearing old participants data from table first row to last row with data
  // It could mean that we clear more than necessary if there are more rows with data somewhere on the side but we don't plan to have anything under ther participants list so it doesn't really matter.
  home_sheet.getRange( HOME_PARTICIPANTS_FIRST_ROW, HOME_PARTICIPANTS_COL, home_sheet.getLastRow() - HOME_PARTICIPANTS_FIRST_ROW + 1, HOME_PARTICIPANTS_TABLE_WIDTH ).clear();  // This doesn't clear comments for some reason.

  var row = HOME_PARTICIPANTS_FIRST_ROW;
  var sheets = ss.getSheets();

  Logger.log( "%d sheets found in the spreadsheet.", sheets.length );

  // For each existing sheet, we're gonna add a row in the table and gather their stats
  sheets.forEach( function(sheet)
  {
    if( add_participant_info_to_table( home_sheet, sheet, row ) )
    {
      ++row;
    }
  });

  const nb_stats_rows = row - HOME_PARTICIPANTS_FIRST_ROW;
  Logger.log( "%d participants added to the table.", nb_stats_rows );

  // Setting center alignment for all the range we just filled
  set_participants_stats_rules( home_sheet, home_sheet.getRange( HOME_PARTICIPANTS_FIRST_ROW, HOME_PARTICIPANTS_COL, nb_stats_rows, HOME_PARTICIPANTS_TABLE_WIDTH ) );
}

/* **********************************************************
*  Check if every person listed in the table still has a page and if all the people having a page are in the table.
*/
function refresh_participants_list()
{
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let home_sheet = ss.getSheetByName( HOME_SHEET_NAME );
  
  const last_row_before_refresh = get_first_empty_row( home_sheet, HOME_PARTICIPANTS_COL, HOME_PARTICIPANTS_FIRST_ROW );

  remove_deleted_pages_from_table();
  add_missing_participants_to_table();
  
  const last_row_after_refresh = get_first_empty_row( home_sheet, HOME_PARTICIPANTS_COL, HOME_PARTICIPANTS_FIRST_ROW );

  if( last_row_after_refresh < last_row_before_refresh )
  {
    home_sheet.getRange( last_row_after_refresh, HOME_PARTICIPANTS_COL, last_row_before_refresh - last_row_after_refresh, HOME_PARTICIPANTS_TABLE_WIDTH ).clear();
  }

  reset_participants_stats_rules( home_sheet );
}

/* **********************************************************
*  Remove from the home table the pages that have been deleted.
*/
function remove_deleted_pages_from_table()
{
  Logger.log( "Removing deleted pages from table..." );
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheets = ss.getSheets();
  let home_sheet = ss.getSheetByName( HOME_SHEET_NAME );
  let nb_removed_participants = 0;

  const participants_col_letter = get_column_letter( HOME_PARTICIPANTS_COL );
  
  const last_row = get_first_empty_row( home_sheet, HOME_PARTICIPANTS_COL, HOME_PARTICIPANTS_FIRST_ROW );
  let data = home_sheet.getRange( participants_col_letter + HOME_PARTICIPANTS_FIRST_ROW + ':' + participants_col_letter + last_row ).getValues();
  const nb_participants = data.filter( String ).length;

  let data_row = 0;
  let participant_row = HOME_PARTICIPANTS_FIRST_ROW;

  while( data_row < data.length )
  {
    let sheet_found = false;

    Logger.log( "Checking if '%s' (%d) still exists...", data[ data_row ][ 0 ], data_row );

    sheets.every( function( sheet )
    {
      if( data[ data_row ][ 0 ] == "" )
      {
        Logger.log( "Current line is empty, removing" );
        sheet_found = true;
        return false;
      }

      if( data[ data_row ][ 0 ] == sheet.getName() )
      {
        Logger.log( "'%s' found ! Moving on.", data[ data_row ][ 0 ] );
        sheet_found = true;
        return false;
      }

      return true;
    });

    if( sheet_found == false )
    {
      Logger.log( "'%s' not found ! Removing line %d.", data[ data_row ][ 0 ], participant_row );
      home_sheet.getRange( participant_row + 1, HOME_PARTICIPANTS_COL, nb_participants, HOME_PARTICIPANTS_TABLE_WIDTH ).moveTo( home_sheet.getRange( participant_row, HOME_PARTICIPANTS_COL ) );
    }
    else
      ++participant_row;

    ++data_row;
  }
}

/* **********************************************************
*  Add the participants that weren't already in the list to the home page
*/
function add_missing_participants_to_table()
{
  Logger.log( "Adding missing participants to home sheet list." );
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var home_sheet = ss.getSheetByName( HOME_SHEET_NAME );
  var nb_added_participants = 0;
  var first_free_row = 0;

  sheets.forEach( function(sheet)
  {
    if( is_name_already_in_table( home_sheet, sheet.getName() ) )
    {
      return;
    }

    first_free_row = get_first_empty_row( home_sheet, HOME_PARTICIPANTS_COL, HOME_PARTICIPANTS_FIRST_ROW );

    if( add_participant_info_to_table( home_sheet, sheet, first_free_row ) )
    {
      ++nb_added_participants;
    }
  });

  Logger.log( "%d participants added to the table.", nb_added_participants );
}

/* **********************************************************
*  Add a single participant to the home table
*/
function add_participant_to_table_from_sheet( _participant_sheet, _check_participant_presence )
{
  if( is_sheet_name_valid( _participant_sheet ) == false )
  {
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let home_sheet = ss.getSheetByName( HOME_SHEET_NAME );

  if( _check_participant_presence )
  {
    // If we want to check if the participant is already in the table, we'll retrieve their row.
    let _participant_row_index = get_participant_table_row( home_sheet, _participant_sheet.getName() );

    // If we retrieved a valid row, it means the participant is already in the table and we only need to update their games to finish formula.
    if( _participant_row_index >= 0 )
    {
      refresh_participant_line( _participant_sheet, _participant_row_index );
      return;
    }
  }

  
  let first_free_row = get_first_empty_row( home_sheet, HOME_PARTICIPANTS_COL, HOME_PARTICIPANTS_FIRST_ROW );
  
  Logger.log( "Adding '%s' to home participants list...", _participant_sheet.getName() );

  if( add_participant_info_to_table( home_sheet, _participant_sheet, first_free_row ) )
  {
    Logger.log( "'%s' added!", _participant_sheet.getName() );
    set_participants_stats_rules( home_sheet, home_sheet.getRange( first_free_row, HOME_PARTICIPANTS_COL, 1, HOME_PARTICIPANTS_TABLE_WIDTH ) );
  }
}

function add_participant_to_table_from_current_sheet()
{
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  add_participant_to_table_from_sheet( ss.getActiveSheet(), true );
}

/* **********************************************************
*  Refresh the participant line in the table by updating the formula returning the game they have to finish.
*  As the count of game is calculated via script and the tables can change order, the number can't be determined by formluaes, so we have to update it sometimes.
*/
function refresh_participant_line( _participant_sheet, _participant_row_index = -1 )
{
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let home_sheet = ss.getSheetByName( HOME_SHEET_NAME );

  // If we already have the participant row, there is no need for all those verifications.
  if( _participant_row_index < 0 )
  {
    if( is_sheet_name_valid( _participant_sheet ) == false )
    {
      return;
    }

    _participant_row_index = get_participant_table_row( home_sheet, _participant_sheet.getName() );

    // If the participant isn't in the table already, add them.
    if( _participant_row_index < 0 )
    {
      add_participant_to_table_from_sheet( _participant_sheet, false );
      return;
    }
  }

  // Last verification in case something went wrong above, or a bad index was given.
  if( home_sheet.getRange( _participant_row_index, HOME_PARTICIPANTS_COL ).getValue() != _participant_sheet.getName() )
    return;

  const sheet_infos = finished_games_column( home_sheet, _participant_sheet, _participant_row_index );

  games_to_finish_column( home_sheet, _participant_sheet, _participant_row_index, sheet_infos );
}
