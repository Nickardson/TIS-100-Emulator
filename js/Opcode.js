var Opcode;
define(['Node'], function (Node) {
	var ERROR_TOO_FEW_OPERANDS = 'MISSING OPERAND',
		ERROR_TOO_MANY_OPERANDS = 'TOO MANY OPERANDS';

	function checkOperandCount(tokens, c) {
		if (tokens.length - 1 > c) throw new Error(ERROR_TOO_MANY_OPERANDS);
		if (tokens.length - 1 < c) throw new Error(ERROR_TOO_FEW_OPERANDS);

		return true;
	}

	Opcode = function (node, action) {
		this.node = node;

		this.check = function () {return true;};
		this.action = action || function () {};
		this.first = function () {};
		this.post = function () {};

		this.label = "";
	}

	Opcode.prototype.run = function(t) {
		//if (this.check(t)) {
			var complete = this.action(t);
			if (complete) {
				this.node.cyclesactive++;
				return true;
			}
		//}

		return false;
	};

	Opcode.NOP = function (node) {
		return Opcode.ADD(node, Node.DataLocation.NIL, function () {
			return "NOP";
		});
	};

	Opcode.MOV = function (node, src, dst) {
		return new Opcode(node, function (t) {
			if (t == 0) {
				node.queuedDest = dst;
			}
			if (!node.hasData(src)) {
				return false;
			}

			if (node.queuedData == undefined && node.hasData(src)) {
				node.queuedData = node.read(src);
			}

			// an instant read, such as src=ACC will pass
			if (t == 0 && node.queuedData == undefined) {
				return false;
			}
			
			// perform available instant writes
			switch (dst) {
				case Node.DataLocation.ACC:
					node.setACC(node.queuedData);
				case Node.DataLocation.NONE:
				case Node.DataLocation.NIL:
					node.dest = node.queuedDest = Node.DataLocation.NONE;
					node.data = node.queuedData = undefined;
					return true;
			}

			return t != 0 &&
				node.data == undefined &&
				node.dest == Node.DataLocation.NONE &&
				node.queuedDest == Node.DataLocation.NONE;
		});
	}

	Opcode.SWP = function (node) {
		return new Opcode(node, function () {
			node.setACCandBAK(node.bak, node.acc);
			return true;
		});
	};

	Opcode.SAV = function (node) {
		return new Opcode(node, function () {
			node.setBAK(node.acc);
			return true;
		});
	};

	Opcode.ADD = function (node, src) {
		return new Opcode(node, function () {
			if (node.hasData(src)) {
				node.setACC(node.acc + node.read(src));
				return true;
			} else {
				return false;
			}
		});
	};

	Opcode.SUB = function (node, src) {
		return new Opcode(node, function () {
			if (node.hasData(src)) {
				node.setACC(node.acc - node.read(src));
				return true;
			} else {
				return false;
			}
		});
	};

	Opcode.NEG = function (node) {
		return new Opcode(node, function () {
			node.setACC(-node.acc);
			return true;
		});
	};

	Opcode.JMP = function (node, label) {
		return new Opcode(node, function () {
			return node.jumpTo(label);
		});
	};

	Opcode.JEZ = function (node, label) {
		return new Opcode(node, function () {
			if (node.acc == 0) {
				return node.jumpTo(label);
			} else {
				return true;
			}
		});
	};

	Opcode.JNZ = function (node, label) {
		return new Opcode(node, function () {
			if (node.acc != 0) {
				return node.jumpTo(label);
			} else {
				return true;
			}
		});
	};

	Opcode.JGZ = function (node, label) {
		return new Opcode(node, function () {
			if (node.acc > 0) {
				return node.jumpTo(label);
			} else {
				return true;
			}
		});
	};

	Opcode.JLZ = function (node, label) {
		return new Opcode(node, function () {
			if (node.acc < 0) {
				return node.jumpTo(label);
			} else {
				return true;
			}
		});
	};

	Opcode.JRO = function (node, src) {
		return new Opcode(node, function (t) {
			if (node.hasData(src)) {
				var abs = Math.max(0, Math.min(node.currentop + node.read(src), node.opcodes.length - 1));				
				node.currentop = abs - 1;
				return true;
			} else {
				return false;
			}
		});
	};

	Opcode._PROVIDE = function (node) {
		return new Opcode(node, function () {
			// TODO: implement
			if (node.queuedData == undefined && node.puzzle.hasInput(node)) {
				node.queuedData = node.puzzle.readInput(node);
				node.dest = node.queuedDest = Node.DataLocation.ANY;
			}
		});
	};

	Opcode._CONSUME = function (node, src) {
		return new Opcode(node, function () {
			// TODO: implement
			if (node.hasData(src)) {
				node.puzzle.addOutput(node, node.read(src));
			} else {
				return false;
			}
		});
	};

	/**
	 * Parses several lines of Opcodes, and adds the opcodes to the given cell.
	 * @param  {Node} cell  The node which the opcodes belong to
	 * @param  {String[]} lines List of strings
	 */
	Opcode.parse = function (cell, lines) {
		var isNextLabel = false,
			labelName;

		for (var i = 0; i < lines.length; i++) {
			var str = lines[i].trim().toUpperCase();

			// Empty lines and comments
			if (str.length == 0 || str.substr(0, 1) == '#') {
				continue;
			}

			// remove commas, split between spaces, remove empty strings
			var tokens = str.replace(",", " ").split(" ").filter(function(a) {
				return a.length > 0;
			});

			// TODO: determine if multiple labels are allowed in a row
			var lineIsLabeled = false;
			if (tokens[0].indexOf(':') != -1) {
				var label = tokens.shift();
				var split = label.split(":");
				labelName = split[0];

				// Add back content in cases like "label:nop" where no space between label
				var extraContent = split[1];
				if (extraContent.length > 0) {
					tokens.unshift(extraContent);
				}

				if (tokens.length == 0) {
					// line is only label, next line
					isNextLabel = true;
					continue;
				} else {
					// command follows label on next line
					lineIsLabeled = true;
				}
			} else if (isNextLabel) {
				lineIsLabeled = true;
				isNextLabel = false;
			}

			// TODO: an operand-count-based method could be used instead.
			var o = null;
			if (tokens[0] == 'NOP') {
				checkOperandCount(tokens, 0);
				o = Opcode.NOP(cell);
			} else if (tokens[0] == 'MOV') {
				checkOperandCount(tokens, 2);

				o = Opcode.MOV(cell, 
					Node.DataLocation.fromName(tokens[1]), 
					Node.DataLocation.fromName(tokens[2]));
			} else if (tokens[0] == 'SWP') {
				checkOperandCount(tokens, 0);
				o = Opcode.SWP(cell);
			} else if (tokens[0] == 'SAV') {
				checkOperandCount(tokens, 0);
				o = Opcode.SAV(cell);
			} else if (tokens[0] == 'ADD') {
				checkOperandCount(tokens, 1);
				o = Opcode.ADD(cell,
					Node.DataLocation.fromName(tokens[1]));
			} else if (tokens[0] == 'SUB') {
				checkOperandCount(tokens, 1);
				o = Opcode.SUB(cell,
					Node.DataLocation.fromName(tokens[1]));
			} else if (tokens[0] == 'NEG') {
				checkOperandCount(tokens, 0);
				o = Opcode.NEG(cell);
			} else if (tokens[0] == 'JMP') {
				checkOperandCount(tokens, 1);
				o = Opcode.JMP(cell, tokens[1]);
			} else if (tokens[0] == 'JEZ') {
				checkOperandCount(tokens, 1);
				o = Opcode.JEZ(cell, tokens[1]);
			} else if (tokens[0] == 'JNZ') {
				checkOperandCount(tokens, 1);
				o = Opcode.JNZ(cell, tokens[1]);
			} else if (tokens[0] == 'JGZ') {
				checkOperandCount(tokens, 1);
				o = Opcode.JGZ(cell, tokens[1]);
			} else if (tokens[0] == 'JLZ') {
				checkOperandCount(tokens, 1);
				o = Opcode.JLZ(cell, tokens[1]);
			} else if (tokens[0] == 'JRO') {
				checkOperandCount(tokens, 1);
				o = Opcode.JRO(cell,
					Node.DataLocation.fromName(tokens[1]));
			} else if (tokens.length > 0) {
				throw new Error('INVALID OPCODE "' + tokens[0] + '"');
			}

			// add opcode
			if (o != null) {
				cell.opcodes.push(o);
				cell.opcodeLines[cell.opcodes.length - 1] = i;

				// set label to opcode index
				if (lineIsLabeled) {
					cell.labels[labelName] = cell.opcodes.length - 1;
					lineIsLabeled = false;
				}
			}
		}
	}

	return Opcode;
});
