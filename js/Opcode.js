define(['Node'], function (Node) {
	var Opcode = function (node, action) {
		this.node = node;

		this.check = function () {return true;};
		this.action = action || function () {};
		this.first = function () {};
		this.post = function () {};
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
		return Opcode.ADD(node, Node.DataLocation.NIL);
	};

	Opcode.MOV = function (node, src, dst) {
		return new Opcode(node, function (t) {
			if (t == 0)
				node.queuedDest = dst;
			if (!node.hasData(src))
				return false;

			if (node.queuedData == undefined && node.hasData(src)) {
				node.queuedData = node.read(src);
			}

			// an instant read, such as src=ACC will pass
			if (t == 0 && node.queuedData == undefined) {
				return false;
			}
			
			switch (dst) {
				case Node.DataLocation.ACC:
					node.setACC(node.queuedData);
				case Node.DataLocation.NONE:
				case Node.DataLocation.NIL:
					node.queuedDest = Node.DataLocation.NONE;
					node.queuedData = undefined;
					return true;
				default:
					;// console.log("No move action defined for", Node.DataLocation.getName(dst), " the queued is", Node.DataLocation.getName(node.queuedDest), node.queuedData);
			}

			return t != 0 && node.queuedDest == Node.DataLocation.NONE;
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

	// TODO: JMP, JEZ, JNZ, JGZ, JLZ, JRO

	return Opcode;
});