var Block = React.createClass({
    render: function() {
        var className = this.props.color;
        return (
            <td className={className}></td>
        );
    }
});

var Row = React.createClass({
    render: function() {
        var blocks = [];
        for (var col = 0; col < this.props.columnStates.length; col++) {
            blocks.push(<Block color={this.props.columnStates[col]} />);
        }
        return (
            <tr>{blocks}</tr>
        );
    }
});

var Grid = React.createClass({
    render: function() {
        var rows = [];
        for (var row = 0; row < this.props.numRows; row++) {
            var states = this.props.getBlockStatesForRow(row);
            rows.push(<Row columnStates={states} />);
        }
        return (
            <div><table id="grid"><tbody>{rows}</tbody></table></div>
        );
    }
});

var Status = React.createClass({
    render: function() {
        return (
            <div className="status">
                <button onClick={this.props.resetGame}>
                    {this.props.getStatus()}
                </button>
                <p>{this.props.score}</p>
            </div>
        );
    }
});

var Controls = React.createClass({
    render: function() {
        return (
            <div className="controls">
                <button onClick={this.props.movePiece.bind(null, 'left')}>
                    Left
                </button>
                <button onClick={this.props.movePiece.bind(null, 'right')}>
                    Right
                </button>
                <button onClick={this.props.rotatePiece}>
                    Rotate!
                </button>
            </div>
        );
    }
});

// region Piece class

var Piece = function(row, col, color, pieces) {
    this.row = row;
    this.col = col;
    this.color = color;

    this.points = pieces.map(function(p) {
       return [p[0], p[1]];
    });
};

// Simple helper to calculate the coordinates of a point
Piece.prototype.getPointCoordinates = function(index) {
    return [ this.row + this.points[index][0],
             this.col + this.points[index][1] ];
}

// Simple helper to determine if a point is actually valid
Piece.prototype.pointOnGrid = function(row, col, rows, cols) {
    return ((row >= 0) && (row < rows) && (col >= 0) && (col < cols));
};

Piece.prototype.move = function(direction, blockStates) {
    var oldCol = this.col;
    if (direction === 'left') {
        this.col--;
    } else if (direction === 'right') {
        this.col++;
    }
    if (this.collides(blockStates)) {
        this.col = oldCol;
        return false;
    }
    return true;
};

Piece.prototype.rawRotate = function(clockwise) {
    // Each point is rotated from its top-left corner.
    // A bit awkward, but the best way to think about it is imagining we are rotating
    // around coordinate (-0.5, -0.5).
    for (var i = 0; i < this.points.length; i++) {
        var oldRow = this.points[i][0];
        var oldCol = this.points[i][1];
        this.points[i][0] = clockwise ? oldCol      : -oldCol - 1;
        this.points[i][1] = clockwise ? -oldRow - 1 : oldRow;
    }
};

Piece.prototype.rotate = function(blockStates, clockwise) {
    var doClockwise = (clockwise === undefined || clockwise);
    this.rawRotate(doClockwise);
    if (this.collides(blockStates)) {
        this.rawRotate(!doClockwise);
        return false;
    }
    return true;
}

// Determines if the piece occupies any non-empty blocks on the grid.
// Points not on the grid are also considered collided.
Piece.prototype.collides = function(blockStates) {
    var rows = blockStates.length;
    var cols = blockStates[0].length;
    for (var i = 0; i < this.points.length; i++) {
        var coords = this.getPointCoordinates(i);
        if (!this.pointOnGrid(coords[0], coords[1], rows, cols) || (blockStates[coords[0]][coords[1]] !== 'empty')) {
            return true;
        }
    }
    return false;
};

// Determines if the piece occupies specific grid coordinates.
Piece.prototype.occupiesPoint = function(row, col) {
    for (var i = 0; i < this.points.length; i++) {
        var coords = this.getPointCoordinates(i);
        if ((coords[0] == row) && (coords[1] == col)) {
            return true;
        }
    }
    return false;
};

// Checks if the piece has 'landed' on top of an occupied block or the
// bottom of the grid.
// Assumes that the piece is not colliding with any occupied block.
Piece.prototype.landed = function(blockStates) {
    var numRows = blockStates.length;
    var numCols = blockStates[0].length;
    for (var i = 0; i < this.points.length; i++) {
        var coords = this.getPointCoordinates(i);
        var row = coords[0];
        var col = coords[1];
        if (row == (numRows - 1)) {
            return true; // hit the bottom
        }
        var col = this.col + this.points[i][1];
        if (this.pointOnGrid(row, col, numRows, numCols)) {
            if (blockStates[row + 1][col] != 'empty') {
                return true; // just above an occupied spot
            }
        }
    }
    return false;
};

