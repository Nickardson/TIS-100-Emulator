requirejs.config({
    baseUrl: 'js'
});

var the_puzzle;
var the_display;

require(['Display', 'PuzzleLoader', 'Computer', 'Node', 'Opcode'], function (Display, PuzzleLoader, Computer, Node, Opcode) {
	// use ctrl+arrow keys to move cursor around cells
	$('body').keydown(function (e) {
		if (the_puzzle == undefined) {
			return;
		}

		var isMove = false, relX = 0, relY = 0;
		if (e.ctrlKey) {
			// set to false in 'else'
			isMove = true;

			if (e.keyCode == 37) { // left
				relX = -1;
			} else if (e.keyCode == 38) { // up
				relY = -1;
			} else if (e.keyCode == 39) { // right
				relX = 1;
			} else if (e.keyCode == 40) { // down
				relY = 1;
			} else {
				isMove = false;
			}
		}

		if (isMove) {
			var f = $(':focus');
			if (f.hasClass('srcarea')) {
				var loc = f.attr('id').split('_');

				var x = loc[1] - 1 + relX;
				var y = loc[2] - 1 + relY;

				if (x >= 0 && x < COMPUTER_CELL_WIDTH && y >= 0 && y < COMPUTER_CELL_HEIGHT)
					the_puzzle.cells[y][x].srcElement.focus();

				return false;
			}
		}
	});


	PuzzleLoader.loadFromURL('puzzles/01_diagnostic.lua', function (puzzle1) {
		the_puzzle = puzzle1;

		puzzle1.display();

		{
			// puzzle1.setTextAt(0, 0, "add 112\nsub 11\nmov acc down");
			var cell = puzzle1.getNode(0, 0);
			if (cell) {
				cell.instructions = ['ADD 112', 'ADD -11', 'MOV ACC DOWN'];
				cell.opcodes.push(Opcode.ADD(cell, {constant: 112}));
				cell.opcodes.push(Opcode.ADD(cell, {constant: -11}));
				cell.opcodes.push(Opcode.MOV(cell, Node.DataLocation.ACC, Node.DataLocation.DOWN));
			}
		}
		{
			// puzzle1.setTextAt(0, 1, "mov up acc\nnop\nnop\nnop");
			var cell = puzzle1.getNode(0, 1);
			if (cell) {
				cell.instructions = ['MOV UP ACC', 'NOP', 'NOP', 'NOP'];
				cell.opcodes.push(Opcode.MOV(cell, Node.DataLocation.UP, Node.DataLocation.ACC));
				cell.opcodes.push(Opcode.NOP(cell));
				cell.opcodes.push(Opcode.NOP(cell));
				cell.opcodes.push(Opcode.NOP(cell));
			}
		}

		{
			// puzzle1.setTextAt(0, 0, "add 112\nsub 11\nmov acc down");
			var cell = puzzle1.getNode(2, 1);
			if (cell) {
				cell.instructions = ['ADD 112', 'ADD -11', 'MOV ACC UP'];
				cell.opcodes.push(Opcode.ADD(cell, {constant: 112}));
				cell.opcodes.push(Opcode.ADD(cell, {constant: -11}));
				cell.opcodes.push(Opcode.MOV(cell, Node.DataLocation.ACC, Node.DataLocation.UP));
			}
		}
		{
			// puzzle1.setTextAt(0, 1, "mov up acc\nnop\nnop\nnop");
			var cell = puzzle1.getNode(2, 0);
			if (cell) {
				cell.instructions = ['MOV DOWN ACC', 'NOP', 'NOP', 'NOP'];
				cell.opcodes.push(Opcode.MOV(cell, Node.DataLocation.DOWN, Node.DataLocation.ACC));
				cell.opcodes.push(Opcode.NOP(cell));
				cell.opcodes.push(Opcode.NOP(cell));
				cell.opcodes.push(Opcode.NOP(cell));
			}
		}

		{
			// puzzle1.setTextAt(0, 1, "mov up acc\nnop\nnop\nnop");
			var cell = puzzle1.getNode(0, 2);
			if (cell) {
				cell.instructions = ['Add 1', 'ADD ACC'];
				cell.opcodes.push(Opcode.ADD(cell, {constant: 1}));
				cell.opcodes.push(Opcode.ADD(cell, Node.DataLocation.ACC));
			}
		}
		
		puzzle1.start();
		
		puzzle1.setOutput(0, 0, 1);

		the_display = new Display.ComputerDisplay(puzzle1);


	})


	var shouldTick = false;
	setInterval(function () {
		if (shouldTick) {
			the_puzzle.tick();
			the_display.update();
		}
	}, 100);

	$('#btn_stop').click(function(){
		shouldTick = false;

		the_puzzle.stop();
		the_display.update();
	});

	$('#btn_step').click(function(){
		shouldTick = false;
		
		the_puzzle.tick();
		the_display.update();
	});

	$('#btn_run').click(function(){
		shouldTick = true;
	});

	$('#btn_fast').click(function(){
		shouldTick = true;
	});
});