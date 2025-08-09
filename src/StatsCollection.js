const DurationRecord =
{
	ShortestEstimate: 0,
	LongestEstimate: 1,
	ShortestPlayed: 2,
	LongestPlayed: 3,
	NegativeDelta: 4,
	PositiveDelta: 5,
}

class Platform
{
	constructor()
	{
		this.m_family = Family.None;
		this.m_background_color = "#ffffff";
		this.m_foreground_color = "#000000";
		this.m_name = PlatformName.None;
		this.m_count = 0;
		this.m_decades = Array( Decade.Count );
		this.m_decades.fill( 0 );
	}
}

class Version
{
	constructor()
	{
		this.m_version = VersionName.None;
		this.m_background_color = "#ffffff";
		this.m_foreground_color = "#000000";
		this.m_count = 0;
		this.m_decades = Array( Decade.Count );
		this.m_decades.fill( 0 );
	}
}

// Class used for longest and shortest durations among parsed sheets
class DurationInfos
{
	constructor()
	{
		// The threed durations can be used if we keep delta informations. Corresponding estimate and played will be displayed aswell.
		this.m_estimate = new Duration();
		this.m_played = new Duration();
		this.m_delta = new Duration();
		this.m_link = "";				// #gid=<sheet_id>#range=<game_row>
		this.m_game = "";
	}
}

class Stats
{
	constructor()
	{
		this.m_nb_games = 0;
		this.m_nb_games_by_decades = Array( Decade.Count );
		this.m_nb_games_by_decades.fill( 0 );
		this.m_nb_finished_games = 0;
		this.m_versions = [];           // Array of Version
		this.m_platforms = [];          // Array of Platform
		this.m_families_counts = new Map();
		this.m_total_estimate = new Duration();
		this.m_total_played = new Duration();
		this.m_total_delta = new Duration();	// Not displayed as such but used to calculate average.
		this.m_estimates_count = 0;				// Counts can vary from the total number of games, people might not have the column setup for example, so we have to count them separately.
		this.m_played_count = 0;
		this.m_deltas_count = 0;

		this.m_shortest_estimate = new DurationInfos();
		this.m_shortest_estimate.m_estimate.m_seconds = MAX_DURATION_SECONDS;
		this.m_longest_estimate = new DurationInfos();

		this.m_shortest_played = new DurationInfos();
		this.m_shortest_played.m_played.m_seconds = MAX_DURATION_SECONDS;
		this.m_longest_played = new DurationInfos();

		this.m_biggest_negative_delta = new DurationInfos();
		this.m_biggest_positive_delta = new DurationInfos();
	}
}

class GameInfos
{
	constructor()
	{
		this.m_number = 0;
		this.m_state = "";
		this.m_game = "";
		this.m_platform = new Platform();
		this.m_version = new Version();
		this.m_version_count = 0;
		
		this.m_estimate = new Duration();
		this.m_played = new Duration();
		this.m_delta = new Duration();
	}

	toString()
	{
		return '#'+ this.m_number +' - '+ this.m_game +' - '+ this.m_state +' - '+ this.m_platform.m_name +' ('+ this.m_platform.m_count + ' - ' + this.m_platform.m_decades +') '
		+ this.m_version.m_version +' ('+ this.m_version.m_count + ' - ' + this.m_version.m_decades
		+') - est. '+ this.m_estimate +' - played '+ this.m_played +' - delta '+ this.m_delta;
	}
}

