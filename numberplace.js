// Copyright (C) 2014-2020 Hideaki Narita

//////////////////////////////////////////////////////////////////////
//
// NumberPlace class
//
//////////////////////////////////////////////////////////////////////

function NumberPlace(view) {
    this.numbers = [
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0
    ];
    this.flags = [
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0
    ];
    this.FLAG_ALLNUMBERS = (1 << 9) - 1;
    this.FLAG_LOCKED = 1 << 9;
    this.gridBaseIndex = [ 0, 3, 6, 27, 30, 33, 54, 57, 60 ];
    this.gridIndex = [ 0, 1, 2, 9, 10, 11, 18, 19, 20 ];
    this.numbersLocked = false;
    this.maxSolutions = 100;
    this.solutions = null;
    this.solutionIndex = 0;
    this.selected = -1;
    if (arguments.length >= 1) {
        this.view = view;
    } else {
        this.view = null;
    }
}

NumberPlace.prototype.isLocked = function(i) {
    return (this.flags[i] & this.FLAG_LOCKED) != 0 ? true : false;
}

NumberPlace.prototype.setNumber = function(i, n, f) {
    switch (arguments.length) {
    case 2:
        if (this.numbers[i] != n && !this.isLocked(i)) {
            this.numbers[i] = n;
            if (this.view != null) {
                this.view.onNumberChanged(i, this);
            }
        }
        break;
    case 3:
        if (this.numbers[i] != n) {
            this.numbers[i] = n;
            this.flags[i] = f;
            if (this.view != null) {
                this.view.onNumberChanged(i, this);
            }
        } else {
            var x = this.flags[i] ^ f;
            if (x != 0) {
                this.flags[i] = f;
                if (n > 0 && (x & this.FLAG_LOCKED) != 0) {
                    if (this.view != null) {
                        this.view.onNumberChanged(i, this);
                    }
                }
            }
        }
        break;
    }
}

NumberPlace.prototype.clear = function() {
    for (var i = 0; i < 9 * 9; i++) {
        this.setNumber(i, 0, 0);
    }
    this.numbersLocked = false;
    this.solutions = null;
    this.solutionIndex = 0;
    this.selected = -1;
}

NumberPlace.prototype.validateRow = function(i) {
    var n = this.numbers[i];
    var m = 1 << (n - 1);
    var j = Math.floor(i / 9) * 9;
    var k = j + 9;
    while (j < k) {
        this.flags[j] &= ~m;
        if (j != i && this.numbers[j] == n) {
            return false;
        }
        j++;
    }
    return true;
}

NumberPlace.prototype.validateCol = function(i) {
    var n = this.numbers[i];
    var m = 1 << (n - 1);
    var j = i % 9;
    var k = j + 9 * 9;
    while (j < k) {
        this.flags[j] &= ~m;
        if (j != i && this.numbers[j] == n) {
            return false;
        }
        j += 9;
    }
    return true;
}

NumberPlace.prototype.validateGrd = function(i) {
    var n = this.numbers[i];
    var m = 1 << (n - 1);
    var c = i % 9;
    var r = Math.floor(i / 9);
    var gc = Math.floor(c / 3);
    var gr = Math.floor(r / 3);
    var g = this.gridBaseIndex[gc + gr * 3];
    for (var h = 0; h < 9; h++) {
        j = g + this.gridIndex[h];
        this.flags[j] &= ~m;
        if (j != i && this.numbers[j] == n) {
            return false;
        }
    }
    return true;
}

NumberPlace.prototype.validate = function() {
    for (var i = 0; i < 9 * 9; i++) {
        this.flags[i] |= this.FLAG_ALLNUMBERS;
    }
    for (var i = 0; i < 9 * 9; i++) {
        if (this.numbers[i] == 0) {
            continue;
        }
        if (!this.validateRow(i)) {
            return false;
        }
        if (!this.validateCol(i)) {
            return false;
        }
        if (!this.validateGrd(i)) {
            return false;
        }
    }
    return true;
}

NumberPlace.prototype.doSolve = function() {
    if (!this.validate()) {
        return;
    }
    var j = -1;
    var k = 10;
    for (var i = 0; i < 9 * 9; i++) {
        if (this.numbers[i] > 0) {
            continue;
        }
        var m = this.flags[i];
        if (m == 0) {
            return;
        }
        var l = 0;
        while (m > 0) {
            if ((m & 1) == 1) {
                l++;
            }
            m >>>= 1;
        }
        if (k > l) {
            j = i;
            k = l;
        }
    }
    if (j < 0) {
        this.solutions.push(this.toString());
        return;
    }
    var f = this.flags[j];
    for (var i = 1; i <= 9; i++) {
        if ((f & 1) == 1) {
            this.numbers[j] = i;
            this.doSolve();
            this.numbers[j] = 0;
            if (this.solutions.length > this.maxSolutions) {
                break;
            }
        }
        f >>>= 1;
        if (f == 0) {
            break;
        }
    }
}

