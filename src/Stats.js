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
		this.m_shortest_estimate.m_estimate.m_total_seconds = MAX_DURATION_SECONDS;
		this.m_longest_estimate = new DurationInfos();

		this.m_shortest_played = new DurationInfos();
		this.m_shortest_played.m_played.m_total_seconds = MAX_DURATION_SECONDS;
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

function get_years_days_hours( _seconds )
{
	const years = Math.floor( _seconds / SECONDS_IN_YEAR );
	const days = Math.floor( _seconds % SECONDS_IN_YEAR / SECONDS_IN_DAY );
	const hours = Math.floor( _seconds % SECONDS_IN_DAY / SECONDS_IN_HOUR );

	return { m_years: years, m_days: days, m_hours: hours };
}

function fill_durations_stats( _sheet, _stats )
{
	const average_estimate = Duration.divide( _stats.m_total_estimate, _stats.m_estimates_count );
	const average_played = Duration.divide( _stats.m_total_played, _stats.m_played_count );
	const average_delta = Duration.divide( _stats.m_total_delta, _stats.m_deltas_count );
	
	Logger.log( "total est %s (%d) | played %s (%d) | delta %s (%d)", _stats.m_total_estimate.toString(), _stats.m_estimates_count, _stats.m_total_played.toString(), _stats.m_played_count, _stats.m_total_delta.toString(), _stats.m_deltas_count );
	Logger.log( "avg est %s | played %s | delta %s", average_estimate.toString(), average_played.toString(), average_delta.toString() );

	Logger.log( "Shortest estimate: %s - %s", 								_stats.m_shortest_estimate.m_estimate.toString(), _stats.m_shortest_estimate.m_game );
	Logger.log( "Longest estimate: %s - %s", 								_stats.m_longest_estimate.m_estimate.toString(), _stats.m_longest_estimate.m_game );
	Logger.log( "Shortest played: %s - %s", 								_stats.m_shortest_played.m_played.toString(), _stats.m_shortest_played.m_game );
	Logger.log( "Longest played: %s - %s", 									_stats.m_longest_played.m_played.toString(), _stats.m_longest_played.m_game );
	Logger.log( "Biggest negative delta: %s - %s - Est. %s - Played %s", 	_stats.m_biggest_negative_delta.m_delta.toString(), _stats.m_biggest_negative_delta.m_game, _stats.m_biggest_negative_delta.m_estimate.toString(), _stats.m_biggest_negative_delta.m_played.toString() );
	Logger.log( "Biggest positive delta: %s - %s - Est. %s - Played %s", 	_stats.m_biggest_positive_delta.m_delta.toString(), _stats.m_biggest_positive_delta.m_game, _stats.m_biggest_positive_delta.m_estimate.toString(), _stats.m_biggest_positive_delta.m_played.toString() );

	const home_stats_range = _sheet.getRange( HOME_STATS_RANGE );
	let duration_range = find_text_in_range( _sheet, home_stats_range, HomeStat.EstimatedTime );

	if( duration_range != home_stats_range )
	{
		let duration_row = duration_range.getRow();
		let duration_col = duration_range.getColumn() + 2;
		
		_sheet.getRange( duration_row, duration_col ).setValue( average_estimate.toString() );
		_sheet.getRange( duration_row + 1, duration_col ).setValue( average_played.toString() );
		_sheet.getRange( duration_row + 2, duration_col ).setValue( average_delta.toString() );

		duration_col += 2;
		_sheet.getRange( duration_row, duration_col ).setValue( _stats.m_total_estimate.toString() );
		_sheet.getRange( duration_row + 1, duration_col ).setValue( _stats.m_total_played.toString() );

		++duration_col;
		let durations = get_years_days_hours( _stats.m_total_estimate.m_total_seconds );

		if( durations.m_years > 0 )
			_sheet.getRange( duration_row, duration_col ).setValue( durations.m_years + 'an(s) ' + durations.m_days + 'j ' + durations.m_hours + 'h' );
		else
			_sheet.getRange( duration_row, duration_col ).setValue( durations.m_days + 'j ' + durations.m_hours + 'h' );

		++duration_row;
		durations = get_years_days_hours( _stats.m_total_played.m_total_seconds );

		if( durations.m_years > 0 )
			_sheet.getRange( duration_row, duration_col ).setValue( durations.m_years + 'an(s) ' + durations.m_days + 'j ' + durations.m_hours + 'h' );
		else
			_sheet.getRange( duration_row, duration_col ).setValue( durations.m_days + 'j ' + durations.m_hours + 'h' );
	}

	duration_range = find_text_in_range( _sheet, home_stats_range, HomeStat.ShortestEstimate );

	if( duration_range != home_stats_range )
	{
		let estimate_row = duration_range.getRow();
		let estimate_col = duration_range.getColumn() + 2;

		set_game_time_and_link( _sheet, estimate_row, estimate_col, _stats.m_shortest_estimate, DurationRecord.ShortestEstimate );

		++estimate_row;

		set_game_time_and_link( _sheet, estimate_row, estimate_col, _stats.m_longest_estimate, DurationRecord.LongestEstimate );
	}

	duration_range = find_text_in_range( _sheet, home_stats_range, HomeStat.ShortestPlayed );

	if( duration_range != home_stats_range )
	{
		let played_row = duration_range.getRow();
		let played_col = duration_range.getColumn() + 2;

		set_game_time_and_link( _sheet, played_row, played_col, _stats.m_shortest_played, DurationRecord.ShortestPlayed );

		++played_row;

		set_game_time_and_link( _sheet, played_row, played_col, _stats.m_longest_played, DurationRecord.LongestPlayed );
	}

	duration_range = find_text_in_range( _sheet, home_stats_range, HomeStat.NegativeDelta );

	if( duration_range != home_stats_range )
		set_game_time_and_link( _sheet, duration_range.getRow(), duration_range.getColumn() + 2, _stats.m_biggest_negative_delta, DurationRecord.NegativeDelta );

	duration_range = find_text_in_range( _sheet, home_stats_range, HomeStat.PositiveDelta );

	if( duration_range != home_stats_range )
		set_game_time_and_link( _sheet, duration_range.getRow(), duration_range.getColumn() + 2, _stats.m_biggest_positive_delta, DurationRecord.PositiveDelta );
}

