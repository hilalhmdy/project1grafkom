//Setiap bangun (Line, Square, Rectangle) harus bisa jalanin ini
class Model {
  constructor(id){
    this.vertices = [];
    this.type = "Model";
    this.name = "Nameless Model";
    this.center = new Point([0,0], [0,0,0,1]) //Titik berat
    this.preserveSimilarity = true;
    this.isFan = true;
    this.id = id;
  }

  copy = (obj) => {
    this.vertices = [];
    for (let i = 0; i < obj.vertices.length; i++) {
      const p = new Point([0, 0], [0, 0, 0, 1]);
      p.copy(obj.vertices[i]);
      this.vertices.push(p);
    }

    this.name = obj.name;
    this.center.copy(obj.center);
    this.preserveSimilarity = obj.preserveSimilarity;
    this.isFan = obj.isFan;
    this.id = obj.id;
  }

  calculateCenter = () => {
    this.center = new Point([0, 0], [0, 0, 0, 0]);
    for (let i = 0; i < this.vertices.length; i++) {
      this.center.coor[0] += this.vertices[i].coor[0];
      this.center.coor[1] += this.vertices[i].coor[1];

      for (let j = 0; j < 4; j++) {
        this.center.color[j] += this.vertices[i].color[j];
      }
    }

    this.center.coor[0] /= this.vertices.length;
    this.center.coor[1] /= this.vertices.length;

    for (let j = 0; j < 4; j++) {
      this.center.color[j] /= this.vertices.length;
    }
  }

  calculateCircumCenter = () => {
    let toReturn = 0;
    for (let i = 0; i < this.vertices.length; i++) {
      toReturn += euclideanDistance(
        this.vertices[i].coor,
        this.vertices[(i + 1) % this.vertices.length].coor
      );
    }
    return toReturn;
  }

  calculateArea = () => {
    let toReturn = 0;
    for (let i = 0; i < this.vertices.length; i++) {
      toReturn +=
        this.vertices[i].coor[0] * this.vertices[(i + 1) % this.vertices.length].coor[1];
      toReturn -=
        this.vertices[i].coor[1] * this.vertices[(i + 1) % this.vertices.length].coor[0];
    }
    return Math.abs(toReturn / 2);
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
    this.vertices.splice(id, 1);
    this.calculateCenter();
    for (let i = 0; i < this.vertices.length; i++) {
      this.vertices[i].id = i;
    }
  }

  rotate = (deg) => {
    //Rotate Counterclockwise w.r.t. center based on deg in radian
    for (let i = 0; i < this.vertices.length; i++) {
      const dis = euclideanDistance(this.center.coor, this.vertices[i].coor);
      const arg = norm(atan3(this.center.coor, this.vertices[i].coor) + deg);
      this.vertices[i].coor[0] = this.center.coor[0] + Math.cos(arg) * dis;
      this.vertices[i].coor[1] = this.center.coor[1] + Math.sin(arg) * dis;
    }
  }

  dilate = (mul) => {
    //Dilate by mul w.r.t. center
    for (let i = 0; i < this.vertices.length; i++) {
      this.vertices[i].coor[0] =
        mul * (this.vertices[i].coor[0] - this.center.coor[0]) + this.center.coor[0];
      this.vertices[i].coor[1] =
        mul * (this.vertices[i].coor[1] - this.center.coor[1]) + this.center.coor[1];
    }
  }

  moveCenter = (coor) => {
    const translation = [coor[0] - this.center.coor[0], coor[1] - this.center.coor[1]];
    this.center.coor = coor;

    for (let i = 0; i < this.vertices.length; i++) {
      this.vertices[i].coor[0] += translation[0];
      this.vertices[i].coor[1] += translation[1];
    }
  }

  moveVertex = (id, coor) => {
    if (!this.preserveSimilarity) {
      this.vertices[id].coor = coor;
      this.calculateCenter();
      return;
    } //Center tetap

    let minDis = 9999;
    for (let i = 0; i < this.vertices.length; i++) {
      minDis = Math.min(euclideanDistance(this.center.coor, this.vertices[i].coor), minDis);
    }

    const mul =
      euclideanDistance(this.center.coor, coor) /
      euclideanDistance(this.center.coor, this.vertices[id].coor);
    const deg = norm(
      atan3(this.center.coor, coor) - atan3(this.center.coor, this.vertices[id].coor)
    );

    if (minDis * mul < epsilon) {
      return;
    }

    this.rotate(deg);
    this.dilate(mul);
  }

