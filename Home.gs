const HOME_SHEET_NAME = "🏠Accueil";

const HOME_PARTICIPANTS_FIRST_ROW = 9;
const HOME_PARTICIPANTS_TABLE_WIDTH = 5;
const HOME_PARTICIPANTS_COL = 1;
const HOME_FINISHED_GAMES_COL = 2;
const HOME_GAMES_TO_FINISH_COL = 3;
const HOME_PROGRESSION_BAR_COL = 4;
const HOME_CURRENT_GAME_COL = 5;


/* **********************************************************
*  Find where the completion column starts, in case the user moved their table vertically.
*/
function get_header_row( _participant_sheet, _range, _title )
{
  var data = _participant_sheet.getRange( _range ).getValues();

  completion_header_row = 0;

  for( ; completion_header_row < data.length; ++completion_header_row )
  {
    if( data[ completion_header_row ][ 0 ] == _title )
    {
      return completion_header_row;
    }
  }

  return 0;
}

/* **********************************************************
*  Helper function indicating if the given string is a completion status text.
*/
function is_completion_status( _string )
{
  if( _string == "Pas commencé" || _string == "En cours" || _string == "Terminé" || _string == "Abandonné" || _string == "Remplacé" )
  {
    return true;
  }

  return false;
}

/* **********************************************************
*  Count the number of rows in the user table. It can vary from the strict season - birth year if some lines have been added in case of game replacement for example.
*/
function get_number_of_rows( _participant_sheet, _completion_header_row )
{
  // We increment _completion_header_row to start at the first line under the header.
  var data = _participant_sheet.getRange( "A" + ( _completion_header_row + 1 ) + ":A" ).getValues();
  var nb_rows = 0;

  for( ; nb_rows < data.length; ++nb_rows )
  {
    // We check if there is a status text in the cell. We can't just check if the cell is empty in case the user customised something under their table.
    if( is_completion_status( data[ nb_rows ][ 0 ] ) == false )
    {
      // As soon as we find something that's not a status, we assume we arrived at the end of the table and have our number of rows/games.
      return nb_rows;
    }    
  }

  return nb_rows;
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
function get_finished_games_formula( _participant_sheet, _first_row, _nb_rows )
{
  const participant_range = get_participant_status_range( _participant_sheet, _first_row, _nb_rows );

  return "=countif(indirect(\"" + participant_range + "\");\"Terminé\") + countif(indirect(\"" + participant_range + "\");\"Abandonné\")";
}

/* **********************************************************
*  Fill the finished games column. We have to be careful to check that we might have more rows to count than the age of the user.
*/
function finished_games_column( _home_sheet, _participant_sheet, _row )
{
  // First we find where the table begins.
  const completion_header_row = get_header_row( _participant_sheet, "A:A", "Complétion" );
  // Then we determine how many rows there are in the participant table.
  // We send completion_header_row + 1 because the index we got starts at 0 and we will use it in a get range, that starts at 1.
  const nb_rows = get_number_of_rows( _participant_sheet, completion_header_row + 1 );

  // Now that we gathered all the informations we need, we can begin to fill the cell with the formula.
  _home_sheet.getRange( _row, HOME_FINISHED_GAMES_COL ).setValue( get_finished_games_formula( _participant_sheet, completion_header_row + 1, nb_rows ) );

  var sheet_infos = { header_row: completion_header_row, nb_rows: nb_rows };
  return sheet_infos;
}

/* **********************************************************
*  Count the number of rows in the user table. It can vary from the strict season - birth year if some lines have been added in case of game replacement for example.
*/
function get_birth_year_and_season( _participant_sheet, _year_header_row, _nb_rows )
{
  // We increment _year_header_row to start at the first line under the header.
  var data = _participant_sheet.getRange( "B" + ( _year_header_row + 1 ) + ":B" ).getValues();
  
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

  var years = {_birth_year: birth_year, _season: season};
  return years;
}

/* **********************************************************
*  Fill the games to finish column. We have to be careful to check that we might have more rows to count than the age of the user.
*/
function games_to_finish_column( _home_sheet, _participant_sheet, _row, _sheet_infos )
{
  // We have to determine the birth year of the participant and the season they're participating in.
  var years = get_birth_year_and_season( _participant_sheet, _sheet_infos.header_row + 1, _sheet_infos.nb_rows );

  // We can't put a dynamic formula here, because the first year readable in the participant table can change if they reorder it.
  // Birth year could be the first row, it could be the 15th
  // So we're just gonna put the result of our calculation in the cell. It's pretty constant anyway as it should only change for a new season, at which point we'd do a new scan and replace the values.
  var range = _home_sheet.getRange( _row, HOME_GAMES_TO_FINISH_COL );
  range.setValue( years._season - years._birth_year + 1 );
  range.setNote( "Saison " + years._season );
}

/* **********************************************************
*  Fill the progression bar column. We just have to use what we gathered in the two previous columns.
*/
function progression_bar_column( _home_sheet, _row )
{
  _home_sheet.getRange( _row, HOME_PROGRESSION_BAR_COL ).setValue( "=sparkline(B" + _row + ';{"charttype"\\"bar";"max"\\C' + _row + ';"min"\\0;"color1"\\"green"})' );
  _home_sheet.getRange( _row, HOME_PROGRESSION_BAR_COL ).setNumberFormat( "[h]:mm:ss" );
}

/* **********************************************************
*  Fill the current game column. Like the progression bar column, we use what we gathered in the finished games and games to finish columns.
*/
function current_game_column( _home_sheet, _participant_sheet, _row, _sheet_infos )
{
  const participant_status_range = get_participant_status_range( _participant_sheet, _sheet_infos.header_row + 1, _sheet_infos.nb_rows );
  const participant_lookup_range = get_participant_game_lookup_range( _participant_sheet, _sheet_infos.header_row + 1, _sheet_infos.nb_rows );
  var range = _home_sheet.getRange( _row, HOME_CURRENT_GAME_COL );
  range.setValue( '=if(countif(indirect("' + participant_status_range + '");"En cours")=0;"<Pas de jeu en cours>";vlookup("En cours";indirect("' + participant_lookup_range + '");3;false))' );
}

/* **********************************************************
*  Fill the home page participants list with all existing sheets names.
*/
function gather_participants()
{
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  var home_sheet = ss.getSheetByName( HOME_SHEET_NAME );

  // Clearing old participants data from table first row to last row with data
  // It could mean that we clear more than necessary if there are more rows with data somewhere on the side but we don't plan to have anything under ther participants list so it doesn't really matter.
  home_sheet.getRange( HOME_PARTICIPANTS_FIRST_ROW, HOME_PARTICIPANTS_COL, home_sheet.getLastRow() - HOME_PARTICIPANTS_FIRST_ROW + 1, HOME_PARTICIPANTS_TABLE_WIDTH ).clear( { contentsOnly: true, commentsOnly: true } );

  var row = HOME_PARTICIPANTS_FIRST_ROW;
  var sheets = ss.getSheets();

  // For each existing sheet, we're gonna add a row in the table and gather their stats
  sheets.forEach( function(sheet)
  {
    if( (sheet.getName() == HOME_SHEET_NAME) || (sheet.getName() == MODEL_SHEET_NAME) )
    {
      return;
    }

    // Putting the name and a link to the sheet in the cell
    const richText = SpreadsheetApp.newRichTextValue()
                     .setText( sheet.getName() )
                     .setLinkUrl( "#gid=" + sheet.getSheetId() )
                     .build();
    home_sheet.getRange( row, HOME_PARTICIPANTS_COL ).setRichTextValue(richText);

    const sheet_infos = finished_games_column( home_sheet, sheet, row );
    games_to_finish_column( home_sheet, sheet, row, sheet_infos );
    progression_bar_column( home_sheet, row );
    current_game_column( home_sheet, sheet, row, sheet_infos );
    ++row;
  });

  // Setting center alignment for all the range we just filled
  home_sheet.getRange( HOME_PARTICIPANTS_FIRST_ROW, HOME_PARTICIPANTS_COL, row - HOME_PARTICIPANTS_FIRST_ROW + 1, HOME_PARTICIPANTS_TABLE_WIDTH ).setHorizontalAlignment( "center" );
}
