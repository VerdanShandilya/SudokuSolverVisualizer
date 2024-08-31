let solveSudokuProcess = null;

document.addEventListener('DOMContentLoaded', function () {
    const gridSize = 9;
    const solveButton = document.getElementById("solve-btn");
    solveButton.addEventListener('click', solveSudoku);

    const resetButton = document.getElementById("reset-btn");
    resetButton.addEventListener('click', resetSudoku);

    const sudokuGrid = document.getElementById("sudoku-grid");
    createSudokuGrid(sudokuGrid, gridSize);
});

function createSudokuGrid(sudokuGrid, gridSize) {
    sudokuGrid.innerHTML = '';

    for (let row = 0; row < gridSize; row++) {
        const newRow = document.createElement("tr");
        for (let col = 0; col < gridSize; col++) {
            const cell = document.createElement("td");
            const input = document.createElement("input");
            input.type = "number";
            input.className = "cell";
            input.id = `cell-${row}-${col}`;
            cell.appendChild(input);
            newRow.appendChild(cell);
        }
        sudokuGrid.appendChild(newRow);
    }
}

function resetSudoku() {
    if (solveSudokuProcess) {
        solveSudokuProcess.abort();
        solveSudokuProcess = null;
    }

    const cellInputs = document.querySelectorAll(".cell");
    cellInputs.forEach((input) => {
        input.value = "";
        input.classList.remove("solved");
        input.classList.remove("backtrack");
        input.classList.remove("invalid-input");
        input.classList.remove("user-input");
    });
}

async function solveSudoku() {
    if (solveSudokuProcess) {
        alert("A Sudoku solving process is already running. Please wait for it to finish.");
        return;
    }

    const gridSize = 9;
    const sudokuArray = [];

    for (let row = 0; row < gridSize; row++) {
        sudokuArray[row] = [];
        for (let col = 0; col < gridSize; col++) {
            const cellId = `cell-${row}-${col}`;
            const cellValue = document.getElementById(cellId).value;
            sudokuArray[row][col] = cellValue !== "" ? parseInt(cellValue) : 0;
        }
    }
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const cellId = `cell-${row}-${col}`;
            const cell = document.getElementById(cellId);

            if (sudokuArray[row][col] !== 0) {
                cell.classList.add("user-input");
            }
        }
    }
    let isValid = true;
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const cellId = `cell-${row}-${col}`;
            const cellValue = document.getElementById(cellId).value;

            if (cellValue !== "") {
                const tempValue = sudokuArray[row][col];
                sudokuArray[row][col] = 0;

                if (!isValidInput(cellValue) || !isValidMove(sudokuArray, row, col, parseInt(cellValue))) {
                    document.getElementById(cellId).classList.add("invalid-input");
                    isValid = false;
                } else {
                    document.getElementById(cellId).classList.remove("invalid-input");
                }
                sudokuArray[row][col] = tempValue;
            }
        }
    }

    if (!isValid) {
        alert("Invalid input. Please enter valid numbers (1-9) that follow the Sudoku rules.");
        return;
    }
    solveSudokuProcess = new AbortController();
    const { signal } = solveSudokuProcess;
    try {
        if (await solveSudokuHelper(sudokuArray, 0, 0, signal)) {
            for (let row = 0; row < gridSize; row++) {
                for (let col = 0; col < gridSize; col++) {
                    const cellId = `cell-${row}-${col}`;
                    const cell = document.getElementById(cellId);
                    if (!cell.classList.contains("user-input")) {
                        cell.value = sudokuArray[row][col];
                        cell.classList.add("solved");
                        await sleep(30, signal);
                    }
                }
            }
        } else {
            alert("No solution exists for the given Sudoku puzzle.");
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Sudoku solving process aborted.');
        } else {
            throw error;
        }
    } finally {
        solveSudokuProcess = null;
    }
}

async function solveSudokuHelper(board, row, col, signal) {
    const gridSize = 9;

    for (; row < gridSize; row++) {
        for (; col < gridSize; col++) {
            if (signal.aborted) {
                throw new DOMException('Sudoku solving process aborted.', 'AbortError');
            }

            if (board[row][col] === 0) {
                for (let num = 1; num <= 9; num++) {
                    if (isValidMove(board, row, col, num)) {
                        board[row][col] = num;
                        const cellId = `cell-${row}-${col}`;
                        const cell = document.getElementById(cellId);
                        cell.value = num;
                        cell.classList.add("backtrack");
                        await sleep(30, signal);
                        if (await solveSudokuHelper(board, row, col + 1, signal)) {
                            return true;
                        }

                        board[row][col] = 0;
                        cell.value = "";
                        cell.classList.remove("backtrack");
                        await sleep(30, signal);
                    }
                }
                return false;
            }
        }
        col = 0;
    }

    return true;
}

function isValidInput(value) {
    return value >= 1 && value <= 9;
}

function isValidMove(board, row, col, num) {
    const gridSize = 9;

    for (let i = 0; i < gridSize; i++) {
        if (board[row][i] === num || board[i][col] === num) {
            return false;
        }
    }
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;

    for (let i = startRow; i < startRow + 3; i++) {
        for (let j = startCol; j < startCol + 3; j++) {
            if (board[i][j] === num) {
                return false;
            }
        }
    }

    return true;
}

async function sleep(ms, signal) {
    if (signal.aborted) {
        throw new DOMException('Sudoku solving process aborted.', 'AbortError');
    }
    return new Promise(resolve => setTimeout(resolve, ms));
}