NumberPlace.prototype.solve = function() {
    this.solutions = new Array();
    this.solutionIndex = 0;
    this.doSolve();
    if (this.solutions.length > 0) {
        this.parse(this.solutions[0]);
        return this.solutions.length;
    } else {
        this.solutions = null;
        return 0;
    }
}

NumberPlace.prototype.nextSolution = function() {
    if (this.solutions == null) return;
    this.solutionIndex = (this.solutionIndex + 1) % Math.min(this.solutions.length, this.maxSolutions);
    this.parse(this.solutions[this.solutionIndex]);
}

NumberPlace.prototype.parse = function(s) {
    if (s == null) return;
    var i = 0;
    if (s.length > 0 && s.charCodeAt(0) == 0x3A /* colon */) {
        this.numbersLocked = false;
        for (var j = 1; j < s.length; j++) {
            var c = s.charCodeAt(j);
            switch (c) {
            case 0x30: // 0
            case 0x31: // 1
            case 0x32: // 2
            case 0x33: // 3
            case 0x34: // 4
            case 0x35: // 5
            case 0x36: // 6
            case 0x37: // 7
            case 0x38: // 8
            case 0x39: // 9
                if (i < 9 * 9) {
                    this.setNumber(i, c - 0x30, 0);
                    i++;
                }
                break;
            default:
                break;
            }
        }
    } else {
        this.numbersLocked = true;
        for (var j = 0; j < s.length; j++) {
            var c = s.charCodeAt(j);
            switch (c) {
            case 0x30: // 0
                if (i < 9 * 9) {
                    this.setNumber(i, 0, 0);
                    i++;
                }
                break;
            case 0x31: // 1
            case 0x32: // 2
            case 0x33: // 3
            case 0x34: // 4
            case 0x35: // 5
            case 0x36: // 6
            case 0x37: // 7
            case 0x38: // 8
            case 0x39: // 9
                if (i < 9 * 9) {
                    this.setNumber(i, c - 0x30, this.FLAG_LOCKED);
                    i++;
                }
                break;
            case 0x41: // A
            case 0x42: // B
            case 0x43: // C
            case 0x44: // D
            case 0x45: // E
            case 0x46: // F
            case 0x47: // G
            case 0x48: // H
            case 0x49: // I
                if (i < 9 * 9) {
                    this.setNumber(i, c - 0x40, 0);
                    i++;
                }
                break;
            case 0x3A: // : (colon)
                while (i < 9 * 9) {
                    this.setNumber(i, 0, 0);
                    i++;
                }
                i = 0;
                for (j++; j < s.length; j++) {
                    c = s.charCodeAt(j);
                    switch (c) {
                    case 0x30: // 0
                    case 0x31: // 1
                    case 0x32: // 2
                    case 0x33: // 3
                    case 0x34: // 4
                    case 0x35: // 5
                    case 0x36: // 6
                    case 0x37: // 7
                    case 0x38: // 8
                    case 0x39: // 9
                        if (i < 9 * 9) {
                            this.setNumber(i, c - 0x30);
                            i++;
                        }
                        break;
                    default:
                        break;
                    }
                }
                return;
            default:
                break;
            }
        }
    }
    while (i < 9 * 9) {
        this.setNumber(i, 0, 0);
        i++;
    }
}

NumberPlace.prototype.toString = function() {
    var a = [];
    if (this.numbersLocked) {
        for (var i = 0; i < 9 * 9; i++) {
            if (this.isLocked(i)) {
                switch (this.numbers[i]) {
                case 0: a.push("0"); break;
                case 1: a.push("1"); break;
                case 2: a.push("2"); break;
                case 3: a.push("3"); break;
                case 4: a.push("4"); break;
                case 5: a.push("5"); break;
                case 6: a.push("6"); break;
                case 7: a.push("7"); break;
                case 8: a.push("8"); break;
                case 9: a.push("9"); break;
                default: break;
                }
            } else {
                switch (this.numbers[i]) {
                case 0: a.push("0"); break;
                case 1: a.push("A"); break;
                case 2: a.push("B"); break;
                case 3: a.push("C"); break;
                case 4: a.push("D"); break;
                case 5: a.push("E"); break;
                case 6: a.push("F"); break;
                case 7: a.push("G"); break;
                case 8: a.push("H"); break;
                case 9: a.push("I"); break;
                default: break;
                }
            }
        }
    } else {
        a.push(":");
        for (var i = 0; i < 9 * 9; i++) {
            switch (this.numbers[i]) {
            case 0: a.push("0"); break;
            case 1: a.push("1"); break;
            case 2: a.push("2"); break;
            case 3: a.push("3"); break;
            case 4: a.push("4"); break;
            case 5: a.push("5"); break;
            case 6: a.push("6"); break;
            case 7: a.push("7"); break;
            case 8: a.push("8"); break;
            case 9: a.push("9"); break;
            default: break;
            }
        }
    }
    return a.join("");
}

