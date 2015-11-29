requirejs.config({
    baseUrl: '../js',

    paths: {
    	lua: '../lua',
    	puzzles: '../puzzles',
    	text: 'lib/text'
    }
});

var TESTS = [
	'puzzles/test_add_sub.lua',
	'puzzles/test_any.lua',
	'puzzles/test_jmp.lua',
];

require(['PuzzleLoader', 'Computer', 'Node', 'Opcode'], function (PuzzleLoader, Computer, Node, Opcode) {
	TESTS.forEach(function (test) {
		QUnit.test("Test Puzzle - " + test, function(assert) {
			var async = assert.async(1);
			PuzzleLoader.loadFromURL(test, function (puzzle) {
				assert.ok(PuzzleLoader.test(puzzle), "Test Puzzle State is correct.");
				async();
			})
		});
	});
});
