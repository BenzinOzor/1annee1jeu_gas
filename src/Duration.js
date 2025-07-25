class Duration
{
	constructor()
	{
		this.m_hours = 0;
		this.m_minuts = 0;
		this.m_seconds = 0;
		this.m_negative = false;
	}

	/* **********************************************************
	*  Create a Duration object from a duration string formated 00:00:00.
	*  Return the new Duration object.
	*/
	static from_string( _duration )
	{
		let res_duration = new Duration();

		const duration_parts = _duration.split( ":" );

		if( duration_parts.length > 0 )
		{
			res_duration.m_hours = parseInt( duration_parts[ 0 ], 10 );

			if( res_duration.m_hours < 0 )
			{
				res_duration.m_hours *= -1;
				res_duration.m_negative = true;
			}
		}

		if( duration_parts.length > 1 )
			res_duration.m_minuts = parseInt( duration_parts[ 1 ], 10 );

		if( duration_parts.length > 2 )
			res_duration.m_seconds = parseInt( duration_parts[ 2 ], 10 );

		return res_duration;
	}

	/* **********************************************************
	*  Create a Duration object from an other Duration object.
	*  Return the new Duration object.
	*/
	static from_duration( _duration, _negative = _duration.m_negative )
	{
		let res_duration = new Duration();

		res_duration.m_hours = _duration.m_hours;
		res_duration.m_minuts = _duration.m_hours;
		res_duration.m_seconds = _duration.m_hours;
		res_duration.m_negative = _negative;

		return res_duration;
	}

	copy( _duration, _negative = _duration.m_negative )
	{
		this.m_hours = _duration.m_hours;
		this.m_minuts = _duration.m_hours;
		this.m_seconds = _duration.m_hours;
		this.m_negative = _negative;
	}

	/* **********************************************************
	*  Format a string with hours, minuts and second values formated 00:00:00
	*/
	to_string()
	{
		return (this.m_negative ? '-' : '' ) + zero_pad( this.m_hours, 2 ) + ':' + zero_pad( this.m_minuts, 2 ) + ':' + zero_pad( this.m_seconds, 2 );
	}

	/* **********************************************************
	*  Compare two strings containing durations and tell which is greater than the other
	*  Return 1 if _duration_1 is greater, 1 if _duration_2 is greater, or 0 if durations are equal
	*/
	compare( _duration, _absolute = false )
	{
		return this.compare( this, _duration, _absolute );
	}

	/* **********************************************************
	*  Compare two strings containing durations and tell which is greater than the other
	*  Return 1 if _duration_1 is greater, 1 if _duration_2 is greater, or 0 if durations are equal
	*/
	static compare( _duration_1, _duration_2, _absolute = false )
	{
		const compare_absolute = (_dur_1, _dur_2) =>
		{
			if( _dur_1.m_hours > _dur_2.m_hours )
				return 1;
			else if( _dur_1.m_hours < _dur_2.m_hours )
				return -1;

			if( _dur_1.m_minuts > _dur_2.m_minuts )
				return 1;
			else if( _dur_1.m_minuts < _dur_2.m_minuts )
				return -1;

			if( _dur_1.m_seconds > _dur_2.m_seconds )
				return 1;
			else if( _dur_1.m_seconds < _dur_2.m_seconds )
				return -1;

			return 0;
		};

		const negatives_count = _duration_1.m_negative + _duration_2.m_negative;
		
		if( negatives_count == 0 || _absolute )
		{
			return compare_absolute( _duration_1, _duration_2 );
		}
		else if( _absolute == false )
		{
			if( negatives_count == 1 )
			{
				return -1 * _duration_1.m_negative + 1 * _duration_2.m_negative;
			}
			else if( negatives_count == 2 )
			{
				return compare_absolute( _duration_2, _duration_1 );
			}
		}

		return 0;
	}

	/* **********************************************************
	*  Add the given duration to the current one
	*/
	add( _duration )
	{
		this.copy( Duration.add( this, _duration ) );
	}

	/* **********************************************************
	*  Add two durations together
	*  Return a new Duration object, result of the addition
	*/
	static add( _duration_1, _duration_2 )
	{
		const negatives_count = _duration_1.m_negative + _duration_2.m_negative;

		let result = new Duration();

		if( negatives_count == 1 )
		{
			const asbolute_comparison = Duration.compare( _duration_1, _duration_2, true );
			if( asbolute_comparison > 0 )
			{
				result = Duration.substract( Duration.from_duration( _duration_1, false ), Duration.from_duration( _duration_2, false ) );
				result.m_negative = _duration_1.m_negative;
			}
			else if( asbolute_comparison < 0 )
			{
				result = Duration.substract( Duration.from_duration( _duration_2, false ), Duration.from_duration( _duration_1, false ) );
				result.m_negative = _duration_2.m_negative;
			}
			else
				result = Duration.from_string( "00:00:00" );
		}
		else if( negatives_count == 2 )
		{
		}
		else
		{
			result.m_seconds = _duration_1.m_seconds + _duration_2.m_seconds;
			result.m_minuts = _duration_1.m_minuts + _duration_2.m_minuts;
			result.m_hours = _duration_1.m_hours + _duration_2.m_hours;

			if( result.m_seconds >= 60 )
			{
				result.m_seconds -= 60;
				++result.m_minuts;
			}

			if( result.m_minuts >= 60 )
			{
				result.m_minuts -= 60;
				++result.m_hours;
			}
		}

		return result;
	}

	/* **********************************************************
	*  Substract the given duration to the current one
	*/
	substract( _duration )
	{
		this.copy( Duration.substract( this, _duration ) );
	}

	/* **********************************************************
	*  Substract two durations together
	*  Return a new Duration object, result of the substraction
	*/
	static substract( _duration_1, _duration_2 )
	{
		const negatives_count = _duration_1.m_negative + _duration_2.m_negative;

		let result = new Duration();

		if( negatives_count == 1 )
		{
		}
		else if( negatives_count == 2 )
		{
		}
		else
		{
			result.m_hours = _duration_1.m_hours - _duration_2.m_hours;
			result.m_minuts = _duration_1.m_minuts - _duration_2.m_minuts;
			result.m_seconds = _duration_1.m_seconds - _duration_2.m_seconds;

			if( result.m_seconds < 0 )
			{
				result.m_seconds += 60;
				--result.m_minuts;
			}

			if( result.m_minuts < 0 )
			{
				result.m_minuts += 60;
				--result.m_hours;
			}
		}

		return result;
	}
}