NumberPlace.prototype.lockNumbers = function() {
    for (var i = 0; i < 9 * 9; i++) {
        var n = this.numbers[i];
        if (n > 0) {
            this.setNumber(i, n, this.FLAG_LOCKED);
        } else {
            this.setNumber(i, 0, 0);
        }
    }
    this.numbersLocked = true;
}

NumberPlace.prototype.unlockNumbers = function() {
    this.numbersLocked = false;
    for (var i = 0; i < 9 * 9; i++) {
        this.setNumber(i, this.numbers[i], 0);
    }
}

NumberPlace.prototype.resetNumbers = function() {
    for (var i = 0; i < 9 * 9; i++) {
        this.setNumber(i, 0);
    }
    this.solutions = null;
}

NumberPlace.prototype.getNoNumbers = function() {
    var c = 0;
    for (var i = 0; i < 9 * 9; i++) {
        if (this.numbers[i] == 0) {
            c++;
        }
    }
    return c;
}

NumberPlace.prototype.canUnlock = function() {
    for (var i = 0; i < 9 * 9; i++) {
        if (this.numbers[i] > 0 && !this.isLocked(i)) {
            return false;
        }
    }
    return true;
}

NumberPlace.prototype.isSelected = function(i) {
    return i == this.selected ? true : false;
}

NumberPlace.prototype.changeSelection = function(i) {
    var h = this.selected;
    this.selected = -1;
    if (h >= 0) {
        if (this.view != null) {
            this.view.onSelectionChanged(h, this);
        }
    }
    if (i >= 0 && h != i) {
        this.selected = i;
        if (this.view != null) {
            this.view.onSelectionChanged(i, this);
        }
    }
}

NumberPlace.prototype.cancelSelection = function() {
    this.changeSelection(-1);
}

NumberPlace.prototype.moveLeft = function(i) {
    for (var j = 0; j < 9 * 9; j++) {
        i = (i + 9 * 9 - 1) % (9 * 9);
        if (this.isLocked(i) == false) {
            break;
        }
    }
    return i;
}

NumberPlace.prototype.moveRight = function(i) {
    for (var j = 0; j < 9 * 9; j++) {
        i = (i + 1) % (9 * 9);
        if (this.isLocked(i) == false) {
            break;
        }
    }
    return i;
}

NumberPlace.prototype.moveUp = function(i) {
    for (var j = 0; j < 9 * 9; j++) {
        var c = i % 9;
        var r = Math.floor(i / 9);
        if (r > 0) {
            i = c + (r - 1) * 9;
        } else if (c > 0) {
            i = c - 1 + 8 * 9;
        } else {
            i = 9 * 9 - 1;
        }
        if (this.isLocked(i) == false) {
            break;
        }
    }
    return i;
}

NumberPlace.prototype.moveDown = function(i) {
    for (var j = 0; j < 9 * 9; j++) {
        var c = i % 9;
        var r = Math.floor(i / 9);
        if (r < 8) {
            i = c + (r + 1) * 9;
        } else if (c < 8) {
            i = c + 1;
        } else {
            i = 0;
        }
        if (this.isLocked(i) == false) {
            break;
        }
    }
    return i;
}

NumberPlace.prototype.isSelectionAllowed = function() {
    return this.solutions == null ? true : false;
}

//////////////////////////////////////////////////////////////////////
//
// NumberPlaceCanvas class
//
//////////////////////////////////////////////////////////////////////

function NumberPlaceCanvas(name, cellW, cellH, thinLineW, thickLineW) {
    this.name = name;
    this.cellW = cellW;
    this.cellH = cellH;
    this.thinLineW = thinLineW;
    this.thickLineW = thickLineW;
    this.width = thickLineW * 4 + thinLineW * 6 + cellW * 9;
    this.height = thickLineW * 4 + thinLineW * 6 + cellH * 9;
    this.digitH = Math.floor(cellH * 0.8);
    this.bgColor = "rgb(0,128,0)";
    this.lineColor = "rgb(0,0,0)";
    this.fgColor = "rgb(0,0,0)";
    this.hiColor = "rgb(128,0,0)";
    this.lockedColor = "rgb(255,94,25)";
    this.digitFont = "bold " + this.digitH + "px 'san-serif'";
    this.cellX = [
        thickLineW * 1 + cellW * 0 + thinLineW * 0,
        thickLineW * 1 + cellW * 1 + thinLineW * 1,
        thickLineW * 1 + cellW * 2 + thinLineW * 2,
        thickLineW * 2 + cellW * 3 + thinLineW * 2,
        thickLineW * 2 + cellW * 4 + thinLineW * 3,
        thickLineW * 2 + cellW * 5 + thinLineW * 4,
        thickLineW * 3 + cellW * 6 + thinLineW * 4,
        thickLineW * 3 + cellW * 7 + thinLineW * 5,
        thickLineW * 3 + cellW * 8 + thinLineW * 6,
    ];
    this.cellY = [
        thickLineW * 1 + cellH * 0 + thinLineW * 0,
        thickLineW * 1 + cellH * 1 + thinLineW * 1,
        thickLineW * 1 + cellH * 2 + thinLineW * 2,
        thickLineW * 2 + cellH * 3 + thinLineW * 2,
        thickLineW * 2 + cellH * 4 + thinLineW * 3,
        thickLineW * 2 + cellH * 5 + thinLineW * 4,
        thickLineW * 3 + cellH * 6 + thinLineW * 4,
        thickLineW * 3 + cellH * 7 + thinLineW * 5,
        thickLineW * 3 + cellH * 8 + thinLineW * 6,
    ];
    this.canvasX = 0;
    this.canvasY = 0;
}

