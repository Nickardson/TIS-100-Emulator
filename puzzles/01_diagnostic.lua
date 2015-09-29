function get_name()
	return "SELF-TEST DIAGNOSTIC"
end

function get_description()
	return {
		"> READ A VALUE FROM IN.X AND WRITE THE VALUE TO OUT.X",
		"> READ A VALUE FORM IN.A AND WRITE THE VALUE TO OUT.A"
	}
end

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

function get_layout() 
	return {
		TILE_COMPUTE,	TILE_DAMAGED,	TILE_COMPUTE,	TILE_COMPUTE,
		TILE_COMPUTE,	TILE_DAMAGED,	TILE_COMPUTE,	TILE_MEMORY,
		TILE_COMPUTE,	TILE_DAMAGED,	TILE_COMPUTE,	TILE_COMPUTE
	}
end