// Updates blockStates to set all of this piece's blocks to occupied.
Piece.prototype.merge = function(blockStates) {
    var numRows = blockStates.length;
    var numCols = blockStates[0].length;
    for (var i = 0; i < this.points.length; i++ ) {
        var coords = this.getPointCoordinates(i);
        var row = coords[0];
        var col = coords[1];
        if (this.pointOnGrid(row, col, numRows, numCols)) {
            blockStates[row][col] = this.color;
        }
    }
};

// endregion Piece class

var Game = React.createClass({
    getInitialState: function() {

        var that = this;
        document.addEventListener('keydown', function(event) {
            if (that.state.playing) {
                if (event.keyCode == 37) {
                    that.movePiece('left');
                    that.setInterval('left', that.movePiece.bind(null, 'left'), 150);
                } else if (event.keyCode == 39) {
                    that.movePiece('right');
                    that.setInterval('right', that.movePiece.bind(null, 'right'), 150);
                } else if (event.keyCode == 40) {
                    that.doDrop();
                    that.setInterval('drop', that.doDrop, 50);
                } else if (event.keyCode == 38) {
                    that.rotatePiece();
                }
            } else {
                that.resetGame();
            }
        });
        document.addEventListener('keyup', function(event) {
            if (that.state.playing) {
                if (event.keyCode == 37) {
                    that.clearInterval('left');
                } else if (event.keyCode == 39) {
                    that.clearInterval('right');
                } else if (event.keyCode == 40) {
                    that.clearInterval('drop');
                } else if (event.keyCode == 38) {
                }
            }
        });

        return this.createInitialState();

    },
    createInitialState: function() {
        var blockStates = this.getInitialBlockStates();
        return {
            blockStates: blockStates,
            currentPiece: null,
            moveDelay: 400,
            playing: false,
            score: 0
        };
    },
    createNewPiece: function(row, col) {
        var pieces = [
            {
                // L
                color: 'green',
                points: [ [0,-1], [-1,-1], [-1,0], [-1,1] ]
            },
            {
                // J
                color: 'yellow',
                points: [ [0,-1], [-1,-1], [0,0], [0,1] ]
            },
            {
                // box
                color: 'red',
                points: [ [0,0], [-1,0], [-1,-1], [0,-1] ]
            },
            {
                // I
                color: 'orange',
                points: [ [-2,0], [-1,0], [0,0], [1,0] ]
            },
            {
                // T
                color: 'blue',
                points: [ [0,0], [-1,0], [-1,1], [-1,-1] ]
            },
            {
                // S
                color: 'purple',
                points: [ [0,0], [-1,0], [-1,1], [0,-1] ]
            },
            {
                // Z
                color: 'grey',
                points: [ [0,0], [-1,0], [-1,-1], [0,1] ]
            }
        ];

        var index = this.getRandomInt(pieces.length);
        var piece = new Piece(row, col, pieces[index].color, pieces[index].points);
        return piece;
    },
    intervals: {},
    setInterval: function(name, func, delay) {
        this.clearInterval(name);
        this.intervals[name] = setInterval(func, delay);
    },
    clearInterval: function(name) {
        clearInterval(this.intervals[name]);
        delete this.intervals[name];
    },
    nextTick: null,
    scheduleNextTick: function(func, delay) {
        clearTimeout(this.nextTick);
        this.nextTick = setTimeout(function() {
            func();
        }, delay);
    },
    dimensions: [20, 10], // rows, columns

    // Assumption is that the currentPiece exists and is in a valid spot
    doDrop: function() {
        var currentPiece = this.state.currentPiece;
        
        // Check if the piece landed previously
        if (currentPiece.landed(this.state.blockStates)) {
            // Merge the piece into the blockStates
            currentPiece.merge(this.state.blockStates);
            this.setState({blockStates: this.state.blockStates});

            // Check for lines
            var lineRows = [];
            for (var i = 0; i < this.state.blockStates.length; i++) {
                var line = true;
                var rowBlockStates = this.state.blockStates[i];
                for (var index in rowBlockStates) {
                    if (rowBlockStates[index] === 'empty') {
                        line = false;
                        break;
                    }
                }
                if (line) {
                    lineRows.push(i);
                }
            }

            if (lineRows.length) {
                this.scheduleNextTick(this.doLine.bind(this, lineRows), this.state.moveDelay * 0);
            } else {
                this.scheduleNextTick(this.doNewPiece, this.state.moveDelay);
            }
            currentPiece = null;
            this.setState({currentPiece: currentPiece});
        } else {
            // Piece hasn't landed, so drop it.
            currentPiece.row++;
            this.validateCurrentPiece(currentPiece, true /* reschedule */);
        }
    },
    doNewPiece: function() {
        var currentPiece = this.createNewPiece(2, this.getRandomInt(this.dimensions[1] - 4) + 2);
        this.validateCurrentPiece(currentPiece, true /* reschedule */);
    },
    doLine: function(rows) {
        rows.sort();
        for (var i = 0; i < rows.length; i++) {
            this.state.blockStates.splice(rows[i], 1);
            this.state.blockStates.unshift(this.generateRowBlockStates());
        }

        var points = [ 40, 100, 300, 1200 ];

        this.scheduleNextTick(this.doNewPiece, this.state.moveDelay);
        this.setState({
            blockStates: this.state.blockStates,
            score: this.state.score + points[rows.length - 1]
        });
    },
    validateCurrentPiece: function(currentPiece, reschedule) {
        // Check for collision
        if (currentPiece.collides(this.state.blockStates)) {
            this.setState({ playing: false });
        } else if (reschedule === true) {
            this.scheduleNextTick(this.doDrop, this.state.moveDelay);
        }
        this.setState({currentPiece: currentPiece});
    },
    generateRowBlockStates: function() {
        var colStates = [];
        for (var col = 0; col < this.dimensions[1]; col++) {
            colStates.push('empty');
        }
        return colStates;
    },
    getInitialBlockStates: function() {
        // blockStates is a 2D array representing the state of each square on the game grid.
        // In this app, we use a matrix-style coordinate system (row, column) that is (obviously)
        // zero-based.
        // The state of each block is the CSS class we should use to style the block.
        // We utilize one special state, 'empty' to represent that no block is occupying the point.
        var rowStates = [];
        for (var row = 0; row < this.dimensions[0]; row++) {
            rowStates.push(this.generateRowBlockStates());
        }
        return rowStates;
    },
    getBlockStatesForRow: function(row) {
        // Important function that calculates the final state of each block in a row.
        // This is simply a combination of the blockStates and the blocks occupied by the current piece.
        var currentPiece = this.state.currentPiece;
        var col = 0;
        var rowBlockStates = this.state.blockStates[row].map(function(blockState) {
            var currentCol = col;
            col++;
            return (currentPiece && currentPiece.occupiesPoint(row, currentCol)) ? currentPiece.color : blockState;
        });
        return rowBlockStates;
    },
    movePiece: function(direction) {
        var currentPiece = this.state.currentPiece;
        if (currentPiece.move(direction, this.state.blockStates)) {
            this.validateCurrentPiece(currentPiece);
        }
    },
    rotatePiece: function() {
        var currentPiece = this.state.currentPiece;
        if (currentPiece.rotate(this.state.blockStates)) {
            this.validateCurrentPiece(currentPiece);
        }
    },
    getStatus: function() {
        if (this.state.playing) {
            return 'Go!';
        } else {
            return 'Game over!';
        }
    },
    resumeGame: function() {
        this.setState({ playing: true });
        this.scheduleNextTick(this.doDrop, this.state.moveDelay);
    },
    resetGame: function() {
        var state = this.createInitialState();
        state.currentPiece = this.createNewPiece(2, 2);
        this.setState(state);
        this.resumeGame();
    },
    getRandomColor: function() {
        var colors = ['red', 'green', 'blue', 'orange'];
        return colors[this.getRandomInt(colors.length)];
    },
    getRandomInt: function(max) {
        return Math.floor(Math.random() * max);
    },
    render: function() {
        return (
            <div id="game">
                <Status
                    score={this.state.score}
                    getStatus={this.getStatus}
                    resetGame={this.resetGame} />
                <Grid
                    numRows={this.dimensions[0]}
                    getBlockStatesForRow={this.getBlockStatesForRow} />
                <Controls
                    movePiece={this.movePiece}
                    rotatePiece={this.rotatePiece} />
            </div>
        );
    }
});

React.render(<Game />, document.getElementById('container'));
