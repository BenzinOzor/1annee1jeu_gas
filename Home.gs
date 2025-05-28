const HOME_SHEET_NAME = "🏠Accueil";
const HOME_PARTICIPANTS_FIRST_ROW = 9;
const HOME_PARTICIPANTS_TABLE_WIDTH = 5;
const HOME_PARTICIPANTS_COL = 1;
const HOME_FINISHED_GAMES_COL = 2;


/* **********************************************************
*  Find where the completion column starts, in case the user moved their table vertically.
*/
function get_completion_header_row( _participant_sheet )
{
  var data = _participant_sheet.getRange( "A:A" ).getValues();

  completion_header_row = 0;

  for( ; completion_header_row < data.length; ++completion_header_row )
  {
    if( data[ completion_header_row ][ 0 ] == "Complétion" )
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
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  home_sheet = ss.getSheetByName( HOME_SHEET_NAME );

  // We increment _completion_header_row to start at the first line under the header.
  var data = _participant_sheet.getRange( "A" + ( _completion_header_row + 1 ) + ":A" ).getValues();
  home_sheet.getRange( 1, 6 ).setValue( data.length );
  nb_rows = 0;

  for( ; nb_rows < data.length; ++nb_rows )
  {
    home_sheet.getRange( 1, 7 ).setValue( data[ nb_rows ][ 0 ] );
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
  participant_name = _participant_sheet.getName();

  return participant_name + "!A" + _first_row + ":A" + (_first_row + _nb_rows);
}

/* **********************************************************
*  Helper function providing the formula that counts a given status text.
*/
function get_finished_games_formula( _participant_sheet, _first_row, _nb_rows )
{
  participant_range = get_participant_status_range( _participant_sheet, _first_row, _nb_rows );

  return "=countif(indirect(\"" + participant_range + "\");\"Terminé\") + countif(indirect(\"" + participant_range + "\");\"Abandonné\")";
}

/* **********************************************************
*  Fill the finished games column. We have to be careful to check that we might have more rows to count than the age of the user.
*/
function finished_games_column( _home_sheet, _participant_sheet, _row )
{
  // First we find where the table begins.
  completion_header_row = get_completion_header_row( _participant_sheet );
  // Then we determine how many rows there are in the participant table.
  // We send completion_header_row + 1 because the index we got starts at 0 and we will use it in a get range, that starts at 1.
  nb_rows = get_number_of_rows( _participant_sheet, completion_header_row + 1 );

  // Now that we gathered all the informations we need, we can begin to fill the cell with the formula.
  _home_sheet.getRange( _row, HOME_FINISHED_GAMES_COL ).setValue( get_finished_games_formula( _participant_sheet, completion_header_row + 1, nb_rows ) );
}

/* **********************************************************
*  Fill the home page participants list with all existing sheets names.
*/
function gather_participants()
{
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  home_sheet = ss.getSheetByName( HOME_SHEET_NAME );

  // Clearing old participants data from table first row to last row with data
  // It could mean that we clear more than necessary if there are more rows with data somewhere on the side but we don't plan to have anything under ther participants list so it doesn't really matter.
  home_sheet.getRange( HOME_PARTICIPANTS_FIRST_ROW, HOME_PARTICIPANTS_COL, home_sheet.getLastRow() - HOME_PARTICIPANTS_FIRST_ROW + 1, HOME_PARTICIPANTS_TABLE_WIDTH ).clear( { contentsOnly: true, commentsOnly: true } );

  row = HOME_PARTICIPANTS_FIRST_ROW;
  sheets = ss.getSheets();

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

    finished_games_column( home_sheet, sheet, row );
    /*
    //=countif(INDIRECT(CONCATENATE(A{20};"!A{7}:A";{7}+C{20}));"Terminé") + countif(INDIRECT(CONCATENATE(A20;"!A7:A";6+C20));"Abandonné")
    */
    ++row;
  });

  // Setting center alignment for all the range we just filled
  home_sheet.getRange( HOME_PARTICIPANTS_FIRST_ROW, HOME_PARTICIPANTS_COL, row - HOME_PARTICIPANTS_FIRST_ROW + 1, HOME_PARTICIPANTS_TABLE_WIDTH ).setHorizontalAlignment( "center" );
}
