const vSource = `
  attribute vec4 vPosition;
  attribute vec4 vColor;
  varying vec4 fColor;
  void main(){
    gl_Position = vPosition;
    fColor = vColor;
  }
`;

const fSource = `
  precision mediump float;
  varying vec4 fColor;
  void main(){
    gl_FragColor = fColor;
  }
`;

const dummy = new Polygon(0);
dummy.vertices = [];
dummy.addVertex([0.5, 0], [0, 0.5, 1, 1], 0), dummy.addVertex([0, 0.5], [0.5, 1, 0, 1], 1);
dummy.addVertex([-0.5, 0], [1, 0.5, 0, 1], 2);
dummy.addVertex([0, -0.5], [0.5, 0, 1, 1], 3);

//States
const objects = [dummy];
let chosenID = [-1, -1]; //Yang akan ditampilkan di rightbar properties
let toChooseID = [-1, -1];
let objectIdx = -1;
let verticeIdx = -1;
let drawMethod = '';

//Leftbar
const refreshObjectsList = () => {
  let inner = '<h3>Daftar Objek</h3>';
  for (let i = objects.length - 1; i >= 0; i--) {
    objects[i].id = i;
    inner += objects[i].leftDisplay();
    for (let j = 0; j < objects[i].vertices.length; j++) {
      objects[i].vertices[j].id = j;
      inner += objects[i].vertices[j].leftDisplay(i);
    }
  }
  document.getElementById('leftbar').innerHTML = inner;
};

refreshObjectsList();

//Canvas Purposes
const canvas = document.getElementById('gl-canvas');
const gl = setupWebGL(canvas);

const mouseMoveListener = (e) => {
  //Hitung koordinat mouse
  let x = (2 * (e.clientX - canvas.offsetLeft)) / canvas.clientWidth - 1;
  let y = 1 - (2 * (e.clientY - canvas.offsetTop)) / canvas.clientHeight;
  let obj = objects[objects.length - 1];

  if (drawMethod == '') {
    toChooseID = [-1, -1];
    for (let i = objects.length - 1; i >= 0 && toChooseID[0] < 0; i--) {
      if (euclideanDistance([x, y], objects[i].center.coor) < 5 * epsilon) {
        toChooseID = [i, -1];
      }
      for (let j = 0; j < objects[i].vertices.length && toChooseID[0] < 0; j++) {
        if (euclideanDistance([x, y], objects[i].vertices[j].coor) < 5 * epsilon) {
          toChooseID = [i, j];
        }
      }
    }
  } else if (drawMethod == '2') {
    if (chosenID[1] < 0) {
      objects[chosenID[0]].moveCenter([x, y]);
    } else {
      objects[chosenID[0]].moveVertex(chosenID[1], [x, y]);
    }
    refreshChosenInfo();
  } else if (drawMethod == 'Line') {
  } else if (drawMethod == 'Line2') {
    obj.vertices[obj.vertices.length - 1].coor = [x, y];
  } else if (drawMethod == 'Square') {
    obj.moveCenter([x, y]);
  } else if (drawMethod == 'Square2') {
    obj.moveVertex(0, [x, y]);
  } else if (drawMethod == 'Rectangle') {
  } else if (drawMethod == 'Rectangle2') {
    const [x0, y0] = obj.vertices[0].coor;
    const vLength = obj.vertices.length;

    obj.vertices[vLength - 3].coor = [x, y0];
    obj.vertices[vLength - 2].coor = [x, y];
    obj.vertices[vLength - 1].coor = [x0, y];
  } else {
    obj.moveVertex(obj.vertices.length - 1, [x, y]);
  }
};

