define(['Node'], function (Node) {
	/**
	 * A Computer class, representing the logic side of a puzzle
	 * @param {String} name        The name of the Computer
	 * @param {String[]} description An array of descriptions, IE the rules.
	 * @param {[[StreamType type, String name, Int columnIndex, Number[] values]]} streams      A list of streams, IE the inputs of the Computer
	 * @param {NodeType[]} layout      An array of NodeTypes IE TILE_COMPUTE.
	 * @param {Int} width 			(Optional) The width of the Computer. Defaults to 4.
	 * @param {Int} height 			(Optional) The height of the Computer. Defaults to 3.
	 */
	var Computer = function(name, description, streams, layout, width, height) {
		this.width			= width || Computer.DEFAULT_WIDTH;
		this.height 		= height || Computer.DEFAULT_HEIGHT;
		this.name 			= name;
		this.description	= description;
		this.streams 		= streams;
		this.layout 		= layout;

		this.cycle = 0;

		// key: the column, value: the stream as an array
		this.columnsIn = [];
		this.columnsOut = [];

		/**
		 * 2d array, cells[y][x], 0-based
		 * @type {Node[][]}
		 */
		this.nodes = [];
		for (var y = 0; y < this.height; y++) this.nodes[y] = [];

		for (var y = 0; y < this.height; y++) {
			for (var x = 0; x < this.width; x++) {
				this.setNode(x, y, new Node(this, x, y, this.layout[y * this.width + x]));
			}
		}
	}

	Computer.prototype.getNode = function(x, y) {
		try {
			return this.nodes[y][x];
		} catch (ex) {
			return undefined;
		}
	};

	Computer.prototype.setNode = function(x, y, node) {
		if (this.nodes[y] == undefined) {
			this.nodes[y] = [];
		}

		this.nodes[y][x] = node;
	};

	/**
	 * Runs the given function for each node, with the node as the first argument.
	 * @param  {Function} f Function called over each node
	 */
	Computer.prototype.eachNode = function(f) {
		for (var y = 0; y < this.height; y++) {
			for (var x = 0; x < this.width; x++) {
				f(this.getNode(x, y));
			}
		}
	};

	Computer.prototype.tick = function() {
		// first tick, sets up the codes.
		if (this.cycle === 0) {
			this.eachNode(function (n) {
				if (n.opcodes.length != 0) {
					n.currentop = 0;
				}
			});
		} else {
			for (var i = 0; i < 2; i++) {
				this.eachNode(function (n) {n.tick();});
			}
			this.eachNode(function (n) {n.post();});
		}

		this.cycle++;
	};

	Computer.prototype.start = function() {
		this.eachNode(function (n) {
			// TODO: swap out user interaction for instruction list
		});
	};

	Computer.prototype.stop = function() {
		this.eachNode(function (n) {n.reset();});
		this.cycle = 0;
	};

	/**
	 * Number of nodes in a computer, lengthwise.
	 * @type {Number}
	 */
	Computer.DEFAULT_WIDTH = 4;

	/**
	 * Number of nodes in a computer, heightwise.
	 * @type {Number}
	 */
	Computer.DEFAULT_HEIGHT = 3;

	/**
	 * Enum representing a type of stream, ie required output
	 * @type {Enum}
	 */
	Computer.StreamType = {
		STREAM_INPUT: 1,
		STREAM_OUTPUT: 2,
		STREAM_IMAGE: 3
	};

	return Computer;
});