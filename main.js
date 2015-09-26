/**
 * Number of cells in a computer, lengthwise.
 * @type {Number}
 */
var COMPUTER_CELL_WIDTH = 4;

/**
 * Number of cells in a computer, heightwise.
 * @type {Number}
 */
var COMPUTER_CELL_HEIGHT = 3;

/**
 * Creates the html elements for a cell.
 * @return {{element, instructionElement, srcElement, accElement, bakElement, lastElement, modeElement, idleElement, stackElement}} The created cell
 */
function createCell(x, y, type) {
	var cell = {};

	var e = $('<table>')
		.addClass('cell cell' + type);
	cell.element = e;

	var firstRow = $('<tr>')
		.appendTo(e);
	var srcContainer = $('<td>')
		.attr('rowspan', 5)
		.addClass('srccontainer')
		.appendTo(firstRow);

	cell.instructionElement = $('<ul class="src" style="display:none">').appendTo(srcContainer);
	cell.srcElement = $('<textarea></textarea>')
		.addClass('src srcarea')
		.attr({
			'id': 'src_' + x + '_' + y,

			'autocomplete': 'off',
			'autocorrect': 'off',
			'autocapitalize': 'off',
			'spellcheck': 'false',
		})
		.appendTo(srcContainer);
	cell.accElement = $('<td style="position:relative">ACC<br/><span>0</span></td>').appendTo(firstRow).find('span'); // acc is added to the first row, since the content has rowspan of 5.
	cell.bakElement = $('<tr><td>BAK<br/><span>(0)</span></td></tr>').appendTo(e).find('span');
	cell.lastElement = $('<tr><td>LAST<br/><span>N/A</span></td></tr>').appendTo(e).find('span');
	cell.modeElement = $('<tr><td>MODE<br/><span>IDLE</span></td></tr>').appendTo(e).find('span');
	cell.idleElement = $('<tr><td>IDLE<br/><span>0%</span></td></tr>').appendTo(e).find('span');

	if (type == TileType.TILE_DAMAGED) {
		// TODO: comm failure
		cell.srcElement.css('display', 'none');
		cell.instructionElement.css('display', 'block').addClass('cellfail').html('<div class="celltext">COMMUNICATION FAILURE</div>');
	} else if (type == TileType.TILE_MEMORY) {
		cell.srcElement.css('display', 'none');
		cell.accElement.addClass('stacklist').html('<div>3</div><div>3</div><div>3</div><div>3</div><div>3</div><div>3</div><div>3</div><div>3</div><div>3</div>');
		cell.stackElement = cell.accElement;
		cell.instructionElement.css('display', 'block').addClass('cellstack').html('<div class="celltext">STACK MEMORY NODE</div>');
	}

	cell.setInstructions = function (visible) {
		if (visible) {
			cell.srcElement.css('display', 'none');
			cell.instructionElement.css('display', 'block');
			cell.instructionElement.empty();

			for (var i = 0; i < cell.instructions.length; i++) {
				var ins = $('<li>' + cell.instructions[i].toString() + '</li>').appendTo(cell.instructionElement);
				if (cell.instructions[i].active) {
					ins.addClass('active');
				}
			}
		} else {
			cell.srcElement.css('display', 'block');
			cell.instructionElement.css('display', 'none');
		}
	};
	
	return cell;
}

function createField(puzzle) {
	var cells = [];
	var arrows = [];

	var computer = $('<table>').addClass('computer');

	for (var y = 0; y < puzzle.height; y++) {
		var row = [];
		cells.push(row);

		var cellRowElement = $('<tr>').appendTo(computer);
		// table row for up/down arrows in between cells
		var harrowRowElement = $('<tr>').appendTo(computer);

		for (var x = 0; x < puzzle.width; x++) {
			var cell = createCell(x, y, puzzle.cells[y][x].type);
			$('<td>')
				.append(cell.element)
				.addClass('cellcontainer')
				.attr({
					'id': 'cell_' + x + '_' + y
				})
				.appendTo(cellRowElement);

			// Don't add an arrow row on the last set.
			if (y != COMPUTER_CELL_HEIGHT) {
				var harrow = {};
				harrow.element = $('<td>')
					.attr({
						'id': 'harrow_' + x + '_' + y
					})
					.html('&uarr; &darr;')
					.addClass('arrow')
					.appendTo(harrowRowElement);
				
			}

			if (x != COMPUTER_CELL_WIDTH) {
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

			row.push(cell);
		}
	}

	return {
		computer: computer,
		cells: cells,
		arrows: arrows
	};
}

var active_puzzle;

// use ctrl+arrow keys to move cursor around cells
$('body').keydown(function (e) {
	if (active_puzzle == undefined) {
		return;
	}

	var isMove = false, relX = 0, relY = 0;
	if (e.ctrlKey) {
		// set to false in 'else'
		isMove = true;

		if (e.keyCode == 37) { // left
			relX = -1;
		} else if (e.keyCode == 38) { // up
			relY = -1;
		} else if (e.keyCode == 39) { // right
			relX = 1;
		} else if (e.keyCode == 40) { // down
			relY = 1;
		} else {
			isMove = false;
		}
	}

	if (isMove) {
		var f = $(':focus');
		if (f.hasClass('srcarea')) {
			var loc = f.attr('id').split('_');

			var x = loc[1] - 1 + relX;
			var y = loc[2] - 1 + relY;

			if (x >= 0 && x < COMPUTER_CELL_WIDTH && y >= 0 && y < COMPUTER_CELL_HEIGHT)
				active_puzzle.cells[y][x].srcElement.focus();

			return false;
		}
	}
});