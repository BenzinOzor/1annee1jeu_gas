class StatData
{
	constructor( _type, _stat_count, _games_count )
	{
		// Constants
		this.m_type			= _type;
		this.m_count		= _stat_count;
		this.m_games_count	= _games_count;

		// Filled arrays
		this.m_values 		= Array( this.m_count ).fill( null ).map( () => Array( 2 ) );
		this.m_backgrounds 	= Array( this.m_count ).fill( null ).map( () => Array( 2 ) );
		this.m_foregrounds 	= Array( this.m_count ).fill( null ).map( () => Array( 2 ) );

		// Temp data
		this.m_stat_name		= "";
		this.m_stat_value		= 0;
		this.m_stat_background	= "";
		this.m_stat_foreground	= "";
	}
}

function fill_stat_range( _sheet, _stats_values, _stat_data, _from_row = 0 )
{
	const stat_header_cell = find_text_in_value_array( _stats_values, _stat_data.m_type, _from_row );

	const stat_sheet_row = HOME_STATS_CELL[ 0 ] + stat_header_cell.m_row + 1;
	const stat_sheet_col = HOME_STATS_CELL[ 1 ] + stat_header_cell.m_col;

	let stats_range = _sheet.getRange( stat_sheet_row, stat_sheet_col, _stat_data.m_count, 2 );

	stats_range.setValues( _stat_data.m_values );
	stats_range.setBackgrounds( _stat_data.m_backgrounds );
	stats_range.setFontColors( _stat_data.m_foregrounds );
}

function fill_stat_array( _stat_data, _row )
{
	_stat_data.m_values[ _row ][ 0 ] = _stat_data.m_stat_name;
	
	if( _stat_data.m_stat_value == 0 )
		_stat_data.m_values[ _row ][ 1 ] = "-";
	else
	{
		const percentage = _stat_data.m_stat_value / _stat_data.m_games_count * 100;
		_stat_data.m_values[ _row ][ 1 ] = _stat_data.m_stat_value + " (" + percentage.toFixed( 1 ) + "%)";
	}

	_stat_data.m_backgrounds[ _row ][ 0 ] = _stat_data.m_stat_background;
	_stat_data.m_backgrounds[ _row ][ 1 ] = _stat_data.m_stat_background;

	_stat_data.m_foregrounds[ _row ][ 0 ] = _stat_data.m_stat_foreground;
	_stat_data.m_foregrounds[ _row ][ 1 ] = _stat_data.m_stat_foreground;
}

/* **********************************************************
*  Fill the platform stats columns
*/
function fill_platfroms_stats( _sheet, _stats, _stats_values )
{
	Logger.log( "	Filling platform stats..." );
	
	let platform_row = 0;
	let platforms_data = new StatData( HomeStat.Platforms, Object.values( PlatformName ).length - 1, _stats.m_nb_games );

	_stats.m_platforms.forEach( function ( _platform )
	{
		platforms_data.m_stat_name			= _platform.m_name;
		platforms_data.m_stat_value			= _platform.m_count;
		platforms_data.m_stat_background	= _platform.m_background_color;
		platforms_data.m_stat_foreground	= _platform.m_foreground_color;

		fill_stat_array( platforms_data, platform_row );

		++platform_row;
	} );

	fill_stat_range( _sheet, _stats_values, platforms_data );
}

/* **********************************************************
*  Fill the families stats columns
*/
function fill_families_stats( _sheet, _stats, _stats_values )
{
	Logger.log( "	Filling families stats..." );

	let family_row = 0;
	let famlilies_data = new StatData( HomeStat.Families, Object.values( Family ).length - 1, _stats.m_nb_games );

	_stats.m_families_counts.forEach( function ( _value, _key, _map )
	{
		const family_colors = get_family_colors( _key );

		famlilies_data.m_stat_name			= _key;
		famlilies_data.m_stat_value			= _value;
		famlilies_data.m_stat_background	= family_colors.m_background_color;
		famlilies_data.m_stat_foreground	= family_colors.m_foreground_color;

		fill_stat_array( famlilies_data, family_row );

		++family_row;
	} );

	fill_stat_range( _sheet, _stats_values, famlilies_data );
}

/* **********************************************************
*  Fill the version stats columns
*/
function fill_versions_stats( _sheet, _stats, _stats_values )
{
	Logger.log( "	Filling versions stats..." );

	let version_row = 0;
	let versions_data = new StatData( HomeStat.Versions, Object.values( VersionName ).length - 1, _stats.m_nb_games );

	_stats.m_versions.forEach( function ( _version )
	{
		versions_data.m_stat_name		= _version.m_version;
		versions_data.m_stat_value		= _version.m_count;
		versions_data.m_stat_background	= _version.m_background_color;
		versions_data.m_stat_foreground	= _version.m_foreground_color;

		fill_stat_array( versions_data, version_row );

		++version_row;
	} );
	
	fill_stat_range( _sheet, _stats_values, versions_data );
}

