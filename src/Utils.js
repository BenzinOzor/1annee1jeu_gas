function idOf( _letter_index )
{
	return (
		( _letter_index >= 26 ? idOf( ( ( _letter_index / 26 ) >> 0 ) - 1 ) : "" ) +
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

	for ( ; header_row < data.length; ++header_row )
	{
		if ( data[ header_row ][ 0 ] == _title )
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
	if ( _name.length == 0 )
	{
		return -1;
	}

	let data = _sheet.getRange( _row + ':' + _row ).getValues();
	let data_col = 0;

	// We don't want to check endlessly, if the name wasn't in the first 20 columns, we consider it never will.
	for ( ; data_col < 20; ++data_col )
	{
		if ( data[ 0 ][ data_col ] == _name )
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
	switch ( _string )
	{
		case GameState.NotStarted:
		case GameState.Playing:
		case GameState.Done:
		case GameState.Abandoned:
		case GameState.Replaced:
		case GameState.Ignored:
			{
				return true;
			}
		default:
			return false;
	}
}

function is_valid_version( _version )
{
	switch( _version )
	{
		case VersionName.Original:
		case VersionName.Remake:
		case VersionName.Remaster:
		case VersionName.Emulation:
			return true;
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

	for ( ; nb_rows < data.length; ++nb_rows )
	{
		// We check if there is a status text in the cell. We can't just check if the cell is empty in case the user customised something under their table.
		if ( is_completion_status( data[ nb_rows ][ 0 ] ) == false )
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
	if ( ( _sheet.getName() == HOME_SHEET_NAME ) || ( _sheet.getName().indexOf( "Modèle" ) > 0 ) )
	{
		return false;
	}

	return true;
}

function get_family_colors( _family )
{
	var colors = { m_background_color: "#ffffff", m_foreground_color: "#000000" };

	switch ( _family )
	{
		case Family.PC:
			{
				colors.m_background_color = "#473822";
				colors.m_foreground_color = "#ffe5a0";
				break;
			}
		case Family.Sony:
			{
				colors.m_background_color = "#0a53a8";
				colors.m_foreground_color = "#bfe0f6";
				break;
			}
		case Family.Xbox:
			{
				colors.m_background_color = "#11734b";
				colors.m_foreground_color = "#d4edbc";
				break;
			}
		case Family.Nintendo:
			{
				colors.m_background_color = "#ff3f3f";
				colors.m_foreground_color = "#ffffff";
				break;
			}
		case Family.Sega:
			{
				colors.m_background_color = "#bfe1f6";
				colors.m_foreground_color = "#0a53a8";
				break;
			}
	}

	return colors;
}

function get_version_colors( _version )
{
	var colors = { m_background_color: "#ffffff", m_foreground_color: "#000000" };

	switch ( _version )
	{
		case VersionName.Original:
			{
				colors.m_background_color = "#028090";
				colors.m_foreground_color = "#ffffff";
				break;
			}
		case VersionName.Remake:
			{
				colors.m_background_color = "#0038a8";
				colors.m_foreground_color = "#ffffff";
				break;
			}
		case VersionName.Remaster:
			{
				colors.m_background_color = "#9b4f96";
				colors.m_foreground_color = "#ffffff";
				break;
			}
		case VersionName.Emulation:
			{
				colors.m_background_color = "#d60270";
				colors.m_foreground_color = "#ffffff";
				break;
			}
	}

	return colors;
}

function get_family_infos( _platform )
{
	let platform = new Platform;
	platform.m_name = _platform;

	switch ( platform.m_name )
	{
		case PlatformName.PC:
			{
				platform.m_family = Family.PC;
				break;
			}
		case PlatformName.PS1:
		case PlatformName.PS2:
		case PlatformName.PS3:
		case PlatformName.PS4:
		case PlatformName.PS5:
		case PlatformName.PSP:
		case PlatformName.Vita:
			{
				platform.m_family = Family.Sony;
				break;
			}
		case PlatformName.Xbox:
		case PlatformName.Xbox360:
		case PlatformName.XONE:
		case PlatformName.XboxSeries:
			{
				platform.m_family = Family.Xbox;
				break;
			}
		case PlatformName.NES:
		case PlatformName.SNES:
		case PlatformName.N64:
		case PlatformName.GameCube:
		case PlatformName.Wii:
		case PlatformName.WiiU:
		case PlatformName.Switch:
		case PlatformName.Switch2:
		case PlatformName.GameBoy:
		case PlatformName.GameBoyColor:
		case PlatformName.GBA:
		case PlatformName.DS:
		case PlatformName.ThreeDS:
			{
				platform.m_family = Family.Nintendo;
				break;
			}
		case PlatformName.MasterSystem:
		case PlatformName.MegaDrive:
		case PlatformName.GameGear:
		case PlatformName.MegaCD:
		case PlatformName.Saturn:
		case PlatformName.Dreamcast:
			{
				platform.m_family = Family.Sega;
				break;
			}
		case PlatformName.NeoGeo:
			{
				platform.m_family = Family.None;
				platform.m_background_color = "#ffe5a0";
				platform.m_foreground_color = "#473821";
				break;
			}
		case PlatformName.Mobile:
			{
				platform.m_family = Family.None;
				platform.m_background_color = "#d4edbc";
				platform.m_foreground_color = "#11734b";
				break;
			}
		default:
			{
				platform.m_name = PlatformName.None;
				break;
			}
	}

	if ( platform.m_family != Family.None )
	{
		const colors = get_family_colors( platform.m_family );

		platform.m_background_color = colors.m_background_color;
		platform.m_foreground_color = colors.m_foreground_color;
	}

	return platform;
}

/* **********************************************************
*  Look for the given text in a range
*  Return the range in which the text has been found
*/
function find_text_in_range( _sheet, _range, _text )
{
	const values = _range.getValues();

	const nb_rows = _range.getNumRows();
	const nb_cols = _range.getNumColumns();

	for ( let row = 0; row < nb_rows; ++row )
	{
		for ( let col = 0; col < nb_cols; ++col )
		{
			if ( values[ row ][ col ] == _text )
				return _sheet.getRange( _range.getRow() + row, _range.getColumn() + col );
		}
	}

	return _range;
}

function find_text_in_value_array( _array, _text, _from_row = 0 )
{
	if( _array.length <= 0 || _array[ 0 ].length <= 0 )
		return { m_row: -1, m_col: -1 };

	for ( let row = _from_row; row < _array.length; ++row )
	{
		for ( let col = 0; col < _array[ 0 ].length; ++col )
		{
			if ( _array[ row ][ col ] == _text )
				return { m_row: row, m_col: col }
		}
	}

	return { m_row: -1, m_col: -1 };
}

/* **********************************************************
*  Turn number into a string with leading zeros.
*/
function zero_pad( _number, _pad )
{
	return String( _number ).padStart( _pad, '0' );
}

/* **********************************************************
*  Retrieve the decade in which is the given year for stats purposes.
*  Years under 1990 and over 2029 are out of bounds for now.
*/
function get_decade( _year )
{
	if( _year >= 1990 && _year < 2000 )
		return Decade.Nineties;

	if( _year >= 2000 && _year < 2010 )
		return Decade.TwoKs;

	if( _year >= 2010 && _year < 2020 )
		return Decade.TwoKTens;

	if( _year >= 2020 && _year < 2030 )
		return Decade.TwoKTwneties;

	return Decade.OOB;
}