/* **********************************************************
*  Parse all sheets and collect then display stats on the home sheet
*/
function compute_stats()
{
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sheets = ss.getSheets();
	let home_sheet = ss.getSheetByName( HOME_SHEET_NAME );

	let stats = new Stats;

	let found_range = find_text_in_range( home_sheet, home_sheet.getRange( HOME_STATS_RANGE ), HOME_STATS_FINISHED_GAMES );
	stats.m_nb_finished_games = home_sheet.getRange( found_range.getRow(), found_range.getColumn() + 2 ).getValue();

	found_range = find_text_in_range( home_sheet, home_sheet.getRange( HOME_STATS_RANGE ), HOME_STATS_NB_GAMES );
	stats.m_nb_games = home_sheet.getRange( found_range.getRow(), found_range.getColumn() + 2 ).getValue();

	Logger.log( "Collecting stats of all sheets..." );
	Logger.log( "Values from sheet: %d finished games out of %d", stats.m_nb_finished_games, stats.m_nb_games );

	sheets.forEach( function ( _sheet )
	{
		if ( is_sheet_name_valid( _sheet ) == false )
			return;

		collect_sheet_stats( _sheet, stats );
	} );

	Logger.log( "Done collecting" );
	handle_stats( stats );
	fill_platfroms_stats( home_sheet, stats );
	/*fill_families_stats( home_sheet, stats );
	fill_versions_stats( home_sheet, stats );
	fill_durations_stats( home_sheet, stats );

	fill_decade_stats( home_sheet, stats, Decade.Nineties );
	fill_decade_stats( home_sheet, stats, Decade.TwoKs );
	fill_decade_stats( home_sheet, stats, Decade.TwoKTens );
	fill_decade_stats( home_sheet, stats, Decade.TwoKTwneties );*/
}

/* **********************************************************
*  After data collection, sort the found stats and add missing platforms
*/
function handle_stats( _stats )
{
	Logger.log( "   Sorting and handling collected stats..." );

	// Sort found platform from most used to least.
	_stats.m_platforms.sort( ( a, b ) => b.m_count - a.m_count );

	// Add any missing platform so we always have a complete list in the sheet.
	for ( const platform in PlatformName )
	{
		if ( platform == PlatformName.None )
			continue;

		if ( !_stats.m_platforms.find( Platform => Platform.m_name === PlatformName[ platform ] ) )
		{
			let new_platform = get_family_infos( PlatformName[ platform ] );

			if ( new_platform.m_name != PlatformName.None )
			{
				_stats.m_platforms.push( new_platform );
			}
		}
	}

	// Compute all the platforms families to make their own stats.
	_stats.m_families_counts = new Map();

	_stats.m_families_counts.set( Family.PC, 0 );
	_stats.m_families_counts.set( Family.Sony, 0 );
	_stats.m_families_counts.set( Family.Xbox, 0 );
	_stats.m_families_counts.set( Family.Nintendo, 0 );
	_stats.m_families_counts.set( Family.Sega, 0 );

	_stats.m_platforms.forEach( function ( _platform )
	{
		if ( _platform.m_family == Family.None )
			return;

		_stats.m_families_counts.set( _platform.m_family, _stats.m_families_counts.get( _platform.m_family ) + _platform.m_count );
	} );

	_stats.m_families_counts = new Map( [ ..._stats.m_families_counts.entries() ].sort( ( a, b ) => b[ 1 ] - a[ 1 ] ) );

	// Sort version from most occuring to the least.
	_stats.m_versions.sort( ( a, b ) => b.m_count - a.m_count );

	// Seems quite unlikely but adding any missing version we didn't find in the read sheets.
	for ( const version in VersionName )
	{
		if ( version == VersionName.None )
			continue;

		if ( !_stats.m_versions.find( Version => Version.m_version === VersionName[ version ] ) )
		{
			let new_version = new Version;
			new_version.m_version = version;
			let colors = get_version_colors( new_version.m_version );

			new_version.m_background_color = colors.m_background_color;
			new_version.m_foreground_color = colors.m_foreground_color;

			_stats.m_versions.push( new_version );
		}
	}
}