NumberPlaceCanvas.prototype.draw = function(s) {
    this.drawBackground();
    for (var i = 0; i < 9 * 9; i++) {
        this.drawCell(i, s.numbers[i], s.isLocked(i), s.isSelected(i));
    }
}

NumberPlaceCanvas.prototype.drawBackground = function() {
    var width = this.width;
    var height = this.height;
    var cellW = this.cellW;
    var cellH = this.cellH;
    var thinLineW = this.thinLineW;
    var thickLineW = this.thickLineW;
    var cvs = document.getElementById(this.name);
    var ctx = cvs.getContext("2d");
    cvs.setAttribute("width", width);
    cvs.setAttribute("height", height);
    var bRect = document.body.getBoundingClientRect();
    var cRect = cvs.getBoundingClientRect();
    this.canvasX = cRect.left - bRect.left;
    this.canvasY = cRect.top - bRect.top;
    // Fill Background
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, width, height);
    // Draw Thick Lines
    ctx.beginPath();
    ctx.moveTo(thickLineW * 0 + thinLineW * 0 + cellW * 0 + thickLineW / 2, 0);
    ctx.lineTo(thickLineW * 0 + thinLineW * 0 + cellW * 0 + thickLineW / 2, height);
    ctx.moveTo(thickLineW * 1 + thinLineW * 2 + cellW * 3 + thickLineW / 2, 0);
    ctx.lineTo(thickLineW * 1 + thinLineW * 2 + cellW * 3 + thickLineW / 2, height);
    ctx.moveTo(thickLineW * 2 + thinLineW * 4 + cellW * 6 + thickLineW / 2, 0);
    ctx.lineTo(thickLineW * 2 + thinLineW * 4 + cellW * 6 + thickLineW / 2, height);
    ctx.moveTo(thickLineW * 3 + thinLineW * 6 + cellW * 9 + thickLineW / 2, 0);
    ctx.lineTo(thickLineW * 3 + thinLineW * 6 + cellW * 9 + thickLineW / 2, height);
    ctx.moveTo(0,     thickLineW * 0 + thinLineW * 0 + cellW * 0 + thickLineW / 2);
    ctx.lineTo(width, thickLineW * 0 + thinLineW * 0 + cellW * 0 + thickLineW / 2);
    ctx.moveTo(0,     thickLineW * 1 + thinLineW * 2 + cellH * 3 + thickLineW / 2);
    ctx.lineTo(width, thickLineW * 1 + thinLineW * 2 + cellH * 3 + thickLineW / 2);
    ctx.moveTo(0,     thickLineW * 2 + thinLineW * 4 + cellH * 6 + thickLineW / 2);
    ctx.lineTo(width, thickLineW * 2 + thinLineW * 4 + cellH * 6 + thickLineW / 2);
    ctx.moveTo(0,     thickLineW * 3 + thinLineW * 6 + cellH * 9 + thickLineW / 2);
    ctx.lineTo(width, thickLineW * 3 + thinLineW * 6 + cellH * 9 + thickLineW / 2);
    ctx.closePath();
    ctx.lineWidth = thickLineW;
    ctx.fillStyle = this.lineColor;
    ctx.stroke();
    // Draw Thin Lines
    ctx.beginPath();
    ctx.moveTo(thickLineW * 1 + cellW * 1 + thinLineW * 0 + thinLineW / 2, 0);
    ctx.lineTo(thickLineW * 1 + cellW * 1 + thinLineW * 0 + thinLineW / 2, height);
    ctx.moveTo(thickLineW * 1 + cellW * 2 + thinLineW * 1 + thinLineW / 2, 0);
    ctx.lineTo(thickLineW * 1 + cellW * 2 + thinLineW * 1 + thinLineW / 2, height);
    ctx.moveTo(thickLineW * 2 + cellW * 4 + thinLineW * 2 + thinLineW / 2, 0);
    ctx.lineTo(thickLineW * 2 + cellW * 4 + thinLineW * 2 + thinLineW / 2, height);
    ctx.moveTo(thickLineW * 2 + cellW * 5 + thinLineW * 3 + thinLineW / 2, 0);
    ctx.lineTo(thickLineW * 2 + cellW * 5 + thinLineW * 3 + thinLineW / 2, height);
    ctx.moveTo(thickLineW * 3 + cellW * 7 + thinLineW * 4 + thinLineW / 2, 0);
    ctx.lineTo(thickLineW * 3 + cellW * 7 + thinLineW * 4 + thinLineW / 2, height);
    ctx.moveTo(thickLineW * 3 + cellW * 8 + thinLineW * 5 + thinLineW / 2, 0);
    ctx.lineTo(thickLineW * 3 + cellW * 8 + thinLineW * 5 + thinLineW / 2, height);
    ctx.moveTo(0,     thickLineW * 1 + cellH * 1 + thinLineW * 0 + thinLineW / 2);
    ctx.lineTo(width, thickLineW * 1 + cellH * 1 + thinLineW * 0 + thinLineW / 2);
    ctx.moveTo(0,     thickLineW * 1 + cellH * 2 + thinLineW * 1 + thinLineW / 2);
    ctx.lineTo(width, thickLineW * 1 + cellH * 2 + thinLineW * 1 + thinLineW / 2);
    ctx.moveTo(0,     thickLineW * 2 + cellH * 4 + thinLineW * 2 + thinLineW / 2);
    ctx.lineTo(width, thickLineW * 2 + cellH * 4 + thinLineW * 2 + thinLineW / 2);
    ctx.moveTo(0,     thickLineW * 2 + cellH * 5 + thinLineW * 3 + thinLineW / 2);
    ctx.lineTo(width, thickLineW * 2 + cellH * 5 + thinLineW * 3 + thinLineW / 2);
    ctx.moveTo(0,     thickLineW * 3 + cellH * 7 + thinLineW * 4 + thinLineW / 2);
    ctx.lineTo(width, thickLineW * 3 + cellH * 7 + thinLineW * 4 + thinLineW / 2);
    ctx.moveTo(0,     thickLineW * 3 + cellH * 8 + thinLineW * 5 + thinLineW / 2);
    ctx.lineTo(width, thickLineW * 3 + cellH * 8 + thinLineW * 5 + thinLineW / 2);
    ctx.closePath();
    ctx.lineWidth = thinLineW;
    ctx.fillStyle = this.lineColor;
    ctx.stroke();
}

