function get_name()
	return "TEST-ADD-SUB"
end

function get_description()
	return {
		"A TEST FOR COMPARISON WITH GAME ADD/SUB INSTRUCTIONS"
	}
end

function get_streams()
	return {}
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
		{"ADD 1"}, {"ADD -1"}, {"SUB 1"}, {"SUB -1", "ADD 0"}, -- Check basic arithmetic
		{"ADD 200"}, {"SUB 200"}, {}, {}, -- Check saturation
		{}, {}, {}, {}
	}
end

function get_test_cycles()
	return 10;
end

function get_test_result(puzzle)
	return puzzle:getNode(0, 0).acc == 10 and
		puzzle:getNode(1, 0).acc == -10 and
		puzzle:getNode(2, 0).acc == -10 and
		puzzle:getNode(0, 1).acc == 999 and
		puzzle:getNode(1, 1).acc == -999
end