/* **********************************************************
*  Retrieve all the informations we need to read stats on a given sheet
*/
function get_table_infos( _range_values )
{
	let columns_indices = {
		m_state: -1,
		m_year: -1,
		m_game: -1,
		m_genre: -1,
		m_platform: -1,
		m_version: -1,
		m_estimate: -1,
		m_played: -1,
		m_delta: -1,
		m_rating: -1
	};

	let infos = { m_header_row: -1, m_first_game_row: -1, m_nb_rows: 0, m_nb_cols: 0, columns_indices };

	if( _range_values.length == 0 || _range_values[ 0 ].length == 0 )
		return infos;

	// Looking for the header row
	for( let row = 0; row < _range_values.length; ++row )
	{
		if( _range_values[ row ][ 0 ] == ModelColumnName.State )
		{
			infos.m_header_row = row;
			infos.m_first_game_row = row + 1;	// Just for convenience in other functions.
			break;
		}
	}

	// Checking if the last row of the range is a completion status.
	// If it is, it means there is nothing in the sheet under the games table and the rows stops at the end of the datas we have so we don't need to iterate on it.
	if( is_completion_status( _range_values[ _range_values.length - 1][ 0 ] ) )
	{
		infos.m_nb_rows = (_range_values.length - 1) - infos.m_header_row;
	}
	else
	{
		// Determining number of rows
		for( let row = infos.m_header_row + 1; row < _range_values.length; ++row )
		{
			if( is_completion_status( _range_values[ row ][ 0 ] ) == false )
			{
				infos.m_nb_rows = row - infos.m_header_row - 1;		// Decrementing because the variable row is one too far, because we wait for an invalid row.
				break;
			}
		}
	}

	let max_col = 0;

	// Looking for column indices
	for( let col = 0; col < _range_values[ infos.m_header_row ].length; ++col )
	{
		let column_attributed = false;
		switch( _range_values[ infos.m_header_row ][ col ] )
		{
			case ModelColumnName.State:		infos.columns_indices.m_state = col;		column_attributed = true; break;
			case ModelColumnName.Year:		infos.columns_indices.m_year = col;			column_attributed = true; break;
			case ModelColumnName.Game:		infos.columns_indices.m_game = col;			column_attributed = true; break;
			case ModelColumnName.Genre:		infos.columns_indices.m_genre = col;		column_attributed = true; break;
			case ModelColumnName.Platfrom:	infos.columns_indices.m_platform = col;		column_attributed = true; break;
			case ModelColumnName.Version:	infos.columns_indices.m_version = col;		column_attributed = true; break;
			case ModelColumnName.Estimate:	infos.columns_indices.m_estimate = col;		column_attributed = true; break;
			case ModelColumnName.Played:	infos.columns_indices.m_played = col;		column_attributed = true; break;
			case ModelColumnName.Delta:		infos.columns_indices.m_delta = col;		column_attributed = true; break;
			case ModelColumnName.Rating:	infos.columns_indices.m_rating = col;		column_attributed = true; break;
		}

		if( column_attributed && col > max_col )
			max_col = col;
	}

	infos.m_nb_cols = max_col;

	return infos;
}

