import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Board2048 from '../components/Board2048'
import '../containers/MergeSchool.css';

let secret_seed = 1;
const tokenString = "Kaminyou".split("");
for(let i = 0; i < tokenString.length; i++){
    secret_seed *= tokenString[i].charCodeAt(0);
    secret_seed = secret_seed % 0xffffffff;
}

function MergeSchool() {
    const [board, setBoard] = useState([[0,0,0,0],
        [0,0,0,0],
        [0,0,0,0],
        [2,2,0,0]]);
    const [boardflag, setBoardflag] = useState([[0,0,0,0],
        [0,0,0,0],
        [0,0,0,0],
        [1,1,0,0]]);
    const [qs_ranking, setQs_ranking] = useState(32768);
    const [best_qs_ranking, setBest_qs_ranking] = useState(32768);
    const [gameover, setGameover] = useState(false);
    const [step, setStep] = useState(0);
    const [win, setWin] = useState(false);
    const [seed, setSeed] = useState(secret_seed);

    // Pesudo random number generator
    // 4 bytes hashing function By Thomas Wang or Robert Jenkins
    const prng = (seed, salt, mod) => {
        let temp = seed + salt;
        temp = (temp+0x7ed55d16) + (temp<<12);
        temp = (temp^0xc761c23c) ^ (temp>>19);
        temp = (temp+0x165667b1) + (temp<<5);
        temp = (temp+0xd3a2646c) ^ (temp<<9);
        temp = (temp+0xfd7046c5) + (temp<<3);
        temp = (temp^0xb55a4f09) ^ (temp>>16);
        if( temp < 0 ) temp = 0xffffffff + temp;
        return (temp % mod);
    }   
    
    // Initialize flag board
    const initializeBoardFlag = () => {
        let boardflag = [[0,0,0,0],
                        [0,0,0,0],
                        [0,0,0,0],
                        [0,0,0,0]];
        return boardflag;
    }

    // Rotate the matrix clockwisely
    const rotateClockwise = (matrix) => {
        let result = [];
        for(let i = 0; i < matrix[0].length; i++) {
            let row = matrix.map(e => e[i]).reverse();
            result.push(row);
        }
        return result;
    }
    
    // Rotate the matrix counterclockwisely
    const rotateCounterClockwise = (matrix) => {
        let result = [];
        for(let i = matrix[0].length - 1; i >= 0 ; i--) {
            let row = matrix.map(e => e[i]);
            result.push(row);
        }
        return result;
    }

    // Create board and add two "2" and reset everything required
    const initializeBoard = () => {
        let board = [[0,0,0,0],
                     [0,0,0,0],
                     [0,0,0,0],
                     [0,0,0,0]];
        let boardflag = initializeBoardFlag();
        let boardset = putGridRandom(board, boardflag, true);
        boardset = putGridRandom(boardset.board, boardset.boardflag, true);
        setBoard(boardset.board);
        setQs_ranking(32768);
        setGameover(false);
        setStep(0);
        setWin(false);
        setBoardflag(boardset.boardflag);
    }

    
    
    // Get all empty x y coordinates in board
    const getEmptyGrid = (board) => {
        let empty_grid = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j<4; j++) {
                if (board[i][j] === 0) {
                    empty_grid.push([i, j])
                }
            }
        }
        return empty_grid;
    }
    
    // Put one "2" in random empty grid
    const putGridRandom = (board, boardflag, init) => {
        let empty_grid = getEmptyGrid(board);
        let random_num = prng(seed, step, empty_grid.length);
        if (init){
            random_num = prng(seed, 0, empty_grid.length);
        } 
        let random_empty_grid = empty_grid[random_num];
        board[random_empty_grid[0]][random_empty_grid[1]] = 2;
        boardflag[random_empty_grid[0]][random_empty_grid[1]] = 1;
        return {board, boardflag};
    }
    
    // Check if one move is effecitve
    const justifyMove = (prev, next) => {
        let prev_string = JSON.stringify(prev)
        let new_string = JSON.stringify(next)
        return (prev_string !== new_string) ? true : false;
    }

    // Moveup function
    const moveUp = (prevBoard) => {
        let rotateAsRight = rotateClockwise(prevBoard);
        let output = moveRight(rotateAsRight);
        let board = rotateCounterClockwise(output.board);
        let combination =  output.combination;
    
        return {board, combination};
    }
    
    // Moveright function
    const moveRight = (prevBoard) => {
        let board = [];
        let combination = 0;
    
        for (let r = 0; r < prevBoard.length; r++) {
            let row = [];      
            for (let c = 0; c < prevBoard[r].length; c++) {
                let current = prevBoard[r][c];
                (current === 0) ? row.unshift(current) : row.push(current);
            }
            board.push(row);
        }
    
        for (let r = 0; r < board.length; r++) {
            // special case
            if ((board[r][0] === board[r][1]) && (board[r][0] !== 0) && (board[r][2] === board[r][3]) && (board[r][2] !== 0)) {
                board[r][3] = board[r][3] * 2;
                board[r][2] = board[r][1] * 2;
                board[r][1] = 0;
                board[r][0] = 0;
                combination += 2;
                continue;
            }

            for (let c = board[r].length - 1; c > 0; c--) {
                if (board[r][c] > 0 && board[r][c] === board[r][c - 1]) {
                    board[r][c] = board[r][c] * 2;
                    board[r][c - 1] = 0;
                    combination += 1;
                } else if (board[r][c] === 0 && board[r][c - 1] > 0) {
                    board[r][c] = board[r][c - 1];
                    board[r][c - 1] = 0;
                }
            }
        }
    
        return {board, combination};
    }
    
    // Movedown function
    const moveDown = (prevBoard) => {
        let rotateAsRight = rotateCounterClockwise(prevBoard);
        let output = moveRight(rotateAsRight);
        let board = rotateClockwise(output.board);
        let combination =  output.combination;
    
        return {board, combination};
    }
    
    // Moveleft function
    const moveLeft = (prevBoard) => {
        let rotateAsRight = rotateClockwise(rotateClockwise(prevBoard));
        let output = moveRight(rotateAsRight);
        let board = rotateCounterClockwise(rotateCounterClockwise(output.board));
        let combination =  output.combination;
    
        return {board, combination};
    }
    
    // Move
    const moveGrid = (direction) => {
        if (!gameover) {
            if (direction === 'up') {
                const nextBoard = moveUp(board);
                checkAndUpdateAfterMove(nextBoard);
            } 
            else if (direction === 'right') {
                const nextBoard = moveRight(board);
                checkAndUpdateAfterMove(nextBoard);
            } 
            else if (direction === 'down') {
                const nextBoard = moveDown(board);
                checkAndUpdateAfterMove(nextBoard);
            } 
            else if (direction === 'left') {
                const nextBoard = moveLeft(board);
                checkAndUpdateAfterMove(nextBoard);
            }
        } 
    }

    // Check everything after one move including gameover and win
    // Also, the step, ranking, best ranking should be updated here
    const checkAndUpdateAfterMove = (nextBoard) => {
        if (justifyMove(board, nextBoard.board)) {
            let boardflag = initializeBoardFlag();
            const nextBoardSetWithRandom = putGridRandom(nextBoard.board, boardflag, false);
            let qsRankNow = qs_ranking - nextBoard.combination;
            let stepNow = step + 1;
            setBoard(nextBoardSetWithRandom.board);
            setQs_ranking(qsRankNow);
            setStep(stepNow);
            setBoardflag(nextBoardSetWithRandom.boardflag);
            
            if (qsRankNow < best_qs_ranking){
                setBest_qs_ranking(qsRankNow)
            }

            if (checkGameover(nextBoardSetWithRandom.board)) {
                setGameover(true);
            }
        }
    }
    
    // Check if it is gameover
    const checkGameover = (board) => {
        let moves = [
            justifyMove(board, moveUp(board).board),
            justifyMove(board, moveRight(board).board),
            justifyMove(board, moveDown(board).board),
            justifyMove(board, moveLeft(board).board)
        ];
        
        let gameoverflag = (moves.includes(true)) ? false : true;

        if (checkWin(board)) {
            gameoverflag = true;
        }
        
        return gameoverflag;
    }

    // Check if it is win
    const checkWin = (board) => {
        for (let i=0; i<board.length;i++){
            for (let j=0; j<board[i].length;j++){
                if (board[i][j] === 65536){
                    setWin(true);
                    return true;
                }
            }
        }
        return false;
    }
    
    const handleKeyDown = (event) => {
        event.preventDefault();
        if (event.keyCode === 37) {
            moveGrid("left");
        } else if (event.keyCode === 38) {
            moveGrid("up");
        } else if (event.keyCode === 39) {
            moveGrid("right");
        } else if (event.keyCode === 40) {
            moveGrid("down");
        }
    }
    
    
    useEffect(() => {
        const body = document.querySelector('body');
        body.addEventListener('keydown', handleKeyDown);
        return () => body.removeEventListener('keydown', handleKeyDown);
    }, [board, boardflag, qs_ranking, step, best_qs_ranking, gameover, win]
    );
    
    // Useful function for you to check the endgame
    const setBadEnd = () => {
        let nextBoard = [[2,4,2,4],
                        [4,2,4,2],
                        [2,4,2,128],
                        [4,128,2,2]];
        setBoard(nextBoard);
    }
    
    // Useful function for you to check the best result
    const setGoodEnd = () => {
        let nextBoard = [[2,2,4,8],
                        [128,64,32,16],
                        [256,512,1024,2048],
                        [32768,16384,8192,4096]];
        setBoard(nextBoard);
    }


    return (
        <>      
            <Header handleReset={initializeBoard} qs_ranking={qs_ranking} best_qs_ranking={best_qs_ranking} step={step}/>
            <Board2048 className="wrapper" board={board} handleReset={initializeBoard} gameover={gameover} win={win} boardflag={boardflag}/>
            <div className="btn-groups">
                <div className="btn-useful" id="badend-btn" onClick={setBadEnd}>BadEnd</div>
                <div className="btn-useful" id="goodend-btn" onClick={setGoodEnd}>GoodEnd</div>
            </div>
        </>
    );
}

export default MergeSchool;