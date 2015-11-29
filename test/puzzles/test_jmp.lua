function get_name()
	return "TEST-JMP"
end

function get_description()
	return {
		"A TEST FOR COMPARISON WITH GAME JUMP INSTRUCTIONS"
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
		{"NOP", "LBL: NOP", "JMP LBL"}, {}, {"ADD 1"}, {"SUB 32", "MOV ACC UP"},
		{"JRO 3", "", "NOP", "NOP", "NOP", "", "NOP", "JRO DOWN"}, {}, {}, {},
		{"SUB 32", "MOV ACC UP"}, {}, {}, {}
	}
end

function get_test_cycles()
	return 9;
end

function get_test_result(puzzle)
	return puzzle:getNode(0, 0).currentop == 1 and
		puzzle:getNode(0, 1).currentop == 3 and
		puzzle:getNode(0, 2).currentop == 1 and
		puzzle:getNode(0, 2).acc == -96 and
		puzzle:getNode(2, 0).acc == 9 and
		puzzle:getNode(3, 0).currentop == 1 and
		puzzle:getNode(3, 0).acc == -32
end