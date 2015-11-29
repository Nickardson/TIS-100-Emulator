define(['Node', 'Computer', 'Opcode'], function (Node, Computer, Opcode) {
	var Display = {};

	Display.NodeDisplay = function (node) {
		this.node = node;

		var e = $('<table>').addClass('cell cell' + node.type);
		this.element = e;

		var firstRow = $('<tr>').appendTo(e);

		if (node.type == Node.Type.TILE_COMPUTE) {
			var srcContainer = $('<td>')
				.attr('rowspan', 5)
				.addClass('srccontainer')
				.appendTo(firstRow);
			this.instructionElement = $('<ul class="src" style="display:none">').appendTo(srcContainer);
			this.srcElement = $('<textarea></textarea>')
				.addClass('src srcarea')
				.attr({
					'id': 'src_' + node.x + '_' + node.y,

					'autocomplete': 'off',
					'autocorrect': 'off',
					'autocapitalize': 'off',
					'spellcheck': 'false',
				})
				.val(node.instructions.join('\n'))
				.appendTo(srcContainer);
			this.accElement = $('<td style="position:relative">ACC<br/><span></span></td>').appendTo(firstRow).find('span'); // acc is added to the first row, since the content has rowspan of 5.
			this.bakElement = $('<tr><td>BAK<br/><span>(0)</span></td></tr>').appendTo(e).find('span');
			this.lastElement = $('<tr><td>LAST<br/><span>N/A</span></td></tr>').appendTo(e).find('span');
			this.modeElement = $('<tr><td>MODE<br/><span>IDLE</span></td></tr>').appendTo(e).find('span');
			this.idleElement = $('<tr><td>IDLE<br/><span>0%</span></td></tr>').appendTo(e).find('span');
		} else if (node.type == Node.Type.TILE_DAMAGED) {
			var srcContainer = $('<td>')
				.attr('rowspan', 4)
				.addClass('srccontainer')
				.appendTo(firstRow);
			$('<td>').appendTo(firstRow);
			$('<div></div>').appendTo(srcContainer).addClass('cellfail').html('<div class="celltext">COMMUNICATION FAILURE</div>');

			for (var i = 0; i < 3; i++) {
				$('<tr><td></td></tr>').appendTo(e);
			}
		} else if (node.type == Node.Type.TILE_MEMORY) {
			var srcContainer = $('<td>').addClass('srccontainer').appendTo(firstRow);
			$('<div class="cellstack"></div>').html('<div class="celltext">STACK MEMORY NODE</div>').appendTo(srcContainer);
			this.stackList = $('<td class="stacklist" style="position:relative"></td>').appendTo(firstRow);
		}

		this.update();
		this.setEditable(false);
	};

	Display.NodeDisplay.prototype.setEditable = function(editable) {
		if (this.node.type == Node.Type.TILE_COMPUTE) {
			// TODO: use inherit instead of block?
			this.srcElement.css('display', editable ? 'block' : 'none');
			this.instructionElement.css('display', editable ? 'none' : 'block');
			
			if (this.editable !== editable) {
				if (editable) {

				} else {
					this.node.opcodes = [];
					this.node.instructions = this.srcElement.val().split('\n');
					Opcode.parse(this.node, this.node.instructions);

					this.instructionElement.empty();
					this.cachedInstructions = [];

					// it ain't a premature optimization if it gives a 4-5x speed increase.
					for (var i = 0; i < this.node.instructions.length; i++) {
						var ins = this.node.instructions[i].toString();
						if (ins.length == 0) {
							ins = "&nbsp;";
						}
						this.cachedInstructions[i] = $('<li>' + ins + '</li>').appendTo(this.instructionElement);
					}
				}
			}
		}
		
		this.editable = editable;
	};

	Display.NodeDisplay.prototype.update = function() {
		if (this.node.type == Node.Type.TILE_COMPUTE) {
			this.accElement.text(this.node.acc);
			this.bakElement.text('(' + this.node.bak + ')');

			// the line of the instruction matching the current opcode.
			var currentInstruction = this.node.opcodeLines[this.node.currentop];

			if (!this.cachedCurrentop || this.cachedCurrentop != currentInstruction) {
				this.cachedCurrentop = currentInstruction;

				if (this.cachedActiveInstruction)
					this.cachedActiveInstruction.removeClass('active');
				else
					this.instructionElement.find('.active').removeClass('active');
				
				if (currentInstruction >= 0 && this.node.instructions.length > 0) {
					if (this.cachedInstructions)
						this.cachedActiveInstruction = this.cachedInstructions[currentInstruction].addClass('active');
					else // fallback, shouldn't be needed.
						this.cachedActiveInstruction = this.instructionElement.find(':nth-child(' + (currentInstruction + 1) + ')').addClass('active');
				}
			}
		} else if (this.node.type == Node.Type.TILE_MEMORY) {
			this.stackList.html(this.node.stack.join('<br/>'));
		}
	};



	Display.ComputerDisplay = function (puzzle) {
		var cells = [];
		var arrows = [];

		var computer = $('<table>').addClass('computer').appendTo('#computercontainer');

		var io_titles = $('#io_titles').empty();
		var io_data = $('#io_data').empty();

		// TODO: replace with code in Display.js
		this.streamsOutput=[];

		for (var i = 0; i < puzzle.streams.length; i++) {
			var stream = puzzle.streams[i];

			if (stream[0] == Computer.StreamType.STREAM_INPUT) {
				puzzle.columnsIn[stream[2]] = stream;
			} else if (stream[0] == Computer.StreamType.STREAM_OUTPUT) {
				puzzle.columnsOut[stream[2]] = stream;
				this.streamsOutput[stream[2]] = [];
			}

			$('<td>').text(stream[1]).appendTo(io_titles);

			var table = $('<td><table class="datalist"></table></td>').appendTo(io_data).find('table');
			for (var j = 0; j < stream[3].length; j++) {
				var row = $('<tr></tr>').appendTo(table);
				
				// TODO: implement STREAM_IMAGE
				if (stream[0] != Computer.StreamType.STREAM_IMAGE) {
					$('<td>').html(stream[3][j]).appendTo(row);
				}
				if (stream[0] == Computer.StreamType.STREAM_OUTPUT) {
					this.streamsOutput[stream[2]][j] = $('<td>').appendTo(row);
					table.addClass('table2row');
				}
			}
		}

		// each line starts with a '> ', line breaks after each additional.
		$('#test_name').text(puzzle.name);
		$('#test_desc').html('&gt; ' + puzzle.description.join('<br/>&gt; '));

		for (var y = 0; y < puzzle.height; y++) {
			cells[y] = [];

			var cellRowElement = $('<tr>').appendTo(computer);
			// table row for up/down arrows in between cells
			var harrowRowElement = $('<tr>').appendTo(computer);

			for (var x = 0; x < puzzle.width; x++) {
				var cell = new Display.NodeDisplay(puzzle.getNode(x, y));
				$('<td>')
					.append(cell.element)
					.addClass('cellcontainer')
					.attr({
						'id': 'cell_' + x + '_' + y
					})
					.appendTo(cellRowElement);

				// Don't add an arrow row on the last set.
				if (y < puzzle.height - 1) {
					var harrow = {};
					harrow.element = $('<td>')
						.attr({
							'id': 'harrow_' + x + '_' + y
						})
						.html('&uarr; &darr;')
						.addClass('arrow')
						.appendTo(harrowRowElement);
					
				}

				if (x < puzzle.width - 1) {
					var varrow = {};
					varrow.element = $('<td>')
						.attr({
							'id': 'varrow_' + x + '_' + y
						})
						.html('&rarr;<br/>&larr;')
						.addClass('arrow')
						.appendTo(cellRowElement);

					// add an extra cell to the arrow row below, to space properly.
					$('<td>').appendTo(harrowRowElement);
				}

				cells[y][x] = cell;
			}

		}
		/*
		var streamTop = $('<tr>').addClass('stream-head').prependTo(computer),
			streamBottom = $('<tr>').addClass('stream-head').appendTo(computer);

		streamTop.append('<td>IN.X &darr;</td><td></td>');
		streamTop.append('<td></td><td></td>');
		streamTop.append('<td></td><td></td>');
		streamTop.append('<td>IN.A &darr;</td>');

		streamBottom.append('<td>OUT.X &darr;</td><td></td>');
		streamBottom.append('<td></td><td></td>');
		streamBottom.append('<td></td><td></td>');
		streamBottom.append('<td>OUT.A &darr;</td>');
		*/
		
		this.update = function () {
			for (var y = 0; y < puzzle.height; y++) {
				for (var x = 0; x < puzzle.width; x++) {
					cells[y][x].update();
				}
			}

			$('#cyclecount').text((puzzle.cycle==0)?'N/A':puzzle.cycle - 1);
		}


		/**
		 * Sets the output value for display
		 * @param {Number} column   The index of the column
		 * @param {Number} outindex The index of the output, ie 3 being the fourth output
		 * @param {Number} value    The value to set the output to
		 */
		this.setOutput = function(column, outindex, value) {
			// Computer may be not displayed
			if (this.streamsOutput[column] != undefined) {
				var e = this.streamsOutput[column][outindex];
				e.html(value);

				if (value != puzzle.columnsOut[column][3][outindex]) {
					e.addClass('outputwrong');
				} else {
					e.removeClass('outputwrong');
				}
			}
		};

		this.setEditable = function(editable) {
			for (var y = 0; y < puzzle.height; y++) {
				for (var x = 0; x < puzzle.width; x++) {
					cells[y][x].setEditable(editable);
				}
			}
		}
	};

	return Display;
});
