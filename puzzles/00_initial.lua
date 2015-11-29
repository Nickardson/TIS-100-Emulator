function get_name()
	return "SANDBOX"
end

function get_description()
	return {
		"TIS-100 Emulator",
		"Early Stages",
		"<a style=\"color:lightblue;\" href=\"https://steamcommunity.com/sharedfiles/filedetails/?id=456879799\">TIS-100 Manual</a>",
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
		TILE_COMPUTE,	TILE_COMPUTE,	TILE_COMPUTE,	TILE_COMPUTE,
		TILE_COMPUTE,	TILE_COMPUTE,	TILE_COMPUTE,	TILE_COMPUTE,
		TILE_COMPUTE,	TILE_COMPUTE,	TILE_COMPUTE,	TILE_COMPUTE
	}
end

function get_initial()
	return {
		{}, {"# COMMENT", "", "ADD ACC", "LABEL: ADD 1", "NEG", "JGZ LABEL"}, {"MOV 10 ACC", "", "START:", " SUB 1", "", "L: JGZ START", " ADD 20", " JRO -3"}, {},
		{}, {"ADD 1", "NEG", "", "SWP", "NEG"}, {}, {},
		{}, {}, {}, {}
	}
end