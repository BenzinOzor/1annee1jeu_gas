const SECONDS_IN_MINUTE = 60;
const SECONDS_IN_HOUR = (60 * SECONDS_IN_MINUTE);
const SECONDS_IN_DAY = (24 * SECONDS_IN_HOUR);
const SECONDS_IN_YEAR = (365 * SECONDS_IN_DAY);

class Duration
{
	constructor( _duration = "0:00:00" )
	{
		const duration_parts = _duration.split( ":" );
		let hours = 0;
		let minutes = 0;
		let seconds = 0;

		if( duration_parts.length > 0 )
			hours = parseInt( duration_parts[ 0 ], 10 );

		if( duration_parts.length > 1 )
			minutes = parseInt( duration_parts[ 1 ], 10 );

		if( duration_parts.length > 2 )
			seconds = parseInt( duration_parts[ 2 ], 10 );

		// If the given time is negative, we have to use the absolute value of the hours here, otherwise the sum will be wrong.
		// -10:00:01 => -3600 + 1 => 35999 when it should be 36001.
		this.m_seconds = Math.abs( hours ) * SECONDS_IN_HOUR + minutes * SECONDS_IN_MINUTE + seconds;

		// checking the first character of the string for sign. if hours are 0, it won't be detected otherwise
		if( _duration[ 0 ] == '-' )
			this.m_seconds *= -1;
	}

	/* **********************************************************
	*  Format a string with hours, minuts and second values formated 00:00:00
	*/
	toString()
	{
		const abs_seconds = Math.abs( this.m_seconds );
		// We have to use the absolute value of the seconds because the floor function won't go in the right direction in negative.
		const hours = Math.floor( abs_seconds / SECONDS_IN_HOUR );
		const minutes = Math.floor( (abs_seconds % SECONDS_IN_HOUR) / SECONDS_IN_MINUTE );
		const seconds = abs_seconds % SECONDS_IN_MINUTE;

		return (this.m_seconds < 0 ? '-' : '') + zero_pad( hours, 1 ) + ':' + zero_pad( minutes, 2 ) + ':' + zero_pad( seconds, 2 );
	}

	/* **********************************************************
	*  Compare two strings containing durations and tell which is greater than the other
	*  Return 1 if _duration is smaller, -1 if _duration is greater, or 0 if durations are equal
	*/
	compare( _duration, _absolute = false )
	{
		return Duration.compare( this, _duration, _absolute );
	}

	/* **********************************************************
	*  Compare two strings containing durations and tell which is greater than the other
	*  Return 1 if _duration_1 is greater, 1 if _duration_2 is greater, or 0 if durations are equal
	*/
	static compare( _duration_1, _duration_2, _absolute = false )
	{
		if( _absolute )
		{
			const abs_1 = Math.abs( _duration_1.m_seconds );
			const abs_2 = Math.abs( _duration_2.m_seconds );

			return abs_1 > abs_2 ? 1 : (abs_1 < abs_2 ? -1 : 0);
		}

		return _duration_1.m_seconds > _duration_2.m_seconds ? 1 : (_duration_1.m_seconds < _duration_2.m_seconds ? -1 : 0);
	}

	copy( _duration )
	{
		this.m_seconds = _duration.m_seconds;
	}

	static copy( _duration )
	{
		let result = new Duration();

		result.m_seconds = _duration.m_seconds;
		
		return result;
	}

	/* **********************************************************
	*  Add the given duration to the current one
	*/
	add( _duration )
	{
		this.m_seconds += _duration.m_seconds;
	}

	/* **********************************************************
	*  Add two durations together
	*  Return a new Duration object, result of the addition
	*/
	static add( _duration_1, _duration_2 )
	{
		let result = new Duration();

		result.m_seconds = _duration_1.m_seconds + _duration_2.m_seconds;
		
		return result;
	}

	/* **********************************************************
	*  Substract the given duration to the current one
	*/
	substract( _duration )
	{
		this.m_seconds -= _duration.m_seconds;
	}

	/* **********************************************************
	*  Substract two durations together
	*  Return a new Duration object, result of the substraction
	*/
	static substract( _duration_1, _duration_2 )
	{
		let result = new Duration();

		result.m_seconds = _duration_1.m_seconds - _duration_2.m_seconds;

		return result;
	}

	/* **********************************************************
	*  Divide duration by a given number
	*/
	divide( _number )
	{
		if( _number != 0 )
			this.m_seconds = Math.round( this.m_seconds / _number );
	}

	/* **********************************************************
	*  Divide the given duration by the given number
	*  Return a new Duration object, result of the division
	*/
	static divide( _duration, _number )
	{
		let result = new Duration();

		if( _number != 0 )
			result.m_seconds = Math.round( _duration.m_seconds / _number );

		return result;
	}
}