function set_game_time_and_link( _sheet, _row, _col, _duration_infos, _record_type )
{
	let duration = new Duration();

	switch( _record_type )
	{
		case DurationRecord.ShortestEstimate:
		case DurationRecord.LongestEstimate:
		{
			duration = _duration_infos.m_estimate;
			break;
		}
		case DurationRecord.ShortestPlayed:
		case DurationRecord.LongestPlayed:
		{
			duration = _duration_infos.m_played;
			break;
		}
		case DurationRecord.NegativeDelta:
		case DurationRecord.PositiveDelta:
		{
			duration = _duration_infos.m_delta;

			const home_stats_range = _sheet.getRange( HOME_STATS_RANGE )
			_sheet.getRange( _row + 1, _col ).setValue( _duration_infos.m_estimate.toString() );
			_sheet.getRange( _row + 1, home_stats_range.getLastColumn() ).setValue( _duration_infos.m_played.toString() );
			break;
		}
	}

	_sheet.getRange( _row, _col ).setValue( duration.toString() );
		
	const richText = SpreadsheetApp.newRichTextValue()
	.setText( _duration_infos.m_game )
	.setLinkUrl( _duration_infos.m_link )
	.build();
	
	_sheet.getRange( _row, _col + 1 ).setRichTextValue( richText );
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

	let prev_estimate = Duration.copy( _stats.m_total_estimate );
	let prev_played = Duration.copy( _stats.m_total_played );
	let prev_delta = Duration.copy( _stats.m_total_delta );

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

		collect_duration_record( _sheet, _stats, sheet_range, data_row, game_infos, DurationRecord.ShortestEstimate );
		collect_duration_record( _sheet, _stats, sheet_range, data_row, game_infos, DurationRecord.LongestEstimate );
		collect_duration_record( _sheet, _stats, sheet_range, data_row, game_infos, DurationRecord.ShortestPlayed );
		collect_duration_record( _sheet, _stats, sheet_range, data_row, game_infos, DurationRecord.LongestPlayed );
		collect_duration_record( _sheet, _stats, sheet_range, data_row, game_infos, DurationRecord.NegativeDelta );
		collect_duration_record( _sheet, _stats, sheet_range, data_row, game_infos, DurationRecord.PositiveDelta );

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

function collect_duration_record( _sheet, _stats, _range, _data_row, _game_infos, _record_type )
{
	const game_row = _range.getRow() + _data_row;

	let set_game_and_link = ( _duration_infos ) =>
	{
		_duration_infos.m_game = _game_infos.m_game;
		_duration_infos.m_link = '#gid=' + _sheet.getSheetId() + '#range=A' + game_row + ':' + get_column_letter( _range.getNumColumns() ) + game_row;
	};

	switch( _record_type )
	{
		case DurationRecord.ShortestEstimate:
		{
			if( isNaN( _game_infos.m_estimate.m_total_seconds ) || _game_infos.m_estimate.m_total_seconds == 0 )
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
			if( isNaN( _game_infos.m_estimate.m_total_seconds ) || _game_infos.m_estimate.m_total_seconds == 0 )
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
			if( isNaN( _game_infos.m_played.m_total_seconds ) || _game_infos.m_played.m_total_seconds == 0 )
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
			if( isNaN( _game_infos.m_played.m_total_seconds ) || _game_infos.m_played.m_total_seconds == 0 )
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
			if( isNaN( _game_infos.m_delta.m_total_seconds ) || _game_infos.m_delta.m_total_seconds == 0 )
				return;

			if( _game_infos.m_delta.m_total_seconds < 0 && _stats.m_biggest_negative_delta.m_delta.compare( _game_infos.m_delta ) > 0 )
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
			if( isNaN( _game_infos.m_delta.m_total_seconds ) || _game_infos.m_delta.m_total_seconds == 0 )
				return;

			if( _game_infos.m_delta.m_total_seconds > 0 && _stats.m_biggest_positive_delta.m_delta.compare( _game_infos.m_delta ) < 0 )
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
