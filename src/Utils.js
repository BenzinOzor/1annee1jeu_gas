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
*  Find where the table starts, in case the user moved it vertically.
*  Return the row of the given header starting at 1. 0 if not found.
*/
function get_header_row( _participant_sheet, _range, _title )
{
  const data_range = _participant_sheet.getRange( _range );
  let data = data_range.getValues();

  let header_row = 0;

  for( ; header_row < data.length; ++header_row )
  {
    if( data[ header_row ][ 0 ] == _title )
    {
      return data_range.getRow() + header_row;
    }
  }

  return 0;
}

/* **********************************************************
*  Helper function that returns the index of the given column, starting at 0.
*/
function get_column_data_index( _sheet, _name, _row )
{
  if( _name.length == 0 )
  {
    return -1;
  }
  
  let data = _sheet.getRange( _row + ':' + _row ).getValues();
  let data_col = 0;

  // We don't want to check endlessly, if the name wasn't in the first 20 columns, we consider it never will.
  for( ; data_col < 20; ++data_col )
  {
    if( data[ 0 ][ data_col ] == _name )
    {
      return data_col;
    }
  }

  return -1;
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
function get_number_of_rows( _participant_sheet, _first_row )
{
  var data = _participant_sheet.getRange( "A" + _first_row + ":A" ).getValues();
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
