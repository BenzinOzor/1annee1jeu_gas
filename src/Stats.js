class Platform
{
	constructor()
	{
		this.m_family = Family.None;
		this.m_background_color = "#ffffff";
		this.m_foreground_color = "#000000";
		this.m_name = PlatformName.None;
		this.m_count = 0;
	}
}

class Version
{
	constructor()
	{
		this.m_version = VersionName.Original;
		this.m_background_color = "#ffffff";
		this.m_foreground_color = "#000000";
		this.m_count = 0;
	}
}

class Stats
{
	constructor()
	{
		this.m_nb_games = 0;
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
	}
}

class GameInfos
{
	constructor()
	{
		this.m_number = 0;
		this.m_state = "";
		this.m_game = "";
		this.m_platform = "";
		this.m_platform_count = 0;
		this.m_version = "";
		this.m_version_count = 0;
		this.m_estimate = new Duration();
		this.m_played = new Duration();
		this.m_delta = new Duration();
	}

	toString()
	{
		return '#'+ this.m_number +' - '+ this.m_game +' - '+ this.m_state +' - '+ this.m_platform +' ('+ this.m_platform_count +') '+ this.m_version +' ('+ this.m_version_count
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
	fill_families_stats( home_sheet, stats );
	fill_versions_stats( home_sheet, stats );
	fill_durations_stats( home_sheet, stats );
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
*  Fill the platform stats columns
*/
function fill_platfroms_stats( _sheet, _stats )
{
	const platforms_range = find_text_in_range( _sheet, _sheet.getRange( HOME_STATS_RANGE ), HOME_STATS_PLATFORMS );

	let platform_row = platforms_range.getRow() + 1;
	const platform_name_col = platforms_range.getColumn();
	const platform_number_col = platform_name_col + 1;

	_stats.m_platforms.forEach( function ( _platform )
	{
		let percentage = _platform.m_count / _stats.m_nb_games * 100;
		_sheet.getRange( platform_row, platform_name_col ).setValue( _platform.m_name );

		if ( _platform.m_count == 0 )
			_sheet.getRange( platform_row, platform_number_col ).setValue( "-" );
		else
			_sheet.getRange( platform_row, platform_number_col ).setValue( _platform.m_count + " (" + percentage.toFixed() + "%)" );

		let platform_range = _sheet.getRange( platform_row, platform_name_col, 1, 2 );
		platform_range.setBackground( _platform.m_background_color );
		platform_range.setFontColor( _platform.m_foreground_color );

		++platform_row;
	} );
}

/* **********************************************************
*  Fill the families stats columns
*/
function fill_families_stats( _sheet, _stats )
{
	const families_range = find_text_in_range( _sheet, _sheet.getRange( HOME_STATS_RANGE ), HOME_STATS_FAMILIES );

	let family_row = families_range.getRow() + 1;
	const family_name_col = families_range.getColumn();
	const family_count_col = family_name_col + 1;

	_stats.m_families_counts.forEach( function ( _value, _key, _map )
	{
		let percentage = _value / _stats.m_nb_games * 100;
		_sheet.getRange( family_row, family_name_col ).setValue( _key );

		if ( _value == 0 )
			_sheet.getRange( family_row, family_count_col ).setValue( "-" );
		else
			_sheet.getRange( family_row, family_count_col ).setValue( _value + " (" + percentage.toFixed() + "%)" );

		const family_colors = get_family_colors( _key );
		let platform_range = _sheet.getRange( family_row, family_name_col, 1, 2 );
		platform_range.setBackground( family_colors.m_background_color );
		platform_range.setFontColor( family_colors.m_foreground_color );

		++family_row;
	} );
}

/* **********************************************************
*  Fill the version stats columns
*/
function fill_versions_stats( _sheet, _stats )
{
	const version_range = find_text_in_range( _sheet, _sheet.getRange( HOME_STATS_RANGE ), HOME_STATS_VERSIONS );

	let version_row = version_range.getRow() + 1;
	const version_name_col = version_range.getColumn();
	const version_number_col = version_name_col + 1;

	_stats.m_versions.forEach( function ( _version )
	{
		let percentage = _version.m_count / _stats.m_nb_games * 100;
		_sheet.getRange( version_row, version_name_col ).setValue( _version.m_version );

		if ( _version.m_count == 0 )
			_sheet.getRange( version_row, version_number_col ).setValue( "-" );
		else
			_sheet.getRange( version_row, version_number_col ).setValue( _version.m_count + " (" + percentage.toFixed() + "%)" );

		let platform_range = _sheet.getRange( version_row, version_name_col, 1, 2 );
		platform_range.setBackground( _version.m_background_color );
		platform_range.setFontColor( _version.m_foreground_color );

		++version_row;
	} );
}

function fill_durations_stats( _sheet, _stats )
{
	Logger.log( "total est %s (%d) | played %s (%d) | delta %s (%d)", _stats.m_total_estimate.toString(), _stats.m_estimates_count, _stats.m_total_played.toString(), _stats.m_played_count, _stats.m_total_delta.toString(), _stats.m_deltas_count );

	_stats.m_total_estimate.divide( _stats.m_estimates_count );
	_stats.m_total_played.divide( _stats.m_played_count );
	_stats.m_total_delta.divide( _stats.m_deltas_count );

	Logger.log( "avg est %s | played %s | delta %s", _stats.m_total_estimate.toString(), _stats.m_total_played.toString(), _stats.m_total_delta.toString() );
}

/* **********************************************************
*  Retrieve stats from a given sheet and update the stat class
*/
function collect_sheet_stats( _sheet, _stats )
{
	Logger.log( "   Collecting stats for '%s'", _sheet.getName() );
	const header_row = get_header_row( _sheet, "A:A", ModelColumnName.State );
	const nb_rows = get_number_of_rows( _sheet, header_row + 1 );
	const nb_cols = get_number_of_columns( _sheet );

	const sheet_range = _sheet.getRange( header_row + 1, 1, nb_rows, nb_cols );
	const range_data = sheet_range.getDisplayValues();

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

	columns_indices.m_state 	= get_column_data_index( _sheet, ModelColumnName.State, header_row );
	columns_indices.m_game 		= get_column_data_index( _sheet, ModelColumnName.Game, header_row );
	columns_indices.m_platform 	= get_column_data_index( _sheet, ModelColumnName.Platfrom, header_row );
	columns_indices.m_version 	= get_column_data_index( _sheet, ModelColumnName.Version, header_row );
	columns_indices.m_estimate 	= get_column_data_index( _sheet, ModelColumnName.Estimate, header_row );
	columns_indices.m_played 	= get_column_data_index( _sheet, ModelColumnName.Played, header_row );
	columns_indices.m_delta 	= get_column_data_index( _sheet, ModelColumnName.Delta, header_row );

	let treated_games = 0;

	let prev_estimate = new Duration();
	prev_estimate.m_total_seconds = _stats.m_total_estimate.m_total_seconds;

	let prev_played = new Duration();
	prev_played.m_total_seconds = _stats.m_total_played.m_total_seconds;

	let prev_delta = new Duration();
	prev_delta.m_total_seconds = _stats.m_total_delta.m_total_seconds;

	// Current game durations for delta backup calculation.
	let game_infos = new GameInfos();

	const prev_estimate_count = _stats.m_estimates_count;
	const prev_played_count = _stats.m_played_count;
	const prev_deltas_count = _stats.m_deltas_count;

	for ( data_row = 0; data_row < range_data.length; ++data_row )
	{
		if ( columns_indices.m_state < 0 || columns_indices.m_game < 0 )
			continue;

		// We don't want to do stats on ignored years or replaced games.
		if ( range_data[ data_row ][ columns_indices.m_state ] == GameState.Ignored || range_data[ data_row ][ columns_indices.m_state ] == GameState.Replaced )
			continue;

		// We don't want to do stats on empty game rows.
		if ( range_data[ data_row ][ columns_indices.m_game ] == "" )
			continue;

		game_infos.m_game = range_data[ data_row ][ columns_indices.m_game ];
		game_infos.m_state = range_data[ data_row ][ columns_indices.m_state ];

		collect_platform( range_data, _stats, data_row, columns_indices, game_infos );
		collect_version( range_data, _stats, data_row, columns_indices, game_infos );
		collect_estimate( range_data, _stats, data_row, columns_indices, game_infos );
		collect_played( range_data, _stats, data_row, columns_indices, game_infos );
		collect_delta( range_data, _stats, data_row, columns_indices, game_infos );

		++treated_games;
		game_infos.m_number = treated_games;

		/*Logger.log( "		#%d - %s - %s - %s - %s est. %s / played %s / delta %s", treated_games, range_data[ data_row ][ columns_indices.m_state ], range_data[ data_row ][ columns_indices.m_game ],

																		game_estimate.toString(), game_played.toString(), game_delta.toString() );*/
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
	if( _columns_indices.m_platform < 0 )
		return;

	let platform = _stats.m_platforms.find( Platform => Platform.m_name === _range_data[ _data_row ][ _columns_indices.m_platform ] );

	if( platform != null )
	{
		++platform.m_count;
		_game_infos.m_platform = platform.m_name;
		_game_infos.m_platform_count = platform.m_count;
	}
	else
	{
		let new_platform = get_family_infos( _range_data[ _data_row ][ _columns_indices.m_platform ] );

		if( new_platform.m_name != PlatformName.None )
		{
			new_platform.m_count = 1;
			_stats.m_platforms.push( new_platform );

			_game_infos.m_platform = new_platform.m_name;
			_game_infos.m_platform_count = new_platform.m_count;
		}
	}
}

/* **********************************************************
*  Retrieve verion informations for the current row
*/
function collect_version( _range_data, _stats, _data_row, _columns_indices, _game_infos )
{
	if( _columns_indices.m_version < 0 )
		return;

	let version = _stats.m_versions.find( Version => Version.m_version === _range_data[ _data_row ][ _columns_indices.m_version ] );
	if( version != null )
	{
		++version.m_count;
		_game_infos.m_version = version.m_version;
		_game_infos.m_version_count = version.m_count;
	}
	else
	{
		let new_version = new Version;
		new_version.m_version = _range_data[ _data_row ][ _columns_indices.m_version ];
		let colors = get_version_colors( new_version.m_version );

		new_version.m_background_color = colors.m_background_color;
		new_version.m_foreground_color = colors.m_foreground_color;

		new_version.m_count = 1;
		_stats.m_versions.push( new_version );

		_game_infos.m_version = new_version.m_version;
		_game_infos.m_version_count = new_version.m_count;
	}

	version = _stats.m_versions.find( Version => Version.m_version === _range_data[ _data_row ][ _columns_indices.m_version ] );
}

/* **********************************************************
*  Retrieve estimate informations for the current row
*/
function collect_estimate( _range_data, _stats, _data_row, _columns_indices, _game_infos )
{
	if( _columns_indices.m_estimate < 0 )
		return;

	const estimate = new Duration( _range_data[ _data_row ][ _columns_indices.m_estimate ] );

	if( isNaN( estimate.m_total_seconds ) || estimate.m_total_seconds == 0 )
		return;

	_stats.m_total_estimate.add( estimate );
	++_stats.m_estimates_count;
	_game_infos.m_estimate.m_total_seconds = estimate.m_total_seconds;
}

/* **********************************************************
*  Retrieve played informations for the current row
*/
function collect_played( _range_data, _stats, _data_row, _columns_indices, _game_infos )
{
	if( _columns_indices.m_played < 0 )
		return;

	const played = new Duration( _range_data[ _data_row ][ _columns_indices.m_played ] );

	if( isNaN( played.m_total_seconds ) || played.m_total_seconds == 0 )
		return;

	_stats.m_total_played.add( played );
	++_stats.m_played_count;
	_game_infos.m_played.m_total_seconds = played.m_total_seconds;
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
	if( isNaN( delta.m_total_seconds ) || delta.m_total_seconds == 0 )
	{
		// Game need to be finished to have a valid delta.
		if( _columns_indices.m_state >= 0 && _range_data[ _data_row ][ _columns_indices.m_state ] != GameState.Done )
			return;

		if( isNaN( _game_infos.m_estimate.m_total_seconds ) || _game_infos.m_estimate.m_total_seconds == 0 )
			return;

		if( isNaN( _game_infos.m_played.m_total_seconds ) || _game_infos.m_played.m_total_seconds == 0 )
			return;

		// We have both an estimate and a played durations, we can determine the delta.
		delta = Duration.substract( _game_infos.m_played, _game_infos.m_estimate );
	}

	// If we still have an invalid delta, there is nothing to do, return.
	if( isNaN( delta.m_total_seconds ) )
		return;

	_stats.m_total_delta.add( delta );
	++_stats.m_deltas_count;
	_game_infos.m_delta.m_total_seconds = delta.m_total_seconds;
}