NumberPlaceCanvas.prototype.drawCell = function(i, n, stateLocked, stateSelected) {
    var cvs = document.getElementById(this.name);
    var ctx = cvs.getContext("2d");
    if (stateSelected) {
        ctx.fillStyle = this.hiColor;
    } else {
        ctx.fillStyle = this.bgColor;
    }
    var x = this.cellX[i % 9];
    var y = this.cellY[Math.floor(i / 9)];
    ctx.fillRect(x, y, this.cellW, this.cellH);
    if (n > 0) {
        var t = "" + n;
        ctx.font = this.digitFont;
        if (stateLocked) {
            ctx.fillStyle = this.lockedColor;
        } else {
            ctx.fillStyle = this.fgColor;
        }
        ctx.textBaseline = "top";
        var mt = ctx.measureText(t);
        ctx.fillText(t, x + (this.cellW - mt.width) / 2, y + (this.cellH - this.digitH) / 2, mt.width);
    }
}

NumberPlaceCanvas.prototype.isIncluded = function(x, y) {
    x -= this.canvasX;
    y -= this.canvasY;
    return 0 <= x && x < this.width && 0 <= y && y < this.height ? true : false;
}

NumberPlaceCanvas.prototype.getCol = function(x) {
    x -= this.canvasX;
    for (var i = 0; i < 9; i++) {
        var bx = this.cellX[i];
        if (bx <= x && x < bx + this.cellW) {
            return i;
        }
    }
    return -1;
} 

NumberPlaceCanvas.prototype.getRow = function(y) {
    y -= this.canvasY;
    for (var i = 0; i < 9; i++) {
        var by = this.cellY[i];
        if (by <= y && y < by + this.cellH) {
            return i;
        }
    }
    return -1;
} 

NumberPlaceCanvas.prototype.getIdx = function(x, y) {
    var c = this.getCol(x);
    if (c >= 0) {
        var r = this.getRow(y);
        if (r >= 0) {
            return c + r * 9;
        }
    }
    return -1;
}

NumberPlaceCanvas.prototype.onNumberChanged = function(i, s) {
    this.drawCell(i, s.numbers[i], s.isLocked(i), s.isSelected(i));
}

NumberPlaceCanvas.prototype.onSelectionChanged = function(i, s) {
    this.drawCell(i, s.numbers[i], s.isLocked(i), s.isSelected(i));
}

//////////////////////////////////////////////////////////////////////
//
// NumberPlaceNumButtonsView class
//
//////////////////////////////////////////////////////////////////////

function NumberPlaceNumButtonsView(nextItemName, buttonW) {
    this.nextItemName = nextItemName;
    this.styleButtonWidth = buttonW + "px";
    this.div = null;
    this.visible = false;
}

