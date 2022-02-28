const epsilon = 0.01;
const hexcode = '0123456789ABCDEF';
const deccode = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  A: 10,
  B: 11,
  C: 12,
  D: 13,
  E: 14,
  F: 15,
};

const euclideanDistance = (coor1, coor2) => {
  return Math.sqrt(
    (coor1[0] - coor2[0]) * (coor1[0] - coor2[0]) + (coor1[1] - coor2[1]) * (coor1[1] - coor2[1])
  );
};

const norm = (deg) => {
  return ((((deg + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
};

const atan3 = (coor1, coor2) => {
  return Math.atan2(coor2[1] - coor1[1], coor2[0] - coor1[0]);
};

const dec_hex = (dec) => {
  dec = Math.min(255, dec);
  return hexcode[Math.floor(dec / 16)] + hexcode[dec % 16];
};

const hex_dec = (hex) => {
  let toReturn = 0;
  for (let i = 0; i < hex.length; i++) {
    toReturn = toReturn * 16 + deccode[hex[i]];
  }
  return toReturn;
};

function setupWebGL(canvas) {
  const gl = canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl');

  if (!gl) {
    alert("WebGL isn't available");
  }

  return gl;
}

function initShaders(gl, vertexSource, fragmentSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const msg =
      'Shader program failed to link.  The error log is:' +
      '<pre>' +
      gl.getProgramInfoLog(program) +
      '</pre>';
    alert(msg);
    return -1;
  }

  return program;
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return -1;
  }

  return shader;
}

function flatten(v) {
  if (v.matrix === true) {
    v = transpose(v);
  }

  let n = v.length;
  let elemsAreArrays = false;

  if (Array.isArray(v[0])) {
    elemsAreArrays = true;
    n *= v[0].length;
  }

  const floats = new Float32Array(n);

  if (elemsAreArrays) {
    let idx = 0;
    for (let i = 0; i < v.length; ++i) {
      for (let j = 0; j < v[i].length; ++j) {
        floats[idx++] = v[i][j];
      }
    }
  } else {
    for (let i = 0; i < v.length; ++i) {
      floats[i] = v[i];
    }
  }

  return floats;
}

window.requestAnimFrame = (function () {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
      window.setTimeout(callback, 1000 / 60);
    }
  );
})();