/* **********************************************************
*  Retrieve stats from a given sheet and update the stat class
*/
function collect_sheet_stats( _sheet, _stats )
{
	Logger.log( "	Collecting stats for '%s'", _sheet.getName() );
	let range_data = _sheet.getRange( 1, 1, 100, 15 ).getDisplayValues();

	let table_infos = get_table_infos( range_data );

	let treated_games = 0;

	let prev_estimate = Duration.copy( _stats.m_total_estimate );
	let prev_played = Duration.copy( _stats.m_total_played );
	let prev_delta = Duration.copy( _stats.m_total_delta );

	// Current game durations for delta backup calculation.
	let game_infos = new GameInfos();

	const prev_estimate_count = _stats.m_estimates_count;
	const prev_played_count = _stats.m_played_count;
	const prev_deltas_count = _stats.m_deltas_count;

	for ( data_row = table_infos.m_first_game_row; data_row < table_infos.m_nb_rows; ++data_row )
	{
		if ( table_infos.columns_indices.m_state < 0 || table_infos.columns_indices.m_game < 0 )
			continue;

		// We don't want to do stats on ignored years or replaced games.
		if ( range_data[ data_row ][ table_infos.columns_indices.m_state ] == GameState.Ignored || range_data[ data_row ][ table_infos.columns_indices.m_state ] == GameState.Replaced )
			continue;

		// We don't want to do stats on empty game rows.
		if ( range_data[ data_row ][ table_infos.columns_indices.m_game ] == "" )
			continue;

		game_infos.m_game = range_data[ data_row ][ table_infos.columns_indices.m_game ];
		game_infos.m_state = range_data[ data_row ][ table_infos.columns_indices.m_state ];

		collect_platform( range_data, _stats, data_row, table_infos.columns_indices, game_infos );
		collect_version( range_data, _stats, data_row, table_infos.columns_indices, game_infos );
		collect_estimate( range_data, _stats, data_row, table_infos.columns_indices, game_infos );
		collect_played( range_data, _stats, data_row, table_infos.columns_indices, game_infos );
		collect_delta( range_data, _stats, data_row, table_infos.columns_indices, game_infos );

		collect_duration_record( _sheet, _stats, table_infos, data_row, game_infos, DurationRecord.ShortestEstimate );
		collect_duration_record( _sheet, _stats, table_infos, data_row, game_infos, DurationRecord.LongestEstimate );
		collect_duration_record( _sheet, _stats, table_infos, data_row, game_infos, DurationRecord.ShortestPlayed );
		collect_duration_record( _sheet, _stats, table_infos, data_row, game_infos, DurationRecord.LongestPlayed );
		collect_duration_record( _sheet, _stats, table_infos, data_row, game_infos, DurationRecord.NegativeDelta );
		collect_duration_record( _sheet, _stats, table_infos, data_row, game_infos, DurationRecord.PositiveDelta );

		++treated_games;
		game_infos.m_number = treated_games;

		Logger.log( '		' + game_infos );

		game_infos = new GameInfos();
	}

	Logger.log( "	%d treated games	/	%d estimates / %d played / %d deltas", treated_games, _stats.m_estimates_count - prev_estimate_count, _stats.m_played_count - prev_played_count, _stats.m_deltas_count - prev_deltas_count );

	const sheet_estimate = Duration.substract( _stats.m_total_estimate, prev_estimate );
	const sheet_played = Duration.substract( _stats.m_total_played, prev_played );
	const sheet_delta = Duration.substract( _stats.m_total_delta, prev_delta );

	Logger.log( "	Estimate: %s | Played: %s | Delta: %s", sheet_estimate.toString(), sheet_played.toString(), sheet_delta.toString() );
}

/* **********************************************************
*  Retrieve platform informations for the current row
*/
function collect_platform( _range_data, _stats, _data_row, _columns_indices, _game_infos )
{
	if( _columns_indices.m_platform < 0 || _range_data[ _data_row ][ _columns_indices.m_platform ] == "" )
		return;

	let platform = _stats.m_platforms.find( Platform => Platform.m_name === _range_data[ _data_row ][ _columns_indices.m_platform ] );

	if( platform != null )
	{
		++platform.m_count;
		_game_infos.m_platform = platform;
	}
	else
	{
		let new_platform = get_family_infos( _range_data[ _data_row ][ _columns_indices.m_platform ] );

		if( new_platform.m_name != PlatformName.None )
		{
			new_platform.m_count = 1;
			_stats.m_platforms.push( new_platform );

			_game_infos.m_platform = new_platform;
			platform = new_platform;
		}
	}

	if( platform == null || _columns_indices.m_year < 0 )
		return;
	
	const decade = get_decade( _range_data[ _data_row ][ _columns_indices.m_year ] );

	if( decade == Decade.OOB )
		return;

	++platform.m_decades[ decade ];
	++_stats.m_nb_games_by_decades[ decade ];
}

