// Some globals
var gridDimensions = [20, 10]; // rows, columns
var previewerDimentions = [4, 4]; // rows, columns

var BlockState = {
    empty: 0,
    red: 1,
    green: 2,
    blue: 3,
    orange: 4,
    yellow: 5,
    purple: 6,
    grey: 7
};

var pieceTypes = [
    {
        // L
        color: BlockState.green,
        points: [ [0,-1], [-1,-1], [-1,0], [-1,1] ]
    },
    {
        // J
        color: BlockState.yellow,
        points: [ [0,-1], [-1,-1], [0,0], [0,1] ]
    },
    {
        // box
        color: BlockState.red,
        points: [ [0,0], [-1,0], [-1,-1], [0,-1] ]
    },
    {
        // I
        color: BlockState.orange,
        points: [ [-2,0], [-1,0], [0,0], [1,0] ]
    },
    {
        // T
        color: BlockState.blue,
        points: [ [0,0], [-1,0], [-1,1], [-1,-1] ]
    },
    {
        // S
        color: BlockState.purple,
        points: [ [0,0], [-1,0], [-1,1], [0,-1] ]
    },
    {
        // Z
        color: BlockState.grey,
        points: [ [0,0], [-1,0], [-1,-1], [0,1] ]
    }
];

function blockStateClassFromEnum(val) {
    for (var propName in BlockState) {
        if (BlockState[propName] === val) {
            return propName;
        }
    }
    return "";
}

function generateRowBlockStates() {
    var colStates = [];
    for (var col = 0; col < gridDimensions[1]; col++) {
        colStates.push(BlockState.empty);
    }
    return colStates;
}

function getInitialBlockStates() {
    // blockStates is a 2D array representing the state of each square on the game grid.
    // In this app, we use a matrix-style coordinate system (row, column) that is (obviously)
    // zero-based.
    // The state of each block is the CSS class we should use to style the block.
    // We utilize one special state, 'empty' to represent that no block is occupying the point.
    var rowStates = [];
    for (var row = 0; row < gridDimensions[0]; row++) {
        rowStates.push(generateRowBlockStates());
    }
    return rowStates;
}

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
            blocks.push(<Block color={blockStateClassFromEnum(this.props.columnStates[col])} />);
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
        var tableClassName = "grid-table " + this.props.size;
        return (
            <div><table className={tableClassName}><tbody>{rows}</tbody></table></div>
        );
    }
});

var PiecePreviewer = React.createClass({
    getBlockStatesForRow: function(row) {
        var rowBlockStates = [];
        for (var col = 0; col < previewerDimentions[1]; col++) {
            rowBlockStates[col] = BlockState.empty;
        }

        var index = this.props.pieceIndex;
        var piece = new Piece(0, 0, pieceTypes[index].color, pieceTypes[index].points);

        for (var pointIndex = 0; pointIndex < piece.points.length; pointIndex++) {
            var point = piece.points[pointIndex];
            if (point[0] + 2 == row) {
                rowBlockStates[point[1] + 2] = piece.color;
            }
        }

       return rowBlockStates;
    },
    render: function() {
        return (
            <Grid
                numRows={previewerDimentions[0]}
                getBlockStatesForRow={this.getBlockStatesForRow} />
        )
    }
});

