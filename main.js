// 设置类
class Settings {
    constructor() {
        // 棋盘
        this.Board = {
            w: 560, // width
            h: 560, // height
            row: 15, // 行
            col: 15, // 列
            onset: {
                x: 20,
                y: 20
            }, // 起始坐标

            backgroundColor: "gray", // 背景色
            wireColor: "white" // 线色
        };

        // 棋子
        this.Pieces = {
            r: 0.4, // 基于格子宽的半径

            color: {
                one: "white",
                two: "black"
            }
        };

        // 游戏
        this.Game = {
            // TODO: 可悔棋次数-- 至0不可
            dsa: 2
        };
    }
}

// 棋盘
class Board {
    constructor(board, piece, content) {
        this.board = board; // 棋盘设置
        this.piece = piece; // 棋子设置
        this.content = content; // 画布对象

        this.cellW = this.board.w / this.board.col; // 单元格宽
        this.cellH = this.board.w / this.board.row; // 单元格高
    }

    // 绘制棋盘
    draw() {
        // 清空棋盘
        this.clear();
        this.content.beginPath();

        // 开始绘制
        // 行
        for (let i = 0; i < this.board.row + 1; i++) {
            this.content.moveTo(
                this.board.onset.x,
                this.board.onset.y + i * this.cellH
            );
            this.content.lineTo(
                this.board.onset.x + this.board.w,
                this.board.onset.y + i * this.cellH
            );
        }

        // 列
        for (let i = 0; i < this.board.col + 1; i++) {
            this.content.moveTo(
                this.board.onset.x + i * this.cellW,
                this.board.onset.y
            );
            this.content.lineTo(
                this.board.onset.x + i * this.cellW,
                this.board.onset.y + this.board.h
            );
        }
        this.content.closePath();

        // 描边
        this.content.strokeStyle = this.board.wireColor;
        this.content.stroke();
    }

    // 重绘
    redraw(pieces) {
        // 绘制棋盘
        this.draw();

        // 根据数据绘制棋子
        for (let i = 0; i < pieces.length; i++) {
            this.setPiece(
                [pieces[i].xPosition, pieces[i].yPosition],
                pieces[i].user
            );
        }
    }

    // 清空棋盘
    clear() {
        // 清空棋盘区域
        this.content.clearRect(
            this.board.onset.x,
            this.board.onset.y,
            this.board.w,
            this.board.h
        );
    }

    // 判断是否在棋盘内
    isIn(clientX, clientY) {
        // 计算单击事件基于棋盘位置
        let x = clientX - this.board.onset.x;
        let y = clientY - this.board.onset.y;

        // 判断是否在棋盘范围内
        if (
            x < this.cellW / 2 ||
            x > this.board.w - this.cellW / 2 ||
            y < this.cellH / 2 ||
            y > this.board.h - this.cellH / 2
        ) {
            return false;
        } else {
            return [x, y];
        }
    }

    // 设置棋盘棋子
    setPiece(inCell, user) {
        // 取得单元格中心
        let centre = this.calcCellCentre(inCell);
        // 判断当前用户
        let color = user ? this.piece.color.one : this.piece.color.two;
        // 绘制棋子
        this.drawPiece(color, centre[0], centre[1], this.cellW * this.piece.r);
    }

    // 绘制棋子
    drawPiece(color, x, y, r) {
        // 开始路径
        this.content.beginPath();
        // 画圆
        this.content.arc(
            this.board.onset.x + x,
            this.board.onset.y + y,
            r,
            0,
            Math.PI * 2,
            false
        );
        // 关闭路径
        this.content.closePath();

        // 填充
        this.content.fillStyle = color;
        this.content.fill();
    }

    // 计算所处单元格
    calcBeCell(inBoard) {
        let colP = Math.ceil((inBoard[0] - this.cellW / 2) / this.cellW);
        let rowP = Math.ceil((inBoard[1] - this.cellH / 2) / this.cellH);
        return [colP, rowP];
    }

