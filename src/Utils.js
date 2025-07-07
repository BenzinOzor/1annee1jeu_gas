function idOf( _letter_index )
{
  return (
    (_letter_index >= 26 ? idOf( ( (_letter_index / 26) >> 0 ) - 1 ) : "" ) +
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[ _letter_index % 26 >> 0 ]
  );
}

function get_column_letter( _column_number )
{
  return idOf( _column_number - 1 );
}

/* **********************************************************
*  Find where the completion column starts, in case the user moved their table vertically.
*/
function get_header_row( _participant_sheet, _range, _title )
{
  var data = _participant_sheet.getRange( _range ).getValues();

  var completion_header_row = 0;

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
  switch( _string )
  {
    case GAME_STATE_NOT_STARTED:
    case GAME_STATE_PLAYING:
    case GAME_STATE_DONE:
    case GAME_STATE_ABANDONED:
    case GAME_STATE_REMPLACED:
    case GAME_STATE_IGNORED:
    {
      return true;
    }
    default:
      return false;
  }
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
*  Check if the given name is valid. We don't want to manage home and model page (adding those to the participants table for example)
*  so having those names will be considered invalid.
*/
function is_sheet_name_valid( _sheet )
{
    if( (_sheet.getName() == HOME_SHEET_NAME) || (_sheet.getName().indexOf( "Modèle" ) > 0) )
    {
      return false;
    }

    return true;
}
