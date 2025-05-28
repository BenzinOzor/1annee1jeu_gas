const completion = [
  "Pas commencé",
  "En cours",
  "Terminé",
  "Abandonné",
  "Remplacé"
];

const MODEL_SHEET_NAME = "⚙️ Modèle";

const MODEL_TABLE_HEADER_ROW = 6;
const MODEL_TABLE_FIRST_ROW = 7;
const MODEL_TABLE_YEAR_COL = 2;
const MODEL_TABLE_VERSION_COL = 6;
const MODEL_TABLE_COM_COL = 7;
const MODEL_TABLE_WIDTH = 7;
const DEFAULT_ROW_HEIGHT = 21;

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  // Or DocumentApp, SlidesApp or FormApp.
  ui.createMenu('Custom Menu')
      .addItem('popup', 'creation_popup')
      .addSeparator()
      .addSubMenu(ui.createMenu('Sub-menu')
          .addItem('Second item', 'menuItem2'))
      .addToUi();
}

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
  new_column = preceding_column + 1;
  sheet.insertColumnAfter( preceding_column );
  sheet.getRange( MODEL_TABLE_HEADER_ROW, new_column ).setValue( name );
  return new_column;
}

/* **********************************************************
*  Add all the columns selected by the user in the new table
*  Returns the number of added columns
*/
function add_columns( sheet, params )
{
  column = MODEL_TABLE_VERSION_COL;
  columns_added = 0;

  if( params.estimate || params.delta )
  {
    column = add_column( sheet, column, "Estimation" );
    sheet.getRange( MODEL_TABLE_HEADER_ROW, column ).setNote( "Estimation du temps que prendra le jeu, format hh:mm:ss" );
    new_range = sheet.getRange( MODEL_TABLE_FIRST_ROW, column );
    new_range.setNumberFormat( "[h]:mm:ss" );
    ++columns_added;
  }
  if( params.played || params.delta )
  {
    column = add_column( sheet, column, "Temps Passé" );
    sheet.getRange( MODEL_TABLE_HEADER_ROW, column ).setNote( "Temps passé sur le jeu, format hh:mm:ss" );
    new_range = sheet.getRange(MODEL_TABLE_FIRST_ROW, column );
    new_range.setNumberFormat("[h]:mm:ss");
    ++columns_added;
  }
  if( params.delta )
  {
    column = add_column( sheet, column, "Différence");
    sheet.getRange( MODEL_TABLE_HEADER_ROW, column ).setNote( "Différence entre le temps passé et l'estimation, rempli automatiquement quand le jeu est terminé" );
    new_range = sheet.getRange(MODEL_TABLE_FIRST_ROW, column );
    new_range.setNumberFormat("[h]:mm:ss");
    new_range.setValue( "=if(A" + MODEL_TABLE_FIRST_ROW + " = \"Terminé\";if(isblank(H" + MODEL_TABLE_FIRST_ROW + ");;H" + MODEL_TABLE_FIRST_ROW + "-G" + MODEL_TABLE_FIRST_ROW + ");)" );
    ++columns_added;
  }
  if( params.rating )
  {
    column = add_column( sheet, column, "Note" );
    new_range = sheet.getRange(MODEL_TABLE_FIRST_ROW, column );
    ++columns_added;
  }
  if( params.verdict )
  {
    column = add_column( sheet, MODEL_TABLE_COM_COL + columns_added, "Verdict" );
    new_range = sheet.getRange(MODEL_TABLE_FIRST_ROW, column );
    ++columns_added;
  }

  return columns_added;
}

/* **********************************************************
*  Add the necessary number of rows to the table according to birth year and season number
*/
function add_rows( sheet, params, columns_added )
{
  sheet.getRange(MODEL_TABLE_FIRST_ROW, MODEL_TABLE_YEAR_COL).setValue( params.birth_year );
  model_range = sheet.getRange( MODEL_TABLE_FIRST_ROW, 1, 1, MODEL_TABLE_WIDTH + columns_added );

  row = MODEL_TABLE_FIRST_ROW + 1;
  year = sheet.getRange( MODEL_TABLE_FIRST_ROW, MODEL_TABLE_YEAR_COL ).getValue() + 1;

  for(; year <= params.season; ++year, ++row )
  {
    model_range.copyTo( sheet.getRange( row, 1 ) );
    sheet.getRange( row, MODEL_TABLE_YEAR_COL ).setValue( year );
  }

  sheet.setRowHeightsForced( MODEL_TABLE_FIRST_ROW, row - MODEL_TABLE_FIRST_ROW, DEFAULT_ROW_HEIGHT );
}

/* **********************************************************
*  New page creation function, called from the new page popup
*/
function create_new_page( params )
{
 /* const params = {
    season: 2025,
    birth_year: 1991,
    estimate: false,
    played: false,
    delta: true,
    rating: true,
    verdict: true
  }*/

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const model_sheet = ss.getSheetByName( MODEL_SHEET_NAME );
  new_sheet = model_sheet.copyTo(ss);
  ss.setActiveSheet(new_sheet);

  if( params.pseudo != null )
  {
    new_sheet.setName( params.pseudo );
  }

  columns_added = add_columns( new_sheet, params );
  add_rows( new_sheet, params, columns_added );

  myFunction();
}