    // 计算单元格中心点
    calcCellCentre(inCell) {
        let centreX = inCell[0] * this.cellW;
        let centreY = inCell[1] * this.cellH;

        return [centreX, centreY];
    }
}

// 游戏进程类
class Game {
    constructor(oCanvas, oBoard) {
        // TODO: 修改数据为多维数组
        // TODO: 判断成功：分四线两向五子
        // TODO: this.当前用户
        this.Pieces = []; // ALL Pieces Data
        this.step = 0; // current step
        this.board = oBoard; // Board Object
        this.canvas = oCanvas; // Canvas Object
    }

    // game init
    init() {
        // clear data
        this.Pieces = [];
        this.step = 0;
    }

    // begin game
    begin() {
        // init
        this.init();

        // 绘制棋盘
        this.board.draw();
    }

    // event
    event(ev) {
        let id = ev.target.id;

        if (id == "canvas") {
            // 鼠标单击事件
            if (ev.type == "mousedown") {
                if (ev.button != 0) {
                    return false;
                }

                // 计算基于图片位置
                let clientX = ev.pageX - this.canvas.offsetLeft;
                let clientY = ev.pageY - this.canvas.offsetTop;

                // 在棋盘内
                let inBoard = this.board.isIn(clientX, clientY);
                if (inBoard) {
                    // 所处单元格
                    let inCell = this.board.calcBeCell(inBoard);

                    // 存在棋子，结束
                    if (this.isInPieces(inCell)) {
                        return false;
                    }

                    // 落棋
                    this.downPiece(inCell);
                }
            }
        }

        // 悔棋事件
        if (id == "undo") {
            if (ev.type == "click") {
                this.undo();
            }
        }
    }

    // 落棋
    downPiece(inCell) {
        // 计算当前步数
        this.step++;

        // 判断用户
        let user = this.step % 2;

        // 设置棋子
        this.board.setPiece(inCell, user);

        // 数据处理
        this.Pieces.push({
            xPosition: inCell[0],
            yPosition: inCell[1],
            user: user
        });

        // 判断是否胜利
        if (this.isWin(inCell[0], inCell[1], user)) {
            alert(`恭喜 ${user == 0 ? "黑棋" : "白棋"} 获胜`)
            this.begin();
        }

    }

    // is win
    isWin(x, y, user) {
        let dir = [[1, -1], [1, 0], [1, 1], [0, 1]]
        for (let i = 0; i < 4; i++) {
            let add = 1;
            for (let n = 1; ; n++) {
                let flag = true;
                if (this.hasPieces(x + dir[i][0] * n, y + dir[i][1] * n, user)) {
                    add++;
                    flag = false;
                }

                if (this.hasPieces(x - dir[i][0] * n, y - dir[i][1] * n, user)) {
                    add++;
                    flag = false;
                }

                if (flag) {
                    break
                } else {
                    if (add == 5) {
                        console.log("win");
                        return true
                    }
                }
            }
        }
        return false
    }

    // 用户棋子是否存在
    hasPieces(x, y, user) {
        return this.Pieces.find(value => {
            return value.xPosition == x && value.yPosition == y && value.user == user
        });
    }

    // 悔棋
    undo() {
        // 数据倒退
        this.step--;
        this.Pieces.pop();

        // 重绘棋盘
        this.board.redraw(this.Pieces);
    }

    // 是否已存在棋子
    isInPieces(inCell) {
        return this.Pieces.find(value => {
            return value.xPosition == inCell[0] && value.yPosition == inCell[1]
        });
    }
}

// 创建设置对象
var Setting = new Settings();

// 创建棋盘对象
var oBoard = new Board(Setting.Board, Setting.Pieces, content);

// 创建游戏进程
var game = new Game(oCanvas, oBoard);

// 开始
game.begin();

// 画布事件
oCanvas.onmousedown = function (ev) {
    var ev = window.event || ev;

    // 将事件接入game控制
    game.event(ev);
};

// 悔棋事件
oUndo.onclick = function (ev) {
    var ev = window.event || ev;

    // 将事件接入game控制
    game.event(ev);
};