NumberPlaceNumButtonsView.prototype.show = function() {
    var nextItem = document.getElementById(this.nextItemName);
    var parent = nextItem.parentNode;
    if (this.div == null) {
        var div = document.createElement("div");
        div.className = "NumberPlaceButtons";
        var buttonClassName = "btn btn-primary";
        for (var i = 1; i <= 9; i++) {
            var button = document.createElement("button");
            button.className = buttonClassName;
            button.setAttribute("type", "button");
            button.setAttribute("onClick", "onClickNumber(" + i + ")");
            button.style.width = this.styleButtonWidth;
            button.innerHTML = "" + i;
            div.appendChild(button);
        }
        var button = document.createElement("button");
        button.className = buttonClassName;
        button.setAttribute("type", "button");
        button.setAttribute("onClick", "onClickNumber(0)");
        //button.style.width = this.styleButtonWidth;
        button.innerHTML = "DEL";
        div.appendChild(button);
        this.div = div;
    }
    parent.insertBefore(this.div, nextItem);
    this.visible = true;
}

NumberPlaceNumButtonsView.prototype.hide = function() {
    var parent = this.div.parentNode;
    parent.removeChild(this.div);
    this.visible = false;
}

//////////////////////////////////////////////////////////////////////
//
// NumberPlaceStorage class
//
//////////////////////////////////////////////////////////////////////

function NumberPlaceStorage(view) {
    this.list = new Array();
    this.view = view;
}

NumberPlaceStorage.prototype.load = function() {
    this.list.splice(0);
    for (var i = 0; i < localStorage.length; i++) {
        var k = new NumberPlaceKey(localStorage.key(i));
        if (!k.isValid()) {
            continue;
        }
        var s = new NumberPlace();
        s.parse(localStorage.getItem(k.name));
        var j = 0;
        while (j < this.list.length && k.name.localeCompare(this.list[j][0].name) < 0) {
            j++;
        }
        this.list.splice(j, 0, [k, s]);
    }
    this.view.show(this);
}

NumberPlaceStorage.prototype.save = function(value) {
    var name = new NumberPlaceKey().name;
    for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        var s = localStorage.getItem(k);
        if (s == value) {
            localStorage.removeItem(k);
            break;
        }
    }
    localStorage.setItem(name, value);
    this.load();
}

NumberPlaceStorage.prototype.get = function(key) {
    return localStorage.getItem(key);
}

NumberPlaceStorage.prototype.delete = function(key) {
    localStorage.removeItem(key);
    this.load();
}

//////////////////////////////////////////////////////////////////////
//
// NumberPlaceKey class for local storage
//
//////////////////////////////////////////////////////////////////////

function NumberPlaceKey(name) {
    this.prefix = "NumberPlace_data_";
    if (arguments.length >= 1) {
        this.name = name;
    } else {
        var now = new Date();
        this.name = this.prefix
            + now.getFullYear()
            + ("0" + (now.getMonth() + 1)).slice(-2)
            + ("0" + now.getDate()).slice(-2)
            + ("0" + now.getHours()).slice(-2)
            + ("0" + now.getMinutes()).slice(-2)
            + ("0" + now.getSeconds()).slice(-2);
    }
}

NumberPlaceKey.prototype.isValid = function() {
    return this.name != null &&
        this.name.length == this.prefix.length + 14 && 
        this.name.indexOf(this.prefix) == 0 ? true : false;
}

NumberPlaceKey.prototype.toDateString = function() {
    if (!this.isValid()) {
        return null;
    }
    var k = this.name;
    var Y = k.substring(this.prefix.length + 0, this.prefix.length + 4);
    var M = k.substring(this.prefix.length + 4, this.prefix.length + 6);
    var D = k.substring(this.prefix.length + 6, this.prefix.length + 8);
    var h = k.substring(this.prefix.length + 8, this.prefix.length + 10);
    var m = k.substring(this.prefix.length + 10, this.prefix.length + 12);
    var s = k.substring(this.prefix.length + 12, this.prefix.length + 14);
    return Y + "-" + M + "-" + D + " " + h + ":" + m + ":" + s;
}

//////////////////////////////////////////////////////////////////////
//
// NumberPlaceStorageView class
//
//////////////////////////////////////////////////////////////////////

function NumberPlaceStorageView() {
    this.visible = true;
}