  render = (gl) => {
    const vertices = [];
    const colors = [];

    for (let j = 0; j < this.vertices.length; j++) {
      vertices.push(this.vertices[j].coor);
      colors.push(this.vertices[j].color);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    const vPosition = gl.getAttribLocation(program, 'vPosition');
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    const vColor = gl.getAttribLocation(program, 'vColor');
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    gl.drawArrays(this.isFan ? gl.TRIANGLE_FAN : gl.TRIANGLE_STRIP, 0, vertices.length);
  }
  
  leftDisplay = () => {
    return "<button class='objectPreview' onClick='chosenID=[" + this.id + ",-1]; refreshChosenInfo()'>"+this.name+"</button>";
  }
  
  rightDisplay = () => {
    let inner = "<div class='horizontalbox'>"; 
    inner += "<strong>Name: </strong><input type='text' onchange='updateObjName(this.value)' value='" + this.name + "'></input>";
    inner += "</div>";
    inner += "<div><strong>Type: </strong>" + this.type + "</div>";
    inner += "<div class='horizontalbox'>";
    inner += "</div><div class='horizontalbox'>";
    inner += "<strong>Keliling: </strong><div id='k-value'>" + this.calculateCircumCenter().toFixed(3) + "</div>";
    inner += "</div><div class='horizontalbox'>";
    inner += "<strong>Luas: </strong><div id='a-value'>" + this.calculateArea().toFixed(3) + "</div>";
    inner += "</div><div class='horizontalbox'>";
    inner += "<strong>x: </strong><div id='x-value'>" + this.center.coor[0].toFixed(3) + "</div>";
    inner += "<input type='range' min='-1' max='1' step=0.001 value='" + this.center.coor[0].toFixed(3) + "' onInput='updateSlider(0,this.value)'>";
    inner += "</div><div class='horizontalbox'>";
    inner += "<strong>y: </strong><div id='y-value'>" + this.center.coor[1].toFixed(3) + "</div>";
    inner += "<input type='range' min='-1' max='1' step=0.001 value='" + this.center.coor[1].toFixed(3) + "' onInput='updateSlider(1,this.value)'>";
    inner += "</div><div class='horizontalbox'>";

    const nbV = this.vertices.length;
    const meanColor = [0, 0, 0];

    for (let i = 0; i < nbV; i++) {
      for (let j = 0; j < 3; j++) {
        meanColor[j] += this.vertices[i].color[j];
      }
    }

    for (let i = 0; i < 3; i++) {
      meanColor[i] = Math.round((meanColor[i] * 256) / nbV);
    }

    inner += "<strong>Color: </strong><input type='text' onchange='updateColor(this.value); refreshChosenInfo()' value='" + dec_hex(meanColor[0]) + dec_hex(meanColor[1]) + dec_hex(meanColor[2]) + "'></input>";
    inner += '<input type="color" value="#' + dec_hex(meanColor[0]) + dec_hex(meanColor[1]) + dec_hex(meanColor[2]) +'" oninput="updateColor(this.value, true)" onchange="refreshChosenInfo()">'
    inner += "</div><div class='horizontalbox'>";
    inner += "<div>Similarity: </div>"
    inner += '<button class="draw-button" onclick="updateSimilarity(id)">' + (this.preserveSimilarity? "Lock": "Unlock") + '</button>';
    inner += "<div>Draw Method: </div>"
    inner += '<button class="draw-button" onclick="updateDrawMethod(id)">' + (this.isFan? "Fan": "Strips") + '</button>';
    inner += "</div>";

    return inner;
  }
}

class Line extends Model {
  constructor(id){
    super(id);
    this.vertices.push(new Point([0, 0], [0, 0, 0, 1], 0));
    this.vertices.push(new Point([0, 0], [0, 0, 0, 1], 1));
    this.type = 'Line';
    this.name = 'Nameless Line';
  }

  calculateLength = () => {
    const s = euclideanDistance(this.vertices[0].coor, this.vertices[1].coor);
    let inner = "<div class='horizontalbox'>"
    inner += "</div><div class='horizontalbox'>";
    inner += "<strong>Sisi: </strong><div id='s-value'>" + s + "</div>";
    inner += "<input type='range' min='-1' max='1' step=0.001 value='" + s + "' onInput='updateSisi(this.value)'>";
    inner += "</div>"
    return inner;
  }

