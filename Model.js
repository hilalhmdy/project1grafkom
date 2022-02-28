//Math, belum tahu mau taruh mana
const epsilon = 0.01
const euclideanDistance = (coor1, coor2) => {
    return Math.sqrt((coor1[0]-coor2[0])*(coor1[0]-coor2[0]) + (coor1[1]-coor2[1])*(coor1[1]-coor2[1]));
}
const norm = (deg) => {
    return ((deg + Math.PI) % (2*Math.PI) + 2*Math.PI) % (2*Math.PI) - Math.PI;
}
const atan3 = (coor1, coor2) => {
    return Math.atan2(coor2[1] - coor1[1], coor2[0] - coor1[0]);
}
const hexcode = "0123456789ABCDEF"
const deccode = {"0":0, "1":1, "2":2, "3":3, "4":4, "5":5, "6":6, "7":7, "8":8, "9":9, "A":10, "B":11, "C":12, "D":13, "E":14, "F":15}
const dec_hex = (dec) => {
    dec = Math.min(255, dec);
    return hexcode[Math.floor(dec/16)] + hexcode[dec%16];
}
const hex_dec = (hex) => {
    let toReturn = 0;
    for(let i=0; i<hex.length; i++){
        toReturn = toReturn*16 + deccode[hex[i]];
    }
    return toReturn;
}



class Point {
    constructor(coor, color, id=-1){
        this.id = id;
        this.name = "Nameless point";
        this.coor = coor;
        this.color = color;
    }
    leftDisplay = (modelId) => {
        console.log("pointID", this.id);
        return "<button class='pointPreview' onClick='chosenID=[" + modelId + "," + this.id +"]; refreshChosenInfo()'>"+this.name+"</button>";
    }
    rightDisplay = () => {
        let inner = "<div class='horizontalbox'>"; 
        inner += "<strong>Name: </strong><input type='text' onchange='updateObjName(this.value)' value='" + this.name + "'></input>";
        inner += "</div>";
        inner += "<div><strong>Type: </strong>Point</div>";
        inner += "<div class='horizontalbox'>";
        inner += "<strong>x: </strong><div id='x-value'>" + this.coor[0].toFixed(3) + "</div>";
        inner += "<input type='range' min='-1' max='1' step=0.001 value='" + this.coor[0].toFixed(3) + "' onInput='updateSlider(0,this.value)'>";
        inner += "</div><div class='horizontalbox'>";
        inner += "<strong>y: </strong><div id='y-value'>" + this.coor[1].toFixed(3) + "</div>";
        inner += "<input type='range' min='-1' max='1' step=0.001 value='" + this.coor[1].toFixed(3) + "' onInput='updateSlider(1,this.value)'>";
        
        let sumColor=[];
        for(let i=0; i<3; i++){
            sumColor.push(Math.round(this.color[i]*256));
        }
        inner += "</div><div class='horizontalbox'>";
        inner += "<strong>Color: </strong><input type='text' onchange='updateColor(this.value)' value='" + dec_hex(sumColor[0]) + dec_hex(sumColor[1]) + dec_hex(sumColor[2]) + "'></input>";
        inner += "</div>";
        return inner;
    }
    render = (color) => {
        let vertices = [
            [this.coor[0] + 5*epsilon, this.coor[1]],
            [this.coor[0], this.coor[1] + 5*epsilon],
            [this.coor[0] - 5*epsilon, this.coor[1]],
            [this.coor[0], this.coor[1] - 5*epsilon],
        ];
        let colors = [color, color, color, color];

        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );
        let vPosition = gl.getAttribLocation( program, "vPosition" );
        gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );

        gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
        let vColor = gl.getAttribLocation( program, "vColor" );
        gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vColor );

        gl.drawArrays( gl.TRIANGLE_FAN, 0, vertices.length);
    }
}

