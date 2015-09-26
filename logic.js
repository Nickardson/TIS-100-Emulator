/**
 * Enum representing a type of stream, ie required output
 * @type {Enum}
 */
var StreamType = {
	STREAM_INPUT: 1,
	STREAM_OUTPUT: 2,
	STREAM_IMAGE: 3
};

/**
 * Enum representing the type a cell is.
 * @type {Enum}
 */
var TileType = {
	TILE_COMPUTE: 1,
	TILE_MEMORY: 2,
	TILE_DAMAGED: 3
}

/**
 * A direction.
 * @type {Object}
 */
var Direction = {
	NONE: 0,
	UP: 1,
	RIGHT: 2,
	DOWN: 3,
	LEFT: 4
}

/**
 * A cell in a computer. Contains information representing it's state, location, instructions, etc.
 * @param {Integer} x    Position of the cell
 * @param {Integer} y    Position of the cell
 * @param {TileType} type Type of the cell
 */
function Cell(x, y, type) {
	this.x = x;
	this.y = y;

	/**
	 * The type of the cell
	 * @type {TileType}
	 */
	this.type = type;

	/**
	 * If cell is a TILE_COMPUTE, used as an Array of strings
	 * @type {String[]}
	 */
	this.instructions = [];

	/**
	 * If cell is a TILE_MEMORY, used as a FILO stack
	 */
	this.stack = [];

	/**
	 * Value contained in the ACC
	 * @type {Number}
	 */
	this.acc = 0;

	/**
	 * Value contained in the BAK
	 * @type {Number}
	 */
	this.bak = 0;

	/**
	 * Direction last read from using ANY
	 * @type {Direction}
	 */
	this.last = Direction.NONE;

	/**
	 * Number of cycles this cell has been active. used to determine idle %
	 * @type {Number}
	 */
	this.cyclesactive = 0;
}

Cell.prototype.pushStack = function(val) {
	// TODO: update graphics
	this.stack.push(val);
};

Cell.prototype.popStack = function() {
	// TODO: update graphics
	return stack.pop();
};

/**
 * A puzzle class
 * @param {String} name        The name of the puzzle
 * @param {String[]} description An array of descriptions, IE the rules.
 * @param {[[StreamType type, String name, Int columnIndex, Number[] values]]} streams      A list of streams, IE the inputs of the puzzle
 * @param {NodeType[]} layout      An array of NodeTypes IE TILE_COMPUTE.
 * @param {Int} width 			(Optional) The width of the puzzle. Defaults to 4.
 * @param {Int} height 			(Optional) The height of the puzzle. Defaults to 3.
 */
function Puzzle(name, description, streams, layout, width, height) {
	this.width = width || 4;
	this.height = height || 3;

	this.name = name;
	this.description = description;
	this.streams = streams;
	this.layout = layout;

	// key: the column, value: the stream as an array
	this.columnsIn = [];
	this.columnsOut = [];
	
	// key: the column of the output; value: an array of the elements where the values are outputted for that stream.
	this.streamsOutput = [];

	this.arrows;

	/**
	 * 2d array, cells[y][x], 0-based
	 * @type {Cell[][]}
	 */
	this.cells = [];

	/**
	 * 2d array, cellElements[y][x], 0-based
	 * Filled in when Puzzle.display is called
	 * @type {JqueryElement[][]{element, instructionElement, srcElement, accElement, bakElement, lastElement, modeElement, idleElement, stackElement}}
	 */
	this.cellElements;

	for (var y = 0; y < this.height; y++) {
		this.cells[y] = [];
		for (var x = 0; x < this.width; x++) {
			this.cells[y][x] = new Cell(x, y, this.layout[y * this.width + x]);
		}
	}
}

/**
 * Sets the output value for display
 * @param {Number} column   The index of the column
 * @param {Number} outindex The index of the output, ie 3 being the fourth output
 * @param {Number} value    The value to set the output to
 */
Puzzle.prototype.setOutput = function(column, outindex, value) {
	// puzzle may be not displayed
	if (this.streamsOutput[column] != undefined) {
		var e = this.streamsOutput[column][outindex];
		e.html(value);

		if (value != this.columnsOut[column][3][outindex]) {
			e.addClass('outputwrong');
		} else {
			e.removeClass('outputwrong');
		}
	}
};

/**
 * Displays this puzzle as in the window.
 */