NumberPlaceStorageView.prototype.show = function(NumberPlaceStorage) {
    var viewElement = document.getElementById("savedSheets");
    var classNameSheet = "savedSheet";
    for (var i = viewElement.childNodes.length - 1; i >= 0; i--) {
        var x = viewElement.childNodes[i];
        if (x.className == classNameSheet) {
            viewElement.removeChild(x);
        }
    }
    if (this.visible) {
        if (NumberPlaceStorage.list.length == 0) {
            viewElement.style.visibility = "hidden";
            this.visible = false;
            return;
        }
    } else if (NumberPlaceStorage.list.length > 0) {
        viewElement.style.visibility = "visible";
        this.visible = true;
    } else {
        return;
    }
    for (var i = 0; i < NumberPlaceStorage.list.length; i++) {
        var key = NumberPlaceStorage.list[i][0];
        var sheet = NumberPlaceStorage.list[i][1];
        var div = document.createElement("div");
        div.id = key.name;
        div.className = classNameSheet;
        viewElement.appendChild(div);
        var div2 = document.createElement("div");
        div.appendChild(div2);
        div2.innerHTML = key.toDateString();
        var cvs = document.createElement("canvas");
        cvs.id = "NumberPlaceCanvas_" + key.name;
        div.appendChild(cvs);
        var div3 = document.createElement("div");
        div.appendChild(div3);
        var playButton = document.createElement("button");
        playButton.className = "btn btn-info";
        playButton.setAttribute("type", "button");       
        playButton.setAttribute("onClick", "onClickPlay('" + key.name + "')");
        playButton.innerHTML = "Play";
        div3.appendChild(playButton);
        var deleteButton = document.createElement("button");
        deleteButton.className = "btn btn-danger";
        deleteButton.setAttribute("type", "button");
        deleteButton.setAttribute("onClick", "onClickDelete('" + key.name + "')");
        deleteButton.innerHTML = "Delete";
        div3.appendChild(deleteButton);
        sheet.view = new NumberPlaceCanvas(cvs.id, 20, 20, 1, 2);
        sheet.view.draw(sheet);
    }
}

//////////////////////////////////////////////////////////////////////
//
// Button class
//
//////////////////////////////////////////////////////////////////////

function Button(name, initState) {
    this.name = name;
    this.enabled = initState;
}

Button.prototype.enable = function(state) {
    var x = document.getElementById(this.name);
    if (state) {
        x.removeAttribute("disabled");
    } else {
        x.setAttribute("disabled", true);
    }
    this.enabled = state;
}

Button.prototype.setLabel = function(value) {
    var x = document.getElementById(this.name);
    x.innerHTML = value;
}

//////////////////////////////////////////////////////////////////////
//
// Global
//
//////////////////////////////////////////////////////////////////////

var canvasName = "numberPlaceCanvas";
var lockButtonName = "lockButton";
var checkButtonName = "checkButton";
var showButtonName = "showButton";
var statusAreaName = "statusArea";

var numberPlace = new NumberPlace(new NumberPlaceCanvas(canvasName, 40, 40, 1, 3));
var lockButton = new Button(lockButtonName, true);
var checkButton = new Button(checkButtonName, true);
var showButton = new Button(showButtonName, true);
var numberPlaceNumButtonsView = new NumberPlaceNumButtonsView(statusAreaName, numberPlace.view.cellW);
var numberPlaceStorage = new NumberPlaceStorage(new NumberPlaceStorageView());

function initButtons() {
    lockButton.enable(true);
    checkButton.enable(true);
}

function showStatus(message) {
    var statusArea = document.getElementById(statusAreaName);
    statusArea.innerHTML = message;
}

function showStatusInit() {
    showStatus('Enter the initial numbers and press "Lock" button.');
}

function showStatusReady() {
    showStatus('Enter the numbers on your own or simply press "Solve" button.');
}

function play(v) {
    numberPlace.clear();
    numberPlace.parse(v);
    checkButton.enable(true);
    if (numberPlace.numbersLocked) {
        onNumbersLocked();
    } else {
        onNumbersUnlocked();
    }
}

function parseParameters() {
    var items = location.href.split("?");
    if (items.length != 2) {
        return;
    }
    var params = items[1].split("&");
    for (var i = 0; i < params.length; i++) {
        items = params[i].split("=");
        if (items.length == 2) {
            var name = decodeURIComponent(items[0]);
            var value = decodeURIComponent(items[1]);
            if (name == "d") {
                play(value);
            }
        }
    }
}

function onClickSave() {
    if (numberPlace.getNoNumbers() == 9 * 9) {
        return;
    }
    numberPlaceStorage.save(numberPlace.toString());
}

function onClickLock() {
    numberPlace.cancelSelection();
    if (numberPlace.numbersLocked) {
        if (numberPlace.canUnlock()) {
            numberPlace.unlockNumbers();
            onNumbersUnlocked();
        }
    } else {
        numberPlace.lockNumbers(); 
        onNumbersLocked();
    }
}

function onClickCheck() {
    n = numberPlace.getNoNumbers();
    if (n > 0) {
        var message = n > 1 ? n + " numbers to go." : "1 number to go.";
        if (!numberPlace.validate()) {
            message += " (There seems to be one or more misplacements.)";
        }
        showStatus(message);
    } else if (numberPlace.validate()) {
        showStatus("You placed all numbers correctly!");
    } else {
        showStatus("There seems to be one or more misplacements.");
    }
}

