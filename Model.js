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

class Point {
    constructor(coor, color, id=-1){
        this.id = id; //Bisa jadi tidak diperlukan
        this.name = "Nameless point";
        this.coor = coor;
        this.color = color;
    }
    leftDisplay = (modelId) => {
        return "<button class='pointPreview' onClick='chosenID=[" + modelId + "," + this.id +"]; refreshChosenInfo()'>"+this.name+"</button>";
    }
    rightDisplay = () => {
        let inner = "<div class='horizontalbox'>"; 
        inner += "<strong>Name: </strong><input type='text' onchange='updateObjName(this.value)' value='" + this.name + "'></input>";
        inner += "</div>";
        inner += "<div><strong>Type: </strong>" + this.type + "</div>";
        inner += "<div class='horizontalbox'>";
        inner += "<strong>x: </strong><div id='x-value'>" + this.coor[0].toFixed(3) + "</div>";
        inner += "<input type='range' min='-1' max='1' step=0.001 value='" + this.coor[0].toFixed(3) + "' onchange='updateSlider(0,this.value)'>";
        inner += "</div><div class='horizontalbox'>";
        inner += "<strong>y: </strong><div id='y-value'>" + this.coor[1].toFixed(3) + "</div>";
        inner += "<input type='range' min='-1' max='1' step=0.001 value='" + this.coor[1].toFixed(3) + "' onchange='updateSlider(1,this.value)'>";
        
        let sumColor=[];
        for(let i=0; i<3; i++){
            sumColor.push(Math.round(this.color[i]*256));
        }
        inner += "</div><div class='horizontalbox'>";
        inner += "<strong>Color: </strong><input type='text' onchange='updateColor(this.value)' value='" + dec_hex(sumColor[0]) + dec_hex(sumColor[1]) + dec_hex(sumColor[2]) + "'></input>";
        inner += "</div>";
        return inner;
    }
}

//Setiap bangun (Line, Square, Rectangle) harus bisa jalanin ini
class Model {
    constructor(id){
        this.id = id;
        this.vertices = [];
        this.center = new Point([0,0], [0,0,0,1]) //Titik berat
        this.preserveSimilarity = false;
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
        this.vertices.push(new Point([0,0], [0,0,0,1]))
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
        let mul = euclideanDistance(this.center, coor)/euclideanDistance(this.center.coor, this.vertices[id].coor);
        let rot = norm(atan3(this.center.coor, coor) - atan3(this.center.coor, this.vertices[id].coor))
        if(minDis * mul < epsilon){return;}
        for(let i=0; i<this.vertices.length; i++){
            let dis = euclideanDistance(this.center.coor, this.vertices[i].coor) * mul;
            let arg = norm(atan3(this.center.coor, this.vertices[id].coor) + rot);
            this.vertices[i].coor[0] = this.center.coor[0] + Math.cos(arg)*dis;
            this.vertices[i].coor[1] = this.center.coor[1] + Math.sin(arg)*dis;
        }
    }

    render = () => {
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
}

class Polygon extends Model {
    constructor(id){
        super(id);
    }
}