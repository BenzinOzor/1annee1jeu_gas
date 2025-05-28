const HOME_SHEET_NAME = "🏠Accueil";
const HOME_PARTICIPANTS_FIRST_ROW = 9;
const HOME_PARTICIPANT_COL = 1;

function myFunction() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  home_sheet = ss.getSheetByName( HOME_SHEET_NAME );
  
  last_row = HOME_PARTICIPANTS_FIRST_ROW;
  while( home_sheet.getRange( last_row, HOME_PARTICIPANT_COL ).isBlank() == false )
  {
    home_sheet.getRange( last_row, HOME_PARTICIPANT_COL ).clear({ contentsOnly: true, commentsOnly: true } );
    ++last_row;
  }
}