canvas.addEventListener('mouseup', (e) => {
  //Hitung koordinat mouse
  const x = (2 * (e.clientX - canvas.offsetLeft)) / canvas.clientWidth - 1;
  const y = 1 - (2 * (e.clientY - canvas.offsetTop)) / canvas.clientHeight;

  if (drawMethod == '') {
    chosenID[0] = toChooseID[0];
    chosenID[1] = toChooseID[1];
    drawMethod = '2';
    refreshChosenInfo();
  } else if (drawMethod == '2') {
    drawMethod = '';
  } else if (drawMethod == 'Line') {
    drawMethod = 'Line2';
    objects[objects.length - 1].vertices[0].coor = [x, y];
  } else if (drawMethod == 'Line2') {
    drawMethod = '';
    objects[objects.length - 1].calculateCenter();
  } else if (drawMethod == 'Square') {
    drawMethod = 'Square2';
  } else if (drawMethod == 'Square2') {
    drawMethod = '';
  } else if (drawMethod == 'Rectangle') {
    drawMethod = 'Rectangle2';
    objects[objects.length - 1].vertices[0].coor = [x, y];
  } else if (drawMethod == 'Rectangle2') {
    drawMethod = '';
    objects[objects.length - 1].calculateCenter();
  } else {
    objects[objects.length - 1].addVertex([x, y], [0, 0, 0, 1]);
  }
  refreshObjectsList();
});

gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.8, 0.8, 0.8, 1.0);

//  Load shaders and initialize attribute buffers
const program = initShaders(gl, vSource, fSource);
gl.useProgram(program);

// Associate out shader variables with our data buffer
const vBuffer = gl.createBuffer();
const cBuffer = gl.createBuffer();

render();

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  for (let i = 0; i < objects.length; i++) {
    objects[i].render(gl);
  }
  if (chosenID[0] >= 0) {
    if (chosenID[1] < 0) {
      objects[chosenID[0]].center.render([1, 1, 1, 1]);
    } else {
      objects[chosenID[0]].vertices[chosenID[1]].render([1, 1, 1, 1]);
    }
  }
  if (toChooseID[0] >= 0) {
    if (toChooseID[1] < 0) {
      objects[toChooseID[0]].center.render([1, 1, 1, 1]);
    } else {
      objects[toChooseID[0]].vertices[toChooseID[1]].render([1, 1, 1, 1]);
    }
  }
  window.requestAnimFrame(render);
}

//Rightbar
const drawButton = (id) => {
  if (drawMethod == '') {
    //Gambar model baru
    drawMethod = id;
    if (id == 'Line') {
      objects.push(new Line(objects.length));
    } else if (id == 'Square') {
      objects.push(new Square(objects.length));
    } else if (id == 'Rectangle') {
      objects.push(new Rectangle(objects.length));
    } else if (id == 'Polygon') {
      objects.push(new Polygon(objects.length));
      document.getElementById('Polygon').innerHTML = 'Save';
    } else if (id == 'Polygon Strips') {
      const p = new Polygon(objects.length);
      p.isFan = false;
      objects.push(p);
      document.getElementById('Polygon Strips').innerHTML = 'Save';
    }
  } else if (drawMethod == '2') {
  } else {
    //Lagi ditengah2 menggambar
    if (drawMethod == 'Polygon') {
      //End polygon
      const obj = objects[objects.length - 1];
      obj.deleteVertex(obj.vertices.length - 1);
      document.getElementById('Polygon').innerHTML = 'Polygon';
    } else if (drawMethod == 'Polygon Strips') {
      //End polygon
      const obj = objects[objects.length - 1];
      obj.deleteVertex(obj.vertices.length - 1);
      document.getElementById('Polygon Strips').innerHTML = 'Polygon Strips';
    } else {
      //Untuk menghindari komplikasi hapus obj terakhir
      objects.splice(objects.length, 1);
    }

    drawMethod = '';
  }

  refreshObjectsList();
};

const updateObjName = (value) => {
  if (chosenID[1] < 0) {
    objects[chosenID[0]].name = value;
  } else {
    objects[chosenID[0]].vertices[chosenID[1]].name = value;
  }
  refreshObjectsList();
};

const updateSlider = (coorID, value) => {
  let x, y;
  if (chosenID[1] < 0) {
    x = objects[chosenID[0]].center.coor[0];
    y = objects[chosenID[0]].center.coor[1];
  } else {
    x = objects[chosenID[0]].vertices[chosenID[1]].coor[0];
    y = objects[chosenID[0]].vertices[chosenID[1]].coor[1];
  }
  if (coorID == 0) {
    x = parseFloat(value);
    document.getElementById('x-value').innerHTML = x.toFixed(3);
  } else {
    y = parseFloat(value);
    document.getElementById('y-value').innerHTML = y.toFixed(3);
  }
  if (chosenID[1] < 0) {
    objects[chosenID[0]].moveCenter([x, y]);
  } else {
    objects[chosenID[0]].moveVertex(chosenID[1], [x, y]);
  }
};

