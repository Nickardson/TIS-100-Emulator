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

		// TODO: replace with code in Display.js
		this.streamsOutput=[];
		
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

	Computer.prototype.getNode = function(x, y) {return this.nodes[y][x];};
	Computer.prototype.setNode = function(x, y, node) {this.nodes[y][x] = node;};

	/**
	 * Sets the output value for display
	 * @param {Number} column   The index of the column
	 * @param {Number} outindex The index of the output, ie 3 being the fourth output
	 * @param {Number} value    The value to set the output to
	 */
	Computer.prototype.setOutput = function(column, outindex, value) {
		// Computer may be not displayed
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
			this.eachNode(function (n) {n.currentop = 0;});
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