//Setiap bangun (Line, Square, Rectangle) harus bisa jalanin ini
class Model {
    constructor(id){
        this.vertices = [];
        this.type = "Model";
        this.name = "Nameless Model";
        this.center = new Point([0,0], [0,0,0,1]) //Titik berat
        this.preserveSimilarity = true;
        this.id = id;
        console.log(id);
    }
    calculateCenter = () => {
        this.center = new Point([0,0], [0,0,0,0]);
        for(let i=0; i<this.vertices.length; i++){
            this.center.coor[0] += this.vertices[i].coor[0];
            this.center.coor[1] += this.vertices[i].coor[1];
            for(var j=0; j<4; j++){
                this.center.color[j] += this.vertices[i].color[j];
            }
        }
        this.center.coor[0] /= this.vertices.length;
        this.center.coor[1] /= this.vertices.length;
        for(var j=0; j<4; j++){
            this.center.color[j] /= this.vertices.length;
        }
    }
    addVertex = (coor, color) => {
        this.vertices.push(new Point(coor, color, this.vertices.length))
        this.calculateCenter();
    }
    editVertexColor = (id, color) => {
        this.vertices[id].color = color;
        this.calculateCenter();
    }
    deleteVertex = (id) => {
        this.vertices.splice(id,1);
        this.calculateCenter();
    }
    rotate = (deg) => {
        //Rotate Counterclockwise w.r.t. center based on deg in radian
        for(let i=0; i<this.vertices.length; i++){
            let dis = euclideanDistance(this.center.coor, this.vertices[i].coor);
            let arg = norm(atan3(this.center.coor, this.vertices[i].coor) + deg);
            this.vertices[i].coor[0] = this.center.coor[0] + Math.cos(arg)*dis;
            this.vertices[i].coor[1] = this.center.coor[1] + Math.sin(arg)*dis;
        }
    }
    dilate = (mul) => {
        //Dilate by mul w.r.t. center
        for(let i=0; i<this.vertices.length; i++){
            this.vertices[i].coor[0] = mul*(this.vertices[i].coor[0]-this.center.coor[0]) + this.center.coor[0];
            this.vertices[i].coor[1] = mul*(this.vertices[i].coor[1]-this.center.coor[1]) + this.center.coor[1];
        }
    }
    moveCenter = (coor) => {
        let translation = [coor[0]-this.center.coor[0], coor[1]-this.center.coor[1]];
        console.log(translation);
        this.center.coor = coor;
        for(let i=0; i<this.vertices.length; i++){
            this.vertices[i].coor[0] += translation[0];
            this.vertices[i].coor[1] += translation[1];
        }
    }
    moveVertex = (id, coor) => {
        if(!this.preserveSimilarity){
            this.vertices[id].coor = coor;
            this.calculateCenter();
            return;
        } //Center tetap
        let minDis = 9999;
        for(let i=0; i<this.vertices.length; i++){
            minDis = Math.min(euclideanDistance(this.center.coor, this.vertices[i].coor), minDis);
        }
        let mul = euclideanDistance(this.center.coor, coor)/euclideanDistance(this.center.coor, this.vertices[id].coor);
        let deg = norm(atan3(this.center.coor, coor) - atan3(this.center.coor, this.vertices[id].coor))
        if(minDis * mul < epsilon){return;}
        this.rotate(deg);
        this.dilate(mul);
    }

