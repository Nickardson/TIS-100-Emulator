function get_name()
	return "TEST-BUSY-LOOP"
end

function get_description()
	return {
		"A TEST DEMONSTRATING A PRECISELY 100,000 CYCLE SOLUTION",
		"IT ALSO SERVES AS A GOOD BENCHMARK"
	}
end

function get_streams()
	return {}
end

function get_layout() 
	return {
		TILE_COMPUTE,	TILE_DAMAGED,	TILE_COMPUTE,	TILE_COMPUTE,
		TILE_COMPUTE,	TILE_DAMAGED,	TILE_COMPUTE,	TILE_DAMAGED,
		TILE_COMPUTE,	TILE_DAMAGED,	TILE_COMPUTE,	TILE_COMPUTE
	}
end

function get_initial()
	return {
		{"BIGLOOP:", "MOV 90, ACC", "", "SUBLOOP:", "SUB 1", "JGZ SUBLOOP", "", "MOV 1 DOWN", "MOV DOWN ACC", "JGZ BIGLOOP", "", "CONT:", "MOV UP DOWN", "JMP CONT"}, {}, {"MOV RIGHT DOWN", "", "##SUPER LONG HAUL"}, {"MOV UP LEFT"},
		{"MOV 537 ACC", "", "SUBLOOP:", "SUB UP", "MOV ACC UP", "JGZ SUBLOOP", "", "CONT:", "MOV UP DOWN", "JMP CONT"}, {}, {"MOV UP DOWN"}, {},
		{"MOV UP DOWN"}, {}, {"MOV UP RIGHT"}, {"MOV LEFT DOWN"}
	}
end