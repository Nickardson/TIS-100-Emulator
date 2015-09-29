define(['Node', 'Computer'], function (Node, Computer) {
	var PuzzleLoader = {};

	/**
	 * Prepares a Lua state to be run with a puzzle by injecting needed constants
	 * @param  {Lua.State} state The state to inject
	 */
	function prepareLuaPuzzleState (L) {
		for (var key in Node.Type) {
			L.pushnumber(Node.Type[key]);
			L.setglobal(key);
		}
		for (var key in Computer.StreamType) {
			L.pushnumber(Computer.StreamType[key]);
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

	/**
	 * Creates a computer from the given Lua puzzle string.
	 * @param  {String} data The Lua source code to create a puzzle.
	 * @throws {Error} If a puzzle does not contain one of the functions
	 * @return {Computer}      A created computer.
	 */
	PuzzleLoader.loadFromString = function (data) {
		var L = new Lua.State();
		prepareLuaPuzzleState(L);
		
		L.execute(data);

		var get_name		= L.execute("return get_name")[0];
		var get_description = L.execute("return get_description")[0];
		var get_streams		= L.execute("return get_streams")[0];
		var get_layout		= L.execute("return get_layout")[0];


		if (typeof(get_name) !== "function")
			throw new Error('Puzzle does not define a "get_name" function returning a string.');
		if (typeof(get_description) !== "function")
			throw new Error('Puzzle does not declare a "get_description" function returning an array of strings.');
		if (typeof(get_streams) !== "function")
			throw new Error('Puzzle does not declare a "get_streams" function returning an array of {STREAM_INPUT or STREAM_OUTPUT or STREAM_IMAGE, String name, int column, int[] data}.');
		if (typeof(get_layout) !== "function")
			throw new Error('Puzzle does not declare a "get_layout" function returning an array of 12 TILE_COMPUTE or TILE_MEMORY or TILE_DAMAGED.');
		
		var name = get_name() + "",
			description = [],
			streams = [],
			layout = [];
		
		var t = get_description();
		for (var i = 1; i <= lua_table_length(L, t); i++) {
			description.push(t.get(i));
		}

		var luaStreams = L.execute('return table.unpack(get_streams())');

		for (var i = 0; i < luaStreams.length; i++) {
			streams.push([
				luaStreams[i].get(1),
				luaStreams[i].get(2),
				luaStreams[i].get(3),
				lua_table_to_array(L, luaStreams[i].get(4)),
			]);
		}
		
		layout = lua_table_to_array(L, get_layout());

		var puzzle = new Computer(name, description, streams, layout);
		puzzle.lua = L;
		return puzzle;
	};

	PuzzleLoader.loadFromURL = function (url, callback) {
		$.get(url, function (data) {
			callback(PuzzleLoader.loadFromString(data));
		});
	};

	return PuzzleLoader;
});