function onClickSolve() {
    if (numberPlace.solutions == null) {
        numberPlace.cancelSelection();
        if (numberPlace.solve() > 0) {
            lockButton.enable(false);
            checkButton.enable(false);
        } else {
            showStatus("Failed to solve.");
            return;
        }
    } else if (numberPlace.solutions.length > 1) {
        numberPlace.nextSolution();
    } else {
        return;
    }
    var message = "Successfully solved.";
    if (numberPlace.solutions.length > 1) {
        if (numberPlace.solutions.length > numberPlace.maxSolutions) {
            message += " (" + (numberPlace.solutionIndex + 1) + " of " + numberPlace.maxSolutions + "+)";
        } else {
            message += " (" + (numberPlace.solutionIndex + 1) + " of " + numberPlace.solutions.length + ")";
        }
    }
    showStatus(message);
}

function onClickReset() {
    numberPlace.cancelSelection();
    numberPlace.resetNumbers();
    onNumbersReset();
}

function onClickShowNumberButtons() {
    if (numberPlaceNumButtonsView.visible) {
        numberPlaceNumButtonsView.hide();
        showButton.setLabel("Show number buttons");
    } else {
        numberPlaceNumButtonsView.show();
        showButton.setLabel("Hide number buttons");
    }
}

function onClickNumber(n) {
    if (numberPlace.selected < 0) {
        return;
    }
    if (n > 0) {
        numberPlace.setNumber(numberPlace.selected, n);
        numberPlace.changeSelection(numberPlace.moveRight(numberPlace.selected));
        if (numberPlace.numbersLocked && lockButton.enabled) {
            if (!numberPlace.canUnlock()) {
                lockButton.enable(false);
            }
        }
    } else {
        numberPlace.setNumber(numberPlace.selected, 0);
        if (numberPlace.numbersLocked && !lockButton.enabled) {
            if (numberPlace.canUnlock()) {
                lockButton.enable(true);
            }
        }
    }
}

function onClickPlay(k) {
    var v = numberPlaceStorage.get(k);
    if (v == null) {
        return;
    }
    numberPlace.cancelSelection();
    play(v);
}

function onClickDelete(k) {
    numberPlaceStorage.delete(k);
}

function onNumbersLocked() {
    lockButton.enable(numberPlace.canUnlock());
    lockButton.setLabel("Unlock");
    showStatusReady();
}

function onNumbersUnlocked() {
    lockButton.enable(true);
    lockButton.setLabel("Lock");
    showStatusInit();
}

function onNumbersReset() {
    lockButton.enable(true);
    checkButton.enable(true);
    if (numberPlace.numbersLocked) {
        showStatusReady();
    } else {
        showStatusInit();
    }
}

window.onload = function() {
    numberPlace.view.drawBackground();
    initButtons();
    numberPlaceStorage.load();
    parseParameters();
    document.body.onclick = function(e) {
        if (!numberPlace.isSelectionAllowed()) {
            return;
        }
        if (!numberPlace.view.isIncluded(e.pageX, e.pageY)) {
            return;
        }
        var i = numberPlace.view.getIdx(e.pageX, e.pageY);
        if (i < 0) {
            return;
        }
        numberPlace.changeSelection(i);
    }
    document.body.onkeydown = function(e) {
        if (numberPlace.selected < 0) {
            return;
        }
        switch (e.which) {
        case 49: // 1
        case 50: // 2
        case 51: // 3
        case 52: // 4
        case 53: // 5
        case 54: // 6
        case 55: // 7
        case 56: // 8
        case 57: // 9
            numberPlace.setNumber(numberPlace.selected, e.which - 49 + 1);
            numberPlace.changeSelection(numberPlace.moveRight(numberPlace.selected));
            if (numberPlace.numbersLocked && lockButton.enabled) {
                if (!numberPlace.canUnlock()) {
                    lockButton.enable(false);
                }
            }
            break;
        case 32: // SPACE
            numberPlace.setNumber(numberPlace.selected, 0);
            numberPlace.changeSelection(numberPlace.moveRight(numberPlace.selected));
            if (numberPlace.numbersLocked && !lockButton.enabled) {
                if (numberPlace.canUnlock()) {
                    lockButton.enable(true);
                }
            }
            break;
        case 46: // Delete
            numberPlace.setNumber(numberPlace.selected, 0);
            if (numberPlace.numbersLocked && !lockButton.enabled) {
                if (numberPlace.canUnlock()) {
                    lockButton.enable(true);
                }
            }
            break;
        case 37: // Left
            numberPlace.changeSelection(numberPlace.moveLeft(numberPlace.selected));
            break;
        case 38: // Up
            numberPlace.changeSelection(numberPlace.moveUp(numberPlace.selected));
            break;
        case 39: // Right
            numberPlace.changeSelection(numberPlace.moveRight(numberPlace.selected));
            break;
        case 40: // Down
            numberPlace.changeSelection(numberPlace.moveDown(numberPlace.selected));
            break;
        case 13: // Enter
            numberPlace.cancelSelection();
            break;
        default:
            break;
        }
    }
}