const updateColor = (value, includetag = false) => {
  if (includetag) {
    value = value[1] + value[2] + value[3] + value[4] + value[5] + value[6];
  }

  value = value.toUpperCase();
  console.log(value);
  value = hex_dec(value);
  const toColor = [1];

  for (let i = 0; i < 3; i++) {
    toColor.unshift((value % 256) / 256);
    value = Math.floor(value / 256);
  }

  if (chosenID[1] < 0) {
    for (let i = 0; i < objects[chosenID[0]].vertices.length; i++) {
      objects[chosenID[0]].vertices[i].color = toColor;
    }
  } else {
    objects[chosenID[0]].vertices[chosenID[1]].color = toColor;
  }
};

const updateSimilarity = () => {
  const obj = objects[chosenID[0]];
  obj.preserveSimilarity = !obj.preserveSimilarity;
  refreshChosenInfo();
};

const updateDrawMethod = () => {
  const obj = objects[chosenID[0]];
  obj.isFan = !obj.isFan;
  refreshChosenInfo();
};

const updateSisi = (value) => {
  const obj = objects[chosenID[0]];
  const s = euclideanDistance(obj.vertices[0].coor, obj.vertices[1].coor);
  const mul = parseFloat(value) / s;
  document.getElementById('s-value').innerHTML = s.toFixed(3);
  obj.dilate(mul);
};

const updateRectangleHeight = (value) => {
  const obj = objects[chosenID[0]];
  const h = euclideanDistance(obj.vertices[1].coor, obj.vertices[2].coor).toFixed(3);

  document.getElementById('h-value').innerHTML = h;
  obj.calculateNewHeight(value);
};

const updateRectangleWidth = (value) => {
  const obj = objects[chosenID[0]];
  const w = euclideanDistance(obj.vertices[0].coor, obj.vertices[1].coor).toFixed(3);

  document.getElementById('w-value').innerHTML = w;
  obj.calculateNewWidth(value);
};

const refreshChosenInfo = () => {
  if (!objects[chosenID[0]]) return;
  let toShow = objects[chosenID[0]].vertices[chosenID[1]];

  if (toShow) {
    //chosenID 0 dan 1 valid, chosen pasti point
    document.getElementById('properti').innerHTML = toShow.rightDisplay();
    return;
  } //chosenID 1 tidak valid, chosen pasti object

  toShow = objects[chosenID[0]];
  document.getElementById('properti').innerHTML = toShow.rightDisplay() + toShow.uniqueDisplay();
};

refreshChosenInfo();

const exportFile = function () {
  let filename = document.getElementById('export_file').value;

  if (!filename) {
    filename = 'data';
  }

  const data = JSON.stringify(objects);
  download(filename + '.json', data);

  console.log('The file was saved!');
};

const importFile = function () {
  const file = document.getElementById('import_file').files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    console.log('file imported');
    const toAppend = JSON.parse(e.target.result);

    for (let i = 0; i < toAppend.length; i++) {
      const newID = objects.length;
      if (toAppend[i].type == 'Line') {
        objects.push(new Line(newID));
      } else if (toAppend[i].type == 'Square') {
        objects.push(new Square(newID));
      } else if (toAppend[i].type == 'Rectangle') {
        objects.push(new Rectangle(newID));
      } else if (toAppend[i].type == 'Polygon') {
        objects.push(new Polygon(newID));
      }
      objects[newID].copy(toAppend[i]);
    }
    refreshObjectsList();
  };

  reader.readAsText(file);
  if (!file) {
    alert('Blank file');
  }
};

const download = function (filename, text) {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
};

const help = document.getElementById('help');
const btn = document.getElementById('helpBtn');
const span = document.getElementsByClassName('close')[0];

btn.onclick = function () {
  help.style.display = 'block';
};

span.onclick = function () {
  help.style.display = 'none';
};

window.onclick = function (event) {
  if (event.target == help) {
    help.style.display = 'none';
  }
};