/* **********************************************************
*  Retrieve verion informations for the current row
*/
function collect_version( _range_data, _stats, _data_row, _columns_indices, _game_infos )
{
	if( _columns_indices.m_version < 0 || _range_data[ _data_row ][ _columns_indices.m_platform ] == "" )
		return;

	let version = _stats.m_versions.find( Version => Version.m_version === _range_data[ _data_row ][ _columns_indices.m_version ] );
	if( version != null )
	{
		++version.m_count;
		_game_infos.m_version = version;
	}
	else
	{
		if( is_valid_version(_range_data[ _data_row ][ _columns_indices.m_version ]) == false)
			return;

		let new_version = new Version;
		new_version.m_version = _range_data[ _data_row ][ _columns_indices.m_version ];
		let colors = get_version_colors( new_version.m_version );

		new_version.m_background_color = colors.m_background_color;
		new_version.m_foreground_color = colors.m_foreground_color;

		new_version.m_count = 1;
		_stats.m_versions.push( new_version );

		_game_infos.m_version = new_version;
		version = new_version;
	}

	if( version == null || _columns_indices.m_year < 0 )
		return;
	
	const decade = get_decade( _range_data[ _data_row ][ _columns_indices.m_year ] );

	if( decade == Decade.OOB )
		return;

	++version.m_decades[ decade ];
}

/* **********************************************************
*  Retrieve estimate informations for the current row
*/
function collect_estimate( _range_data, _stats, _data_row, _columns_indices, _game_infos )
{
	if( _columns_indices.m_estimate < 0 )
		return;

	const estimate = new Duration( _range_data[ _data_row ][ _columns_indices.m_estimate ] );

	if( isNaN( estimate.m_seconds ) || estimate.m_seconds == 0 )
		return;

	_stats.m_total_estimate.add( estimate );
	++_stats.m_estimates_count;
	_game_infos.m_estimate.copy( estimate );
}

/* **********************************************************
*  Retrieve played informations for the current row
*/
function collect_played( _range_data, _stats, _data_row, _columns_indices, _game_infos )
{
	if( _columns_indices.m_played < 0 )
		return;

	const played = new Duration( _range_data[ _data_row ][ _columns_indices.m_played ] );

	if( isNaN( played.m_seconds ) || played.m_seconds == 0 )
		return;

	_stats.m_total_played.add( played );
	++_stats.m_played_count;
	_game_infos.m_played.m_seconds = played.m_seconds;
}

/* **********************************************************
*  Retrieve delta informations for the current row
*/
function collect_delta( _range_data, _stats, _data_row, _columns_indices, _game_infos )
{
	let delta = new Duration();

	if( _columns_indices.m_delta > 0 )
	{
		delta = new Duration( _range_data[ _data_row ][ _columns_indices.m_delta ] );
	}

	// We can try to compute what is the delta for a game if we couldn't find the information on the sheet.
	if( isNaN( delta.m_seconds ) || delta.m_seconds == 0 )
	{
		// Game need to be finished to have a valid delta.
		if( _columns_indices.m_state >= 0 && _range_data[ _data_row ][ _columns_indices.m_state ] != GameState.Done )
			return;

		if( isNaN( _game_infos.m_estimate.m_seconds ) || _game_infos.m_estimate.m_seconds == 0 )
			return;

		if( isNaN( _game_infos.m_played.m_seconds ) || _game_infos.m_played.m_seconds == 0 )
			return;

		// We have both an estimate and a played durations, we can determine the delta.
		delta = Duration.substract( _game_infos.m_played, _game_infos.m_estimate );
	}

	// If we still have an invalid delta, there is nothing to do, return.
	if( isNaN( delta.m_seconds ) )
		return;

	_stats.m_total_delta.add( delta );
	++_stats.m_deltas_count;
	_game_infos.m_delta.m_seconds = delta.m_seconds;
}