/* **********************************************************
*  Fill the platforms, families and versions stats of a given decade
*/
function fill_decade_stats( _sheet, _stats, _stats_values, _decade )
{
	let get_decade_header = () =>
	{
		switch( _decade )
		{
			case Decade.Nineties:
				return HomeStat.Decade90s;
			case Decade.TwoKs:
				return HomeStat.Decade2Ks;
			case Decade.TwoKTens:
				return HomeStat.Decade2K10s;
			case Decade.TwoKTwneties:
				return HomeStat.Decade2K20s;
			default:
				return HomeStat.Decade90s;
		}
	}

	Logger.log( "	Filling %s stats...", get_decade_header() );

	const decade_cell = find_text_in_value_array( _stats_values, get_decade_header() );

	if( decade_cell.m_row < 0 || decade_cell.m_col < 0 )
		return;

	fill_platforms_decade( _sheet, _stats, _stats_values, _decade, decade_cell );
	fill_families_decade( _sheet, _stats, _stats_values, _decade, decade_cell );
	fill_versions_decade( _sheet, _stats, _stats_values, _decade, decade_cell );
}

/* **********************************************************
*  Fill the platform stats columns of the given decade
*/
function fill_platforms_decade( _sheet, _stats, _stats_values, _decade, _decade_cell )
{
	Logger.log( "		Filling platforms stats..." );

	const nb_stats = 5;
	_stats.m_platforms.sort( ( a, b ) => b.m_decades[ _decade ] - a.m_decades[ _decade ] );
	const decade_platforms = _stats.m_platforms.slice( 0, nb_stats );
	
	let platform_row = 0;
	let platforms_data = new StatData( HomeStat.TopPlatforms, nb_stats, _stats.m_nb_games_by_decades[ _decade ] );

	decade_platforms.forEach( function ( _platform )
	{
		platforms_data.m_stat_value	= _platform.m_decades[ _decade ];

		if ( _platform.m_decades[ _decade ] == 0 )
		{
			platforms_data.m_stat_name			= "-";
			platforms_data.m_stat_background	= HOME_STATS_EMPTY_CELL_BACKGROUND;
			platforms_data.m_stat_foreground	= HOME_STATS_EMPTY_CELL_FOREGROUND;
		}
		else
		{
			platforms_data.m_stat_name			= _platform.m_name;
			platforms_data.m_stat_background	= _platform.m_background_color;
			platforms_data.m_stat_foreground	= _platform.m_foreground_color;
		}

		fill_stat_array( platforms_data, platform_row );

		++platform_row;
	} );

	fill_stat_range( _sheet, _stats_values, platforms_data, _decade_cell.m_row );
}

/* **********************************************************
*  Fill the families stats columns of the given decade
*/
function fill_families_decade( _sheet, _stats, _stats_values, _decade, _decade_cell )
{
	Logger.log( "		Filling families stats..." );

	_stats.m_families_counts.set( Family.PC, 0 );
	_stats.m_families_counts.set( Family.Sony, 0 );
	_stats.m_families_counts.set( Family.Xbox, 0 );
	_stats.m_families_counts.set( Family.Nintendo, 0 );
	_stats.m_families_counts.set( Family.Sega, 0 );
	
	_stats.m_platforms.forEach( function ( _platform )
	{
		if ( _platform.m_family == Family.None )
			return;
		
		_stats.m_families_counts.set( _platform.m_family, _stats.m_families_counts.get( _platform.m_family ) + _platform.m_decades[ _decade ] );
	} );
	
	_stats.m_families_counts = new Map( [ ..._stats.m_families_counts.entries() ].sort( ( a, b ) => b[ 1 ] - a[ 1 ] ) );
	
	const nb_stats = 5;
	let family_row = 0;
	let families_data = new StatData( HomeStat.Families, nb_stats, _stats.m_nb_games_by_decades[ _decade ] );

	_stats.m_families_counts.forEach( function ( _value, _key, _map )
	{
		const family_colors = get_family_colors( _key );

		families_data.m_stat_name			= _key;
		families_data.m_stat_value			= _value;
		families_data.m_stat_background		= family_colors.m_background_color;
		families_data.m_stat_foreground		= family_colors.m_foreground_color;

		fill_stat_array( families_data, family_row );

		++family_row;
	} );

	fill_stat_range( _sheet, _stats_values, families_data, _decade_cell.m_row );
}

/* **********************************************************
*  Fill the version stats columns of the given decade
*/
function fill_versions_decade( _sheet, _stats, _stats_values, _decade, _decade_cell )
{
	_stats.m_versions.sort( ( a, b ) => b.m_decades[ _decade ] - a.m_decades[ _decade ] );

	const nb_stats = 4;
	let version_row = 0;
	let versions_data = new StatData( HomeStat.Versions, nb_stats, _stats.m_nb_games_by_decades[ _decade ] );

	_stats.m_versions.forEach( function ( _version )
	{
		versions_data.m_stat_name		= _version.m_version;
		versions_data.m_stat_value		= _version.m_decades[ _decade ];
		versions_data.m_stat_background	= _version.m_background_color;
		versions_data.m_stat_foreground	= _version.m_foreground_color;

		fill_stat_array( versions_data, version_row );

		++version_row;
	} );

	fill_stat_range( _sheet, _stats_values, versions_data, _decade_cell.m_row );
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
		let durations = get_years_days_hours( _stats.m_total_estimate.m_seconds );

		if( durations.m_years > 0 )
			_sheet.getRange( duration_row, duration_col ).setValue( durations.m_years + 'an(s) ' + durations.m_days + 'j ' + durations.m_hours + 'h' );
		else
			_sheet.getRange( duration_row, duration_col ).setValue( durations.m_days + 'j ' + durations.m_hours + 'h' );

		++duration_row;
		durations = get_years_days_hours( _stats.m_total_played.m_seconds );

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
