requirejs.config({
    baseUrl: 'js',

    paths: {
    	lua: '../lua',
    	puzzles: '../puzzles',
    	text: 'lib/text'
    }
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

	PuzzleLoader.loadFromURL('puzzles/00_initial.lua', function (puzzle1) {
		the_puzzle = puzzle1;
		
		puzzle1.start();
		
		the_display = new Display.ComputerDisplay(puzzle1);
		the_display.setEditable(true);
		/*for (var i = 0; i < 39; i++) {
			the_display.setOutput(0, i, 10+Math.floor(Math.random()*10));
		}*/
	})

	// Run: 50 ops per second
	// Fast: 5000? ops per second
	var shouldTick = false,
		ticksPer = 1;
	setInterval(function () {
		if (shouldTick) {
			for (var i = 0; i < ticksPer; i++) {
				the_puzzle.tick();
			}
			the_display.update();
		}
	}, 1000 / 30);

	$('#btn_stop').click(function(){
		the_display.setEditable(true);
		shouldTick = false;
		ticksPer = 1;

		the_puzzle.stop();
		the_display.update();
	});

	$('#btn_step').click(function(){
		the_display.setEditable(false);
		shouldTick = false;
		ticksPer = 1;
		the_puzzle.tick();
		the_display.update();
	});

	$('#btn_run').click(function(){
		the_display.setEditable(false);
		shouldTick = true;
		ticksPer = 1;
	});

	$('#btn_fast').click(function(){
		the_display.setEditable(false);
		shouldTick = true;
		ticksPer = 150;
	});

	$('#btn_ultrafast').click(function(){
		the_display.setEditable(false);
		shouldTick = true;
		ticksPer = 1234; // TODO: makes the cycle count look fancy, but should this be a rounder number?
	});
});

/**
 * Tests puzzle iteration speed, not including displaying the puzzle
 * @param  {Number} iterations (Optional) The number of iterations to run, defaults to 1000
 * @return {Number}            Number of milliseconds it took to run.
 */
function speedTest1(iterations) {
	iterations = iterations || 1000;
	
	the_display.update();

	var start = Date.now();
	for (var i = 0; i < iterations; i++) {
		the_puzzle.tick();
	}
	var end = Date.now();

	the_display.update();

	console.log('Finished speed test with', iterations, 'iterations, taking ', end-start, 'ms');
	return end-start;
}

/**
 * Tests puzzle iteration speed, including displaying the puzzle
 * @param  {Number} iterations (Optional) The number of iterations to run, defaults to 1000
 * @return {Number}            Number of milliseconds it took to run.
 */
function speedTest2(iterations) {
	iterations = iterations || 1000;
	
	var start = Date.now();
	for (var i = 0; i < iterations; i++) {
		the_puzzle.tick();
		the_display.update();
	}
	var end = Date.now();

	console.log('Finished speed test with', iterations, 'iterations, taking ', end-start, 'ms');
	return end-start;
}