function collect_duration_record( _sheet, _stats, _table_infos, _data_row, _game_infos, _record_type )
{
	const game_row = _table_infos.m_first_game_row + _data_row + 1;	// Adding one because rows in table infos are indices beginning at 0 and cells start at 1 in the sheet.

	let set_game_and_link = ( _duration_infos ) =>
	{
		_duration_infos.m_game = _game_infos.m_game;
		_duration_infos.m_link = '#gid=' + _sheet.getSheetId() + '#range=A' + game_row + ':' + get_column_letter( _table_infos.m_nb_cols ) + game_row;
	};

	switch( _record_type )
	{
		case DurationRecord.ShortestEstimate:
		{
			if( isNaN( _game_infos.m_estimate.m_seconds ) || _game_infos.m_estimate.m_seconds == 0 )
				return;

			if( _stats.m_shortest_estimate.m_estimate.compare( _game_infos.m_estimate ) > 0 )
			{
				_stats.m_shortest_estimate.m_estimate.copy( _game_infos.m_estimate );
				set_game_and_link( _stats.m_shortest_estimate );

				Logger.log( "			New shortest estimate: %s - %s", _game_infos.m_estimate.toString(), _game_infos.m_game );
			}
			break;
		}
		case DurationRecord.LongestEstimate:
		{
			if( isNaN( _game_infos.m_estimate.m_seconds ) || _game_infos.m_estimate.m_seconds == 0 )
				return;

			if( _stats.m_longest_estimate.m_estimate.compare( _game_infos.m_estimate ) < 0 )
			{
				_stats.m_longest_estimate.m_estimate.copy( _game_infos.m_estimate );
				set_game_and_link( _stats.m_longest_estimate );

				Logger.log( "			New longest estimate: %s - %s", _game_infos.m_estimate.toString(), _game_infos.m_game );
			}
			break;
		}
		case DurationRecord.ShortestPlayed:
		{
			if( isNaN( _game_infos.m_played.m_seconds ) || _game_infos.m_played.m_seconds == 0 )
				return;

			if( _stats.m_shortest_played.m_played.compare( _game_infos.m_played ) > 0 )
			{
				_stats.m_shortest_played.m_played.copy( _game_infos.m_played );
				set_game_and_link( _stats.m_shortest_played );

				Logger.log( "			New shortest played: %s - %s", _game_infos.m_played.toString(), _game_infos.m_game );
			}
			break;
		}
		case DurationRecord.LongestPlayed:
		{
			if( isNaN( _game_infos.m_played.m_seconds ) || _game_infos.m_played.m_seconds == 0 )
				return;

			if( _stats.m_longest_played.m_played.compare( _game_infos.m_played ) < 0 )
			{
				_stats.m_longest_played.m_played.copy( _game_infos.m_played );
				set_game_and_link( _stats.m_longest_played );

				Logger.log( "			New longest played: %s - %s", _game_infos.m_played.toString(), _game_infos.m_game );
			}
			break;
		}
		case DurationRecord.NegativeDelta:
		{
			if( isNaN( _game_infos.m_delta.m_seconds ) || _game_infos.m_delta.m_seconds == 0 )
				return;

			if( _game_infos.m_delta.m_seconds < 0 && _stats.m_biggest_negative_delta.m_delta.compare( _game_infos.m_delta ) > 0 )
			{
				_stats.m_biggest_negative_delta.m_delta.copy( _game_infos.m_delta );
				_stats.m_biggest_negative_delta.m_estimate = _game_infos.m_estimate;
				_stats.m_biggest_negative_delta.m_played = _game_infos.m_played;
				set_game_and_link( _stats.m_biggest_negative_delta );

				Logger.log( "			New biggest negative delta: %s - %s / Est. %s - Played %s", _game_infos.m_delta.toString(), _game_infos.m_game, _game_infos.m_estimate.toString(), _game_infos.m_played.toString() );
			}
			break;
		}
		case DurationRecord.PositiveDelta:
		{
			if( isNaN( _game_infos.m_delta.m_seconds ) || _game_infos.m_delta.m_seconds == 0 )
				return;

			if( _game_infos.m_delta.m_seconds > 0 && _stats.m_biggest_positive_delta.m_delta.compare( _game_infos.m_delta ) < 0 )
			{
				_stats.m_biggest_positive_delta.m_delta.copy( _game_infos.m_delta );
				_stats.m_biggest_positive_delta.m_estimate = _game_infos.m_estimate;
				_stats.m_biggest_positive_delta.m_played = _game_infos.m_played;
				set_game_and_link( _stats.m_biggest_positive_delta );

				Logger.log( "			New biggest positive delta: %s - %s / Est. %s - Played %s", _game_infos.m_delta.toString(), _game_infos.m_game, _game_infos.m_estimate.toString(), _game_infos.m_played.toString() );
			}
			break;
		}
	}
}
