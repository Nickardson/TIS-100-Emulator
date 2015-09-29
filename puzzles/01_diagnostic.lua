-- The function get_name() should return a single string that is the name of the puzzle.
--
function get_name()
	return "SELF-TEST DIAGNOSTIC"
end

-- The function get_description() should return an array of strings, where each string is
-- a line of description for the puzzle. The text you return from get_description() will 
-- be automatically formatted and wrapped to fit inside the puzzle information box.
--
function get_description()
	return {
		"READ A VALUE FROM IN.X AND WRITE THE VALUE TO OUT.X",
		"READ A VALUE FORM IN.A AND WRITE THE VALUE TO OUT.A"
	}
end

-- The function get_streams() should return an array of streams. Each stream is described
-- by an array with exactly four values: a STREAM_* value, a name, a position, and an array
-- of integer values between -999 and 999 inclusive.
--
-- STREAM_INPUT: An input stream containing up to 39 numerical values.
-- STREAM_OUTPUT: An output stream containing up to 39 numerical values.
-- STREAM_IMAGE: An image output stream, containing exactly 30*18 numerical values between 0
--               and 4, representing the full set of "pixels" for the target image.
--
-- NOTE: Arrays in Lua are implemented as tables (dictionaries) with integer keys that start
--       at 1 by convention. The sample code below creates an input array of 39 random values
--       and an output array that doubles all of the input values.
--
-- NOTE: To generate random values you should use math.random(). However, you SHOULD NOT seed
--       the random number generator with a new seed value, as that is how TIS-100 ensures that
--       the first test run is consistent for all users, and thus something that allows for the
--       comparison of cycle scores.
--
-- NOTE: Position values for streams should be between 0 and 3, which correspond to the far
--       left and far right of the TIS-100 segment grid. Input streams will be automatically
--       placed on the top, while output and image streams will be placed on the bottom.
--
function get_streams()
	local inData1 = {}
	local inData2 = {}

	for i = 1, 39 do
		inData1[i] = math.random(10, 99);
		inData2[i] = math.random(10, 99);
	end

	return {
		{STREAM_INPUT, "IN.X", 0, inData1},
		{STREAM_INPUT, "IN.A", 3, inData2},
		{STREAM_OUTPUT, "OUT.X", 0, inData1},
		{STREAM_OUTPUT, "OUT.A", 3, inData2},
	}
end

-- The function get_layout() should return an array of exactly 12 TILE_* values, which
-- describe the layout and type of tiles found in the puzzle.
--
-- TILE_COMPUTE: A basic execution node (node type T21).
-- TILE_MEMORY: A stack memory node (node type T30).
-- TILE_DAMAGED: A damaged execution node, which acts as an obstacle.
--
function get_layout() 
	return {
		TILE_COMPUTE,	TILE_DAMAGED,	TILE_COMPUTE,	TILE_COMPUTE,
		TILE_COMPUTE,	TILE_DAMAGED,	TILE_COMPUTE,	TILE_MEMORY,
		TILE_COMPUTE,	TILE_DAMAGED,	TILE_COMPUTE,	TILE_COMPUTE
	}
end

-- The function get_segment() is optional, and not part of TIS-100 specification.
-- It's used to manually assign a SPEC number, and can be removed without hurting anything.
-- 
function get_segment()
	return 00150;
end