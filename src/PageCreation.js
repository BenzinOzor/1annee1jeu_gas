/* **********************************************************
*  Opens the page creation popup when someone wants to join
*/
function creation_popup()
{
  var html = HtmlService.createHtmlOutputFromFile('page_creation_box')
    .setWidth(400)
    .setHeight(400);
  SpreadsheetApp.getUi().showModalDialog(html,'Nouvelle page');
}

/* **********************************************************
*  Helper function that adds a named column after the given one and returns the new column id
*/
function add_column( sheet, preceding_column, name )
{
  const new_column = preceding_column + 1;
  sheet.insertColumnAfter( preceding_column );
  sheet.getRange( MODEL_TABLE_HEADER_ROW, new_column ).setValue( name );
  return new_column;
}

function get_number_of_columns( _participant_sheet )
{
  let data = _participant_sheet.getRange( MODEL_TABLE_HEADER_ROW + ':' + MODEL_TABLE_HEADER_ROW ).getValues();
  let data_col = 0;

  for( ; data_col < 50; ++data_col )
  {
    if( data[ 0 ][ data_col ] == "" )
    {
      break;
    }
  }

  return data_col;
}

/* **********************************************************
*  Helper function that indicates whether a given column already exist in the sheet or not.
*/
function does_column_exist( _sheet, _name )
{
  return get_column_index( _sheet, _name ) >= 0;
}

/* **********************************************************
*  Helper function that returns the index of the given column.
*/
function get_column_index( _sheet, _name )
{
  if( _name.length == 0 )
  {
    return -1;
  }
  
  let data = _sheet.getRange( MODEL_TABLE_HEADER_ROW + ':' + MODEL_TABLE_HEADER_ROW ).getValues();
  let data_col = 0;

  // We don't want to check endlessly, if the name wasn't in the first 20 columns, we consider it never will.
  for( ; data_col < 20; ++data_col )
  {
    if( data[ 0 ][ data_col ] == _name )
    {
      return data_col + 1;
    }
  }

  return -1;
}

/* **********************************************************
*  Remove the given column from the newly created page, if it exists
*/
function remove_column( _sheet, _remove_column, _column_name )
{
  if( _remove_column == false )
    return;

  let column_index = get_column_index( _sheet, _column_name );

  if( column_index < 0 )
    return;

  _sheet.deleteColumn( column_index );
  Logger.log( "Removed column '%s'.", _column_name );
}

/* **********************************************************
*  Remove all the columns that the user unchecked in the page creation popup
*/
function remove_unwanted_columns( _sheet, _params )
{
  Logger.log( "Removing unwanted columns..." );

  remove_column( _sheet, _params.estimate == false && _params.delta == false, MODEL_ESTIMATE_COL_NAME );
  remove_column( _sheet, _params.played == false && _params.delta == false, MODEL_PLAYED_COL_NAME );
  remove_column( _sheet, _params.delta == false, MODEL_DELTA_COL_NAME );
  remove_column( _sheet, _params.rating == false, MODEL_RATING_COL_NAME );
  remove_column( _sheet, _params.verdict == false, MODEL_VERDICT_COL_NAME );
}

