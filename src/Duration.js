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
		let negatives_count = _duration_1.m_negative;
		negatives_count += _duration_2.m_negative;

		let result = new Duration();

		if( negatives_count == 1 )
		{
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
		let negatives_count = _duration_1.m_negative;
		negatives_count += _duration_2.m_negative;

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