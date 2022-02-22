//States
const objects = [
  {
    type: 'Polygon',
    name: 'Nameless polygon',
    vertices: [
      { type: 'Point', name: 'Nameless Point', coor: vec2(0.5, 0.5) },
      { type: 'Point', name: 'Nameless Point', coor: vec2(0.5, -0.5) },
      { type: 'Point', name: 'Nameless Point', coor: vec2(-0.5, -0.5) },
      { type: 'Point', name: 'Nameless Point', coor: vec2(-0.5, 0.5) },
    ],
  },
];
const chosen = {}; //Yang akan ditampilkan di rightbar properties
let drawMethod = '';
let objectIdx = -1;
let verticeIdx = -1;

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

//Leftbar
const refreshObjectsList = () => {
  var inner = '<h3>Daftar Objek</h3>';
  for (var i = 0; i < objects.length; i++) {
    inner += "<button class='objectPreview'>" + objects[i].name + '</button>';
    for (var j = 0; j < objects[i].vertices.length; j++) {
      inner += "<button class='pointPreview'>" + objects[i].vertices[j].name + '</button>';
    }
  }
  document.getElementById('leftbar').innerHTML = inner;
};
refreshObjectsList();

//Canvas Purposes
const canvas = document.getElementById('gl-canvas');

const gl = WebGLUtils.setupWebGL(canvas);
if (!gl) {
  alert("WebGL isn't available");
}

const getCoord = (canvas, e) => {
  const x = (2 * (e.clientX - canvas.offsetLeft)) / canvas.clientWidth - 1;
  const y = 1 - (2 * (e.clientY - canvas.offsetTop)) / canvas.clientHeight;
  return { x, y };
};

canvas.addEventListener('mousemove', (e) => {
  if (objectIdx < 0 || verticeIdx < 0) return;
  const { x, y } = getCoord(canvas, e);
  objects[objectIdx].vertices[verticeIdx].coor = vec2(x, y);
});

canvas.addEventListener('mousedown', (e) => {
  if (objectIdx < 0 || verticeIdx < 0) return;
  const { x, y } = getCoord(canvas, e);
  objects[objectIdx].vertices.push({ type: 'Point', name: 'Nameless Point', coor: vec2(x, y) });
  verticeIdx++;
  refreshObjectsList();
});

gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.8, 0.8, 0.8, 1.0);

//  Load shaders and initialize attribute buffers
const program = initShaders(gl, vSource, fSource);
gl.useProgram(program);

// Associate out shader variables with our data buffer
const vBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
const vPosition = gl.getAttribLocation(program, 'vPosition');
gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(vPosition);

render();

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  for (let i = 0; i < objects.length; i++) {
    const vertices = [];
    for (let j = 0; j < objects[i].vertices.length; j++) {
      vertices.push(objects[i].vertices[j].coor);
    }
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    gl.drawArrays(gl.LINE_LOOP, 0, vertices.length);
  }
  window.requestAnimFrame(render);
}

//Rightbar
const poligonButton = document.getElementById('Poligon');
poligonButton.addEventListener('click', (e) => {
  drawButton(e.target.id);
});

const drawButton = (id) => {
  if (id == drawMethod) {
    document.getElementById(id).innerHTML = id;
    drawMethod = '';

    // Save this object
    objects[objectIdx].vertices.pop();
    objectIdx = -1;
    verticeIdx = -1;
    refreshObjectsList();
  } else {
    //Membuat objek baru
    if (drawMethod != '') {
      //Save this object
      document.getElementById(drawMethod).innerHTML = drawMethod;

      // Save this object
      objects[objectIdx].vertices.pop();
      objectIdx = -1;
      verticeIdx = -1;
      refreshObjectsList();
    }

    document.getElementById(id).innerHTML = 'Save';
    drawMethod = id;

    //Menambahkan objek baru dengan 1 vertice
    objectIdx = objects.length;
    verticeIdx = 0;

    objects.push({
      type: id,
      name: 'Nameless ' + id,
      vertices: [{ type: 'Point', name: 'Nameless Point', coor: vec2(0, 0) }],
    });
  }
};