/* **********************************************************
*  Add all the columns selected by the user in the new table
*/
function add_columns( sheet, params )
{
  Logger.log( "Adding columns..." );

  var column = MODEL_TABLE_VERSION_COL;

  if( ( params.estimate || params.delta ) && does_column_exist( sheet, MODEL_ESTIMATE_COL_NAME ) == false )
  {
    column = add_column( sheet, column, MODEL_ESTIMATE_COL_NAME );
    sheet.getRange( MODEL_TABLE_HEADER_ROW, column ).setNote( "Estimation du temps que prendra le jeu, format hh:mm:ss" );
    var new_range = sheet.getRange( MODEL_TABLE_FIRST_ROW, column );
    new_range.setNumberFormat( "[h]:mm:ss" );

    Logger.log( "Added column: " + MODEL_ESTIMATE_COL_NAME );
  }
  if( ( params.played || params.delta ) && does_column_exist( sheet, MODEL_PLAYED_COL_NAME ) == false )
  {
    column = add_column( sheet, column, MODEL_PLAYED_COL_NAME );
    sheet.getRange( MODEL_TABLE_HEADER_ROW, column ).setNote( "Temps passé sur le jeu, format hh:mm:ss" );
    var new_range = sheet.getRange(MODEL_TABLE_FIRST_ROW, column );
    new_range.setNumberFormat("[h]:mm:ss");
    
    Logger.log( "Added column: " + MODEL_PLAYED_COL_NAME );
  }
  if( params.delta && does_column_exist( sheet, MODEL_DELTA_COL_NAME ) == false )
  {
    column = add_column( sheet, column, MODEL_DELTA_COL_NAME );
    sheet.getRange( MODEL_TABLE_HEADER_ROW, column ).setNote( "Différence entre le temps passé et l'estimation, rempli automatiquement quand le jeu est terminé" );
    var new_range = sheet.getRange(MODEL_TABLE_FIRST_ROW, column );
    new_range.setNumberFormat("[h]:mm:ss");
    new_range.setValue( '=if(A' + MODEL_TABLE_FIRST_ROW + ' = "Terminé";if(isblank(H' + MODEL_TABLE_FIRST_ROW + ');;H' + MODEL_TABLE_FIRST_ROW + ' - G' + MODEL_TABLE_FIRST_ROW + ');)' );

    Logger.log( "Added column: " + MODEL_DELTA_COL_NAME );
  }
  if( params.rating && does_column_exist( sheet, MODEL_RATING_COL_NAME ) == false )
  {
    column = add_column( sheet, column, MODEL_RATING_COL_NAME );
    
    Logger.log( "Added column: " + MODEL_RATING_COL_NAME );
  }
  if( params.verdict && does_column_exist( sheet, MODEL_VERDICT_COL_NAME ) == false )
  {
    let commentary_col = get_column_index( sheet, "Commentaire" );
    column = add_column( sheet, commentary_col + 1, MODEL_VERDICT_COL_NAME );
    
    Logger.log( "Added column: " + MODEL_VERDICT_COL_NAME );
  }
}

/* **********************************************************
*  Add the necessary number of rows to the table according to birth year and season number
*/
function add_rows( sheet, params )
{
  Logger.log( "Adding rows..." );
  sheet.getRange(MODEL_TABLE_FIRST_ROW, MODEL_TABLE_YEAR_COL).setValue( params.birth_year );
  const nb_columns = get_number_of_columns( sheet );
  const model_range = sheet.getRange( MODEL_TABLE_FIRST_ROW, 1, 1, nb_columns );

  var row = MODEL_TABLE_FIRST_ROW + 1;
  var year = sheet.getRange( MODEL_TABLE_FIRST_ROW, MODEL_TABLE_YEAR_COL ).getValue() + 1;

  for(; year <= params.season; ++year, ++row )
  {
    model_range.copyTo( sheet.getRange( row, 1 ) );
    sheet.getRange( row, MODEL_TABLE_YEAR_COL ).setValue( year );
  }

  sheet.setRowHeightsForced( MODEL_TABLE_FIRST_ROW, row - MODEL_TABLE_FIRST_ROW, DEFAULT_ROW_HEIGHT );
  Logger.log( "Added %d rows.", row - MODEL_TABLE_FIRST_ROW );
}

/* **********************************************************
*  New page creation function, called from the new page popup
*/
function create_new_page( params )
{
  /*const params = {
    pseudo: "Bobby",
    season: 2025,
    birth_year: 2003,
    estimate: false,
    played: false,
    delta: true,
    rating: true,
    verdict: true
  }*/

SpreadsheetApp.flush();
     var lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000); 
     } catch (e) {
        Logger.log('Could not obtain lock after 5seconds.');
        //return HtmlService.createHtmlOutput("<b> Server Busy please try after some time <p>")
        // In case this a server side code called asynchronously you return a error code and display the appropriate message on the client side
        return "Error: Server busy try again later... Sorry :("
     }

  Logger.log( 'Received informations from html popup. User "%s" wants to create a list going from %d to %d.', params.pseudo, params.birth_year, params.season );
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const model_sheet = ss.getSheetByName( MODEL_SHEET_NAME );

  if( ss.getSheetByName( params.pseudo ) != null )
  {
    Logger.log( "Une feuille avec ce nom existe déjà!" );
    return;
  }

  var new_sheet = model_sheet.copyTo(ss);
  ss.setActiveSheet(new_sheet);

  if( params.pseudo != null )
  {
    new_sheet.setName( params.pseudo );
  }

  Logger.log( "New sheet created." );

  remove_unwanted_columns( new_sheet, params );
  add_columns( new_sheet, params );
  add_rows( new_sheet, params );

  add_participant_to_table_from_sheet( new_sheet, true );
}