    render = (gl) => {
        let vertices = [];
        let colors = [];
        for(let j=0; j<this.vertices.length; j++){
            vertices.push(this.vertices[j].coor);
            colors.push(this.vertices[j].color);
        }

        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );
        let vPosition = gl.getAttribLocation( program, "vPosition" );
        gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );

        gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
        let vColor = gl.getAttribLocation( program, "vColor" );
        gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vColor );

        gl.drawArrays( gl.TRIANGLE_FAN, 0, vertices.length);
    }
    
    leftDisplay = () => {
        console.log("objID", this.id);
        return "<button class='objectPreview' onClick='chosenID=[" + this.id + ",-1]; refreshChosenInfo()'>"+this.name+"</button>";
    }
    rightDisplay = () => {
        let inner = "<div class='horizontalbox'>"; 
        inner += "<strong>Name: </strong><input type='text' onchange='updateObjName(this.value)' value='" + this.name + "'></input>";
        inner += "</div>";
        inner += "<div><strong>Type: </strong>" + this.type + "</div>";
        inner += "<div class='horizontalbox'>";
        inner += "<strong>x: </strong><div id='x-value'>" + this.center.coor[0].toFixed(3) + "</div>";
        inner += "<input type='range' min='-1' max='1' step=0.001 value='" + this.center.coor[0].toFixed(3) + "' onInput='updateSlider(0,this.value)'>";
        inner += "</div><div class='horizontalbox'>";
        inner += "<strong>y: </strong><div id='y-value'>" + this.center.coor[1].toFixed(3) + "</div>";
        inner += "<input type='range' min='-1' max='1' step=0.001 value='" + this.center.coor[1].toFixed(3) + "' onInput='updateSlider(1,this.value)'>";
        inner += "</div><div class='horizontalbox'>";
        let nbV = this.vertices.length;
        let meanColor = [0, 0, 0];
        for(let i=0; i<nbV; i++){
            for(let j=0; j<3; j++){
                meanColor[j] += this.vertices[i].color[j];
            }
        }
        for(let i=0; i<3; i++){
            meanColor[i] = Math.round(meanColor[i]*256/nbV);
        }
        inner += "<strong>Color: </strong><input type='text' onchange='updateColor(this.value)' value='" + dec_hex(meanColor[0]) + dec_hex(meanColor[1]) + dec_hex(meanColor[2]) + "'></input>";
        inner += "</div><div class='horizontalbox'>";
        inner += "<div>Similarity: </div>"
        inner += '<button class="draw-button" onclick="updateSimilarity(id)">' + (this.preserveSimilarity? "Lock": "Unlock") + '</button>';
        inner += "</div>";
        return inner;
    }
}

class Line extends Model {
    constructor(id){
        super(id);
        this.vertices.push(new Point([0.01, 0], [0,0,0,1], 0));
        this.type = "Line";
        this.name = "Nameless Line";
    }
    calculateLength = () => {
        let s = euclideanDistance(this.vertices[0].coor, this.vertices[1].coor);
        let inner = "<div class='horizontalbox'>"
        inner += "</div><div class='horizontalbox'>";
        inner += "<strong>Sisi: </strong><div id='s-value'>" + s + "</div>";
        inner += "<input type='range' min='-1' max='1' step=0.001 value='" + s + "' onInput='updateSisi(this.value)'>";
        inner += "</div>"
        return inner;
    }
}

class Square extends Model {
    constructor(id){
        super(id);
        this.vertices.push(new Point([0.01, 0], [0,0,0,1], 0));
        this.vertices.push(new Point([0, 0.01], [0,0,0,1], 1));
        this.vertices.push(new Point([-0.01,0], [0,0,0,1], 2));
        this.vertices.push(new Point([0,-0.01], [0,0,0,1], 3));
        this.type = "Square";
        this.name = "Nameless Square";
    }
    uniqueDisplay = () => {
        let s = euclideanDistance(this.vertices[0].coor, this.vertices[1].coor).toFixed(3);
        let inner = "<div class='horizontalbox'>"
        inner += "</div><div class='horizontalbox'>";
        inner += "<strong>Sisi: </strong><div id='s-value'>" + s + "</div>";
        inner += "<input type='range' min='-1' max='1' step=0.001 value='" + s + "' onInput='updateSisi(this.value)'>";
        inner += "</div>"
        return inner;
    }
}

class Rectangle extends Model {
    constructor(id){
        super(id);
        this.type = "Rectangle";
    }
}

class Polygon extends Model {
    constructor(id){
        super(id);
        //console.log("id", this.id);
        this.vertices.push(new Point([0,0], [0,0,0,1], 0))
        this.type = "Polygon";
        this.name = "Nameless Polygon";
        this.preserveSimilarity = false;
    }
    uniqueDisplay = () => {
        return "";
    }
}