Puzzle.prototype.display = function() {
	$('#test_name').text(this.name);

	var io_titles = $('#io_titles').empty();
	var io_data = $('#io_data').empty();

	for (var i = 0; i < this.streams.length; i++) {
		var stream = this.streams[i];

		if (stream[0] == StreamType.STREAM_INPUT) {
			this.columnsIn[stream[2]] = stream;
		} else if (stream[0] == StreamType.STREAM_OUTPUT) {
			this.columnsOut[stream[2]] = stream;

			this.streamsOutput[stream[2]] = [];
		}

		$('<td>').text(stream[1]).appendTo(io_titles);

		var table = $('<td><table class="datalist"></table></td>').appendTo(io_data).find('table');
		for (var j = 0; j < stream[3].length; j++) {
			var row = $('<tr></tr>').appendTo(table);
			
			// TODO: implement STREAM_IMAGE
			if (stream[0] != StreamType.STREAM_IMAGE) {
				$('<td>').html(stream[3][j]).appendTo(row);
			}
			if (stream[0] == StreamType.STREAM_OUTPUT) {
				this.streamsOutput[stream[2]][j] = $('<td>').appendTo(row);
				table.addClass('table2row');
			}
		}
		
	}

	var field = createField(this);
	this.cellElements = field.cells;
	this.arrows = field.arrows;

	$('#computercontainer').empty().append(field.computer);



	active_puzzle = this;
};

/**
 * Prepares a Lua state to be run with a puzzle by injecting needed constants
 * @param  {Lua.State} state The state to inject
 */
function prepareLuaPuzzleState (L) {
	for (var key in TileType) {
		L.pushnumber(TileType[key]);
		L.setglobal(key);
	}
	for (var key in StreamType) {
		L.pushnumber(StreamType[key]);
		L.setglobal(key);
	}

	L.execute('function _G._tablelen(t) return #t end');
}

/**
 * Gets the length of a given lua table
 * @param  {LuaTable} table The table to get the length of. equivalent to '#table'
 * @return {Integer}       The size of the table.
 */
function lua_table_length(L, table) {
	L.push(L._G.get('_tablelen'));
	L.push(table);
	L.pcall(1, 1, 0);
	var n = L.tonumber(-1);
	L.pop(1);
	return n;
}

/**
 * Turns a number-key-only lua table into a javascript array
 * @param  {LuaTable} table The table to be converted
 * @return {Array}       An array of the table's elements, 0-indexed
 */
function lua_table_to_array(L, table) {
	var stacky = [];
	for (var j = 1; j <= lua_table_length(L, table); j++) {
		stacky.push(table.get(j));
	}
	return stacky;
}

$.get('/puzzles/01_diagnostic.lua', function (data) {
	var L = new Lua.State();
	prepareLuaPuzzleState(L);
	
	L.execute(data);

	var get_name		= L.execute("return get_name")[0];
	var get_description = L.execute("return get_description")[0];
	var get_streams		= L.execute("return get_streams")[0];
	var get_layout		= L.execute("return get_layout")[0];

	var name = "NO NAME PROVIDED",
		description = [],
		streams = [],
		layout = [];

	var alerts = [];

	if (typeof(get_name) !== "function") {
		alerts.push('Puzzle does not declare a "get_name" function returning a string.');
	} else {
		name = get_name() + "";
	}

	if (typeof(get_description) !== "function") {
		// alerts.push('Puzzle does not declare a "get_description" function returning an array of strings.');
		description = ['No help given.'];
	} else {
		var t = get_description();
		for (var i = 1; i <= lua_table_length(L, t); i++) {
			description.push(t.get(i));
		}
	}

	if (typeof(get_streams) !== "function") {
		alerts.push('Puzzle does not declare a "get_streams" function returning an array of {STREAM_INPUT or STREAM_OUTPUT or STREAM_IMAGE, String name, int column, int[] data}.');
	} else {
		var luaStreams = L.execute('return table.unpack(get_streams())');

		for (var i = 0; i < luaStreams.length; i++) {
			streams.push([
				luaStreams[i].get(1),
				luaStreams[i].get(2),
				luaStreams[i].get(3),
				lua_table_to_array(L, luaStreams[i].get(4)),
			]);
		}
	}

	if (typeof(get_layout) !== "function") {
		alerts.push('Puzzle does not declare a "get_layout" function returning an array of 12 TILE_COMPUTE or TILE_MEMORY or TILE_DAMAGED.');
	} else {
		layout = lua_table_to_array(L, get_layout());
	}

	if (alerts.length > 0) {
		alert(alerts.join(' \n'));
		return;
	}

	console.log('name', name);
	console.log('description', description);
	console.log('streams', streams);
	console.log('layout', layout);

	var puzzle1 = new Puzzle(name, description, streams, layout);

	puzzle1.display();
	
	puzzle1.setOutput(0, 0, 1);
	
});