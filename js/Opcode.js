define(['Node'], function (Node) {
	var Opcode = function (node) {
		this.node = node;

		this.check = function () {return true;};
		this.action = function () {};
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

	
	Opcode.SWP = function (node) {
		var op = new Opcode(node);
		
		op.action = function () {
			node.setACCandBAK(node.bak, node.acc);
		}

		return op;
	};

	/**
	 * A set of Opcode factories, which return an Opcode.
	 * @type {Object}
	 */
	Opcode.ADD = function (node, src) {
		var op = new Opcode(node);
		
		op.action = function () {
			if (node.hasData(src)) {
				node.setACC(node.acc + node.read(src));
				return true;
			} else {
				return false;
			}
		}

		return op;
	};

	Opcode.NOP = function (node) {
		return Opcode.ADD(node, Node.DataLocation.NIL);
	};

	Opcode.MOV = function (node, src, dst) {
		var op = new Opcode(node);

		op.action = function (t) {
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
		}

		return op;
	}

	return Opcode;
});