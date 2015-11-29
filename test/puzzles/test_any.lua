function get_name()
	return "TEST-ANY"
end

function get_description()
	return {
		"A TEST FOR COMPARISON WITH THE ANY LOCATION"
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
		{"MOV 3 RIGHT", "END: JMP END"}, {"MOV ANY ACC", "MOV ACC DOWN"}, {"MOV ANY ACC", "MOV ACC LEFT"}, {},
		{}, {"MOV ANY ACC", "MOV ACC RIGHT"}, {"MOV ANY ACC", "MOV ACC UP"}, {},
		{}, {}, {"MOV 1 UP", "END: JMP END"}, {}
	}
end

function get_test_cycles()
	return 10;
end

function get_test_result(puzzle)
	return puzzle:getNode(1, 0).acc == 3 and
		puzzle:getNode(2, 0).acc == 3 and
		puzzle:getNode(1, 1).acc == 1 and
		puzzle:getNode(2, 1).acc == 1
end