define([], function () {
	/**
	 * A Node in a computer. Contains information representing it's state, location, instructions, etc.
	 * @param {Computer} computer    The computer which contains this node.
	 * @param {Integer} x    Position of the Node
	 * @param {Integer} y    Position of the Node
	 * @param {TileType} type Type of the Node
	 */
	function Node(computer, x, y, type) {
		/**
		 * X coordinate of node in the computer, 0-based.
		 * @type {Number}
		 */
		this.x = x;
		
		/**
		 * X coordinate of node in the computer, 0-based.
		 * @type {Number}
		 */
		this.y = y;

		/**
		 * The type of the Node
		 * @type {Node.Type}
		 */
		this.type = type;

		/**
		 * If Node is a TILE_COMPUTE, used as an Array of strings
		 * @type {String[]}
		 */
		this.instructions = [];

		/**
		 * If Node is a TILE_COMPUTE, opcodes are functions representing Node instructions
		 * @type {Opcode[]}
		 */
		this.opcodes = [];

		/**
		 * A map of label names->opcode indices
		 * @type {Map{name->index}}
		 */
		this.labels = {};

		/**
		 * A map which relates the index of an opcode to the instruction line
		 * @type {Map{opcode index->instruction index}}
		 */
		this.opcodeLines = {};

		/**
		 * If Node is a TILE_MEMORY, used as a FILO stack of numbers.
		 */
		this.stack = [];

		/**
		 * the index of the operation which is currently highlighted.
		 * if the currentop is -1, it is set to 0 at the end of the tick.
		 * 
		 * during a tick, the current op is run.
		 * 
		 * if the operation finishes, at the end of the tick, the current op increases.
		 * if the operation must wait, the currentop remains the same. The backend function is called again each tick.
		 * @type {Number}
		 */
		this.currentop = -1;

		/**
		 * Represents how many cycles have passed while the current opcode is running.
		 * The first time an opcode is run, stalled=0. On the second tick, stalled is 1, etc.
		 * @type {Number}
		 */
		this.stalled = 0;

		/**
		 * With only one pass, effects on the nodes are order-dependant based on position.
		 * To avoid this, two passes are made to allow all nodes to read what another may have written.
		 * The doneTick flag denotes that the current Opcode should not be run again this tick.
		 * An operation waiting on a read should leave doneTick false so it can get another pass, for example.
		 * @type {Boolean}
		 */
		this.doneTick = false;
		
		/**
		 * The direction data will go later. Used to set 'dest' once the tick's logic is completed.
		 * If DataLocation.NONE, no data is queued
		 * @type {DataLocation}
		 */
		this.queuedDest = Node.DataLocation.NONE;

		/**
		 * The data that will go later. Used to set 'data' once the tick's logic is completed
		 * If undefined, no data is available
		 * @type {Number}
		 */
		this.queuedData = undefined;

		/**
		 * Represents the direction the value stored in an 'arrow' is allowed to go, which an adjacent node can read.
		 * @type {DataLocation}
		 */
		this.dest = Node.DataLocation.NONE;

		/**
		 * The data which is stored in an 'arrow' to another node.
		 * @type {Number}
		 */
		this.data = undefined;

		/**
		 * Value contained in the ACC (internal node memory)
		 * @type {Number}
		 */
		this.acc = 0;

		/**
		 * Value contained in the BAK (internal node memory which cannot be read directly)
		 * @type {Number}
		 */
		this.bak = 0;

		/**
		 * DataLocation last read from using ANY
		 * @type {DataLocation}
		 */
		this.last = Node.DataLocation.NONE;

		/**
		 * Number of cycles this Node has been active. used to determine idle %
		 * @type {Number}
		 */
		this.cyclesactive = 0;


		this.computer = computer;

	}

	Node.prototype.toString = function() {
		return '[Node x=' + this.x + ', y=' + this.y + ']';
	};

	Node.prototype.setACC = function(acc) {
		this.acc = Math.max(-999, Math.min(acc, 999));
	};

	Node.prototype.setBAK = function(bak) {
		this.bak = Math.max(-999, Math.min(bak, 999));
	};

	Node.prototype.setACCandBAK = function(acc, bak) {
		this.setACC(acc);
		this.setBAK(bak);
	};

	/**
	 * Gets the node relative to this node, in the given direction.
	 * @param  {Integer|[x,y]} x Either an array of [x,y] or the x coordinate.
	 * @param  {Integer} y (Optional) If the x is not an an array of 2 coordinates, the y coordinate
	 * @return {Node}   The node, or undefined if no node is in that direction.
	 */
	Node.prototype.relative = function(x, y) {
		if (typeof(x) == "object") {
			y = x[1];
			x = x[0];
		}

		return this.computer.getNode(this.x + x, this.y + y);
	};

	/**
	 * Without affecting the new, determines if it is possible to immediately read data from that DataLocation.
	 * @param  {DataLocation} srcdir The direction to take from, ie DataLocation.LEFT
	 * @return {Boolean}        Returns whether the source has a value at this time.
	 */
	Node.prototype.hasData = function(src) {
		if (typeof(src) == 'object') {
			return true;
		}

		switch (src) {
			case Node.DataLocation.UP:
			case Node.DataLocation.RIGHT:
			case Node.DataLocation.DOWN:
			case Node.DataLocation.LEFT:
				var dirCel = this.relative(Node.DataLocation.getOrigin(src));
				return dirCel && dirCel.data != undefined && dirCel.dest == Node.DataLocation.getOppositeSide(src);
			
			case Node.DataLocation.ANY:
				for (var i = 0; i < ANY_READ_ORDER.length; i++) {
					if (this.hasData(ANY_READ_ORDER[i])) {
						return true;
					}
				}
				return false;

			case Node.DataLocation.LAST:
				// prevent an unlikely infinite loop because who knows.
				if (this.last != Node.DataLocation.LAST)
					return this.hasData(this.last);
				else
					return false;
			case Node.DataLocation.NIL: return true;
			case Node.DataLocation.ACC: return true;

			case Node.DataLocation.BAK:
				throw new Node.ReadError("Cannot address register 'BAK'");
			case Node.DataLocation.NONE:
				throw new Node.ReadError("Cannot address register 'NONE'");
		}

		return false;
	};

	/**
	 * Consumes and returns the data this node is preparing to send.
	 * @return {Number} The data taken from the node.
	 */
	Node.prototype.consume = function() {
		var data = this.data;
		this.dest = Node.DataLocation.NONE;
		this.data = undefined;

		return data;
	};

	/**
	 * Gets data from the given location.
	 * @param  {{constant: Number}|DataLocation} src Where the data is coming from, either a DataLocation or an object containing key:"constant", and value.
	 * @return {false|Number}     returns false if the data was not immediately available. returns the number if it was available.
	 */
	Node.prototype.read = function(src) {
		if (typeof(src) == "object") {
			return src.constant;
		}

		switch (src) {
			case Node.DataLocation.UP:
			case Node.DataLocation.RIGHT:
			case Node.DataLocation.DOWN:
			case Node.DataLocation.LEFT:
				var dirCel = this.relative(Node.DataLocation.getOrigin(src));
				if (dirCel && dirCel.dest == Node.DataLocation.getOppositeSide(src)) {
					return dirCel.consume();
				}
				throw new Node.ReadError("No data available");

			case Node.DataLocation.ANY:
				// determined by testing, given multiple options, ANY takes from these directions in order of priority.
				for (var i = 0; i < ANY_READ_ORDER.length; i++) {
					if (this.hasData(ANY_READ_ORDER[i])) {
						return this.read(ANY_READ_ORDER[i]);
					}
				}

				throw new Node.ReadError("No data available");
			case Node.DataLocation.LAST:
				return this.read(this.last);
			case Node.DataLocation.NIL: return 0;
			case Node.DataLocation.ACC: return this.acc;

			case DataLocation.BAK:
				throw new Node.ReadError("Cannot address register 'BAK'");
			case DataLocation.NONE:
				throw new Node.ReadError("Cannot address register 'NONE'");
		}
	};

	/**
	 * Jumps to the instruction represented by the label with the given name.
	 * @param  {String} label The name of the label to jump to.
	 * @return {Boolean}       Whether the jump succeeded.
	 */
	Node.prototype.jumpTo = function (label) {
		var op = this.labels[label];
		if (op == undefined) {
			throw new Error("Label " + label + " is not defined");
		}

		this.doneTick = true;
		this.currentop = op - 1;
		this.stalled = 0;

		return true;
	}

	/**
	 * Performs a step of the opcodes in this node.
	 * @param  {Integer} t The stalled iteration of the nodes.
	 * @return {Boolean}   Whether the opcode completed its task.
	 */
	Node.prototype.step = function (t) {
		if (this.opcodes.length == 0) {
			return true;
		}

		var o = this.opcodes[this.currentop];

		var success = o.run(t);
		if (success) {
			this.doneTick = true;
			this.currentop += 1;
			this.stalled = 0;
		}

		// loop back to start
		if (this.currentop == this.opcodes.length) {
			this.currentop = 0;
		}

		return success;
	}

	/**
	 * Performs a partial tick on the node.
	 * If the instruction was completed, will not tick again until 'post' is called.
	 * If not, the tick will be attempted again, ie to resolve any order-based dependencies
	 */
	Node.prototype.tick = function() {
		if (!this.doneTick) {
			this.doneTick = this.step(this.stalled++);
		}
	};

	/**
	 * Post operations, to be called after all other nodes are done having their 'tick' called.
	 */
	Node.prototype.post = function() {
		this.doneTick = false;
		
		if (this.queuedData != undefined) {
			this.data = this.queuedData;
			this.queuedData = undefined;
		}
		if (this.queuedDest != Node.DataLocation.NONE) {
			this.dest = this.queuedDest;
			this.queuedDest = Node.DataLocation.NONE;
		}
		
		if (this.opcodes.length == 0 || this.lastop == undefined) {
			return;
		}

		this.opcodes[this.lastop].post(this.stalled-1);
	};

	/**
	 * For a Stack Memory node, pushes a number onto the stack.
	 * @return {Boolean} Whether the value was pushed onto the stack.
	 */
	Node.prototype.pushStack = function(val) {
		if (this.stack.length <= Node.STACK_SIZE - 1) {
			this.stack.push(val);
			return true;
		} else {
			return false;
		}
	};

	/**
	 * For a Stack Memory node, pops a number off the stack.
	 * @return {Number|False} The popped value if available, or 'false' if not.
	 */
	Node.prototype.popStack = function() {
		if (this.stack.length > 0) {
			return stack.pop();
		} else {
			return false;
		}
	};

	/**
	 * Resets this node to its state before the 'run' button is clicked.
	 * Does not reset instructions or opcodes.
	 */
	Node.prototype.reset = function() {
		this.stack = [];
		this.currentop = -1;
		this.stalled = 0;
		this.doneTick = false;
		this.last = this.dest = this.queuedDest = Node.DataLocation.NONE;
		this.data = this.queuedData = undefined;
		this.acc = 0;
		this.bak = 0;
		this.cyclesactive = 0;
	};

	Node.ReadError = function (msg) {
		this.message = msg;
		this.toString = function () {
			return msg;
		}
	};

	/**
	 * Enum representing the type a Node is.
	 * @type {Enum}
	 */
	Node.Type = {
		TILE_COMPUTE: 1,
		TILE_MEMORY: 2,
		TILE_DAMAGED: 3,
		_TILE_STREAM_PROVIDER: 98,
		_TILE_STREAM_CONSUMER: 99,
	};

	/**
	 * A Location where data can move to/from.
	 * @type {Enum}
	 */
	Node.DataLocation = {
		NONE: 0,
		UP: 1,
		RIGHT: 2,
		DOWN: 3,
		LEFT: 4,
		ANY: 5,
		LAST: 6,
		NIL: 7,
		ACC: 8,

		/**
		 * Gets whether the location is always instantly readable, for example the ACC.
		 * @param  {DataLocation}  src The direction to check.
		 * @return {Boolean}     Whether the location is instantly readable.
		 */
		isInstant: function (src) {
			switch (Node.DataLocation.getName(src)) {
				case "NONE":
				case "NIL":
				case "ACC":
				case "CONSTANT":
					return true;
				default:
					return false;
			}
		},

		/**
		 * If the given DataLocation is one of up,right,down,left, returns the opposite side. undefined behavior for others.
		 * @param  {DataLocation} src The direction
		 * @return {DataLocation}     The opposite direction
		 */
		getOppositeSide: function (src) {
			// src+2%4 will get the DataLocation opposite the current directional location, except with RIGHT, which needs to be adjusted manually.
			var opposite = (src+2)%4; if (opposite == 0) opposite = 4;
			return opposite;
		},

		/**
		 * Gets the relative direction that the data comes from.
		 * If not a constant direction ie up but not 'any', returns [0,0].
		 * @param  {DataLocation} src Source DataLocation
		 * @return {[x,y]}     Relative direction to this cell.
		 */
		getOrigin: function (src) {
			if (src == Node.DataLocation.UP) {return [0, -1];}
			if (src == Node.DataLocation.RIGHT) {return [1, 0];}
			if (src == Node.DataLocation.DOWN) {return [0, 1];}
			if (src == Node.DataLocation.LEFT) {return [-1, 0];}
			// TODO: should this return the direction of the 'ANY'?
			return [0,0];
		},

		getName: function( value ) {
			if (typeof(value) == 'object') {
				return "CONSTANT";
			}

			for (var prop in Node.DataLocation) {
				if (Node.DataLocation.hasOwnProperty(prop)) {
					if(Node.DataLocation[prop] === value)
						return prop;
				}
			}
		},

		/**
		 * Gets a string representation of the given DataLocation.
		 * @param  {DataLocation} value The location or constant to create a string from.
		 * @return {String}       The string representation of the location.
		 */
		getString: function (value) {
			var s = Node.DataLocation.getName(value);
			if (s == "CONSTANT") {
				return value.constant + "";
			} else {
				return s;
			}
		},

		/**
		 * Gets a datalocation from a name or number string.
		 * @param  {String} str The text which represents the DataLocation
		 * @return {DataLocation}     The data location
		 * @throws {Error} If the given string is not a numerical string or the name of a datalocation
		 */
		fromName: function (str) {
			if (typeof Node.DataLocation[str] == 'number') {
				return Node.DataLocation[str];
			} else if (!isNaN(parseInt(str))) {
				return {constant: parseInt(str)};
			}
			throw new Error('Invalid Data Location');
		}
	};

	/**
	 * Maximum number of storage by a STACK memory node.
	 * @type {Number}
	 */
	Node.STACK_SIZE = 15;

	// determined by testing, given multiple options, ANY takes from these directions in order of priority.
	var ANY_READ_ORDER = [
		Node.DataLocation.LEFT,
		Node.DataLocation.RIGHT,
		Node.DataLocation.UP,
		Node.DataLocation.DOWN
	];

	return Node;
})