define(['Node'], function (Node) {
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
	};

	Display.NodeDisplay.prototype.update = function() {
		if (this.node.type == Node.Type.TILE_COMPUTE) {
			this.accElement.text(this.node.acc);
			this.bakElement.text('(' + this.node.bak + ')');
			
			// this.srcElement.val(this.node.instructions.join('\n'));
			this.srcElement.css('display', 'none');
			this.instructionElement.css('display', 'block');
			this.instructionElement.empty();

			for (var i = 0; i < this.node.instructions.length; i++) {
				$('<li>' + this.node.instructions[i].toString() + '</li>').appendTo(this.instructionElement);
			}

			this.instructionElement.find('.active').removeClass('active');

			if (this.node.currentop >= 0)
				this.instructionElement.find(':nth-child(' + (this.node.currentop + 1) + ')').addClass('active');

		} else if (this.node.type == Node.Type.TILE_MEMORY) {
			this.stackList.html(this.node.stack.join('<br/>'));
		}
	};



	Display.ComputerDisplay = function (puzzle) {
		var cells = [];
		var arrows = [];

		var computer = $('<table>').addClass('computer').appendTo('#computercontainer');

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

		this.update = function () {
			for (var y = 0; y < puzzle.height; y++) {
				for (var x = 0; x < puzzle.width; x++) {
					cells[y][x].update();
				}
			}

			$('#cyclecount').text((puzzle.cycle==0)?'N/A':puzzle.cycle - 1);
		}
	};

	return Display;
});