var Status = React.createClass({
    render: function() {
        var buttonClass = "control-button " + (this.props.playing ? "control-button-green" : "control-button-red");
        return (
            <div className="status">
                <button onClick={this.props.resetGame}
                        className={buttonClass}>
                    {this.props.getStatus()}
                </button>
                <br />
                <div className="score">
                    <span className="score-title">Score:</span>
                    <span className="score-number">{this.props.score}</span>
                </div>
                <PiecePreviewer pieceIndex={this.props.nextPieceIndex} />
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
        if (!this.pointOnGrid(coords[0], coords[1], rows, cols) || (blockStates[coords[0]][coords[1]] !== BlockState.empty)) {
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
            if (blockStates[row + 1][col] !== BlockState.empty) {
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
                //that.resetGame();
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
        var blockStates = getInitialBlockStates();
        return {
            blockStates: blockStates,
            currentPiece: null,
            nextPieceIndex: this.getRandomInt(pieceTypes.length),
            moveDelay: 400,
            playing: false,
            score: 0
        };
    },
    createNextPiece: function(row, col) {
        var index = this.state.nextPieceIndex;
        var piece = new Piece(row, col, pieceTypes[index].color, pieceTypes[index].points);
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

    // Assumption is that the currentPiece exists and is in a valid spot
    doDrop: function() {
        var currentPiece = this.state.currentPiece;
        if (!currentPiece) return;
        
        // Check if the piece landed previously
        if (currentPiece && currentPiece.landed(this.state.blockStates)) {
            // Merge the piece into the blockStates
            currentPiece.merge(this.state.blockStates);
            this.setState({blockStates: this.state.blockStates});

            // Check for lines
            var lineRows = [];
            for (var i = 0; i < this.state.blockStates.length; i++) {
                var line = true;
                var rowBlockStates = this.state.blockStates[i];
                for (var index in rowBlockStates) {
                    if (rowBlockStates[index] === BlockState.empty) {
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
                this.scheduleNextTick(this.doNextPiece, this.state.moveDelay);
            }
            currentPiece = null;
            this.setState({currentPiece: currentPiece});
        } else {
            // Piece hasn't landed, so drop it.
            currentPiece.row++;
            this.validateCurrentPiece(currentPiece, true /* reschedule */);
        }
    },
    doNextPiece: function() {
        var currentPiece = this.createNextPiece(2, this.getRandomInt(gridDimensions[1] - 4) + 2);
        var nextPieceIndex = this.getRandomInt(pieceTypes.length);
        this.setState({nextPieceIndex: nextPieceIndex});
        this.validateCurrentPiece(currentPiece, true /* reschedule */);
    },
    doLine: function(rows) {
        rows.sort();
        for (var i = 0; i < rows.length; i++) {
            this.state.blockStates.splice(rows[i], 1);
            this.state.blockStates.unshift(generateRowBlockStates());
        }

        var points = [ 40, 100, 300, 1200 ];

        this.scheduleNextTick(this.doNextPiece, this.state.moveDelay);
        this.setState({
            blockStates: this.state.blockStates,
            score: this.state.score + points[rows.length - 1]
        });
        this.props.onScoreUpdate(this.state.score);
    },

    validateCurrentPiece: function(currentPiece, reschedule) {
        // Check for collision
        if (currentPiece.collides(this.state.blockStates)) {
            this.setState({ playing: false });
            this.clearInterval('drop');
        } else if (reschedule === true) {
            this.scheduleNextTick(this.doDrop, this.state.moveDelay);
        }
        this.setState({currentPiece: currentPiece});
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
        if (currentPiece && currentPiece.move(direction, this.state.blockStates)) {
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
        state.currentPiece = this.createNextPiece(2, 2);
        state.nextPieceIndex = this.getRandomInt(pieceTypes.length);
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
        if (this.props.onGameBlockUpdate) {
            var blockStates = [];
            for (var row = 0; row < gridDimensions[0]; row++) {
                blockStates.push(this.getBlockStatesForRow(row));
            }
            this.props.onGameBlockUpdate(blockStates);
        }
        return (
            <div id="game">
                <Status
                    score={this.state.score}
                    playing={this.state.playing}
                    nextPieceIndex={this.state.nextPieceIndex}
                    getStatus={this.getStatus}
                    resetGame={this.resetGame} />
                <Grid
                    numRows={gridDimensions[0]}
                    getBlockStatesForRow={this.getBlockStatesForRow} />
            </div>
        );
    }
});

var Viewer = React.createClass({
    getBlockStatesForRow: function(row) {
        return this.props.blockStates[row];
    },
    render: function() {
        return (
            <div className="viewer">
                <Grid
                    size="small"
                    numRows={gridDimensions[0]}
                    getBlockStatesForRow={this.getBlockStatesForRow} />
            </div>
        );
    }
});

var ViewerContainer = React.createClass({
    getInitialState: function() {
        var that = this;
        socket.on('blocks', function(data) {
            if (that.state.players[data.userId] === undefined) {
                that.state.players[data.userId] = {};
            }
            that.state.players[data.userId].blockStates = data.blockStates;
            that.setState({ players: that.state.players });
        });
        socket.on('score', function(data) {
            if (that.state.players[data.userId] === undefined) {
                that.state.players[data.userId] = {};
            }
            that.state.players[data.userId].score = data.score;
            that.setState({ players: that.state.players });
        });
        socket.on('disconnect', function(userId) {
            delete that.state.players[userId];
            that.setState({ players: that.state.players });
        });
        return { players: {} };
    },
    render: function() {
        var viewers = [];
        for (var propName in this.state.players) {
            viewers.push(<Viewer blockStates={this.state.players[propName].blockStates} score={this.state.players[propName].score} />);
        }
        return (
            <div className="viewercontainer">{viewers}</div>
        );
    }
});

var userId;
var socket = io.connect('/');
socket.on('connect', function() {
    console.log('connected');
});
socket.on('disconnect', function() {
    console.log('disconnected');
});
socket.on('id', function(id) {
    userId = id;
});

function onGameBlockUpdate(blockStates) {
    if (userId !== undefined) {
        socket.emit('blocks', {
            userId: userId,
            blockStates: blockStates
        });
    }
}

function onScoreUpdate(score) {
    if (userId !== undefined) {
        socket.emit('score', score);
    }
}

var MainContainer = React.createClass({
    render: function() {
        return (
            <div>
                <Game onGameBlockUpdate={onGameBlockUpdate}
                      onScoreUpdate={onScoreUpdate} />
                <ViewerContainer />
            </div>
        );
    }
});

React.render(<MainContainer />, document.getElementById('container'));