  render = (gl) => {
    const vertices = [];
    const colors = [];

    for (let j = 0; j < this.vertices.length; j++) {
      vertices.push(this.vertices[j].coor);
      colors.push(this.vertices[j].color);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    const vPosition = gl.getAttribLocation(program, 'vPosition');
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    const vColor = gl.getAttribLocation(program, 'vColor');
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    gl.drawArrays(gl.LINES, 0, vertices.length);
  }
}

class Square extends Model {
  constructor(id){
    super(id);
    this.vertices.push(new Point([0.01, 0], [0, 0, 0, 1], 0));
    this.vertices.push(new Point([0, 0.01], [0, 0, 0, 1], 1));
    this.vertices.push(new Point([-0.01, 0], [0, 0, 0, 1], 2));
    this.vertices.push(new Point([0, -0.01], [0, 0, 0, 1], 3));
    this.type = 'Square';
    this.name = 'Nameless Square';
  }

  uniqueDisplay = () => {
    const s = euclideanDistance(this.vertices[0].coor, this.vertices[1].coor).toFixed(3);
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
    this.vertices.push(new Point([0, 0], [0, 0, 0, 1], 0));
    this.vertices.push(new Point([0, 0], [0, 0, 0, 1], 1));
    this.vertices.push(new Point([0, 0], [0, 0, 0, 1], 2));
    this.vertices.push(new Point([0, 0], [0, 0, 0, 1], 3));
    this.type = 'Rectangle';
    this.name = 'Nameless Rectangle';
  }

  calculateNewHeight = (newH) => {
    const mul = newH / euclideanDistance(this.vertices[1].coor, this.vertices[2].coor).toFixed(3);

    const leftLine = new Line(99);
    leftLine.vertices[0].coor = this.vertices[0].coor;
    leftLine.vertices[1].coor = this.vertices[3].coor;
    leftLine.calculateCenter();
    leftLine.dilate(mul);

    const rightLine = new Line(98);
    rightLine.vertices[0].coor = this.vertices[1].coor;
    rightLine.vertices[1].coor = this.vertices[2].coor;
    rightLine.calculateCenter();
    rightLine.dilate(mul);

    this.vertices[0].coor = leftLine.vertices[0].coor;
    this.vertices[1].coor = rightLine.vertices[0].coor;
    this.vertices[2].coor = rightLine.vertices[1].coor;
    this.vertices[3].coor = leftLine.vertices[1].coor;
  }

  calculateNewWidth = (newW) => {
    const mul = newW / euclideanDistance(this.vertices[0].coor, this.vertices[1].coor).toFixed(3);

    const topLine = new Line(99);
    topLine.vertices[0].coor = this.vertices[0].coor;
    topLine.vertices[1].coor = this.vertices[1].coor;
    topLine.calculateCenter();
    topLine.dilate(mul);

    const bottomLine = new Line(98);
    bottomLine.vertices[0].coor = this.vertices[2].coor;
    bottomLine.vertices[1].coor = this.vertices[3].coor;
    bottomLine.calculateCenter();
    bottomLine.dilate(mul);

    this.vertices[0].coor = topLine.vertices[0].coor;
    this.vertices[1].coor = topLine.vertices[1].coor;
    this.vertices[2].coor = bottomLine.vertices[0].coor;
    this.vertices[3].coor = bottomLine.vertices[1].coor;
  }
  
  uniqueDisplay = () => {
    const w = euclideanDistance(this.vertices[0].coor, this.vertices[1].coor).toFixed(3);
    const h = euclideanDistance(this.vertices[1].coor, this.vertices[2].coor).toFixed(3);

    let inner = "<div class='horizontalbox'>"
    inner += "</div><div class='horizontalbox'>";
    inner += "<strong>Tinggi: </strong><div id='h-value'>" + h + "</div>";
    inner += "<input type='range' min='0' max='1' step=0.001 value='" + h + "' onInput='updateRectangleHeight(this.value)'>";
    inner += "</div>"
    inner += "<div class='horizontalbox'>"
    inner += "</div><div class='horizontalbox'>";
    inner += "<strong>Lebar: </strong><div id='w-value'>" + w + "</div>";
    inner += "<input type='range' min='0' max='1' step=0.001 value='" + w + "' onInput='updateRectangleWidth(this.value)'>";
    inner += "</div>"
    
    return inner;
  }
}

class Polygon extends Model {
  constructor(id){
    super(id);
    this.vertices.push(new Point([0, 0], [0, 0, 0, 1], 0));
    this.type = 'Polygon';
    this.name = 'Nameless Polygon';
    this.preserveSimilarity = false;
  }

  uniqueDisplay = () => {
    return "";
  }
}
