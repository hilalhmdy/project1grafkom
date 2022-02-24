//States
let objects = [
    /*{
        type: 'Line',
    },
    {
        type: 'Square',
        name: 'Nameless square',
        center: { type: 'Point', name: 'Nameless Point', coor: [0.5, 0.5], color: [0, 0.5, 1, 1]},
        vertice: { type: 'Point', name: 'Nameless Point', coor: [0.5, -0.5], color: [0.5, 1, 0, 1]},
    },
    {
        type: 'Rectangle',
        name: 'Nameless square',
        center: { type: 'Point', name: 'Nameless Point', coor: [0.5, 0.5], color: [0, 0.5, 1, 1]},
        vertice: { type: 'Point', name: 'Nameless Point', coor: [0.5, -0.5], color: [0.5, 1, 0, 1]},
    },*/
    {
        type: 'Polygon',
        name: 'Nameless polygon2',
        vertices: [
            { type: 'Point', name: 'Nameless Point', coor: [1, 0], color: [0, 0, 0, 1]},
            { type: 'Point', name: 'Nameless Point', coor: [0 , 1], color: [0, 0, 0, 1]},
            { type: 'Point', name: 'Nameless Point', coor: [-1, 0], color: [0, 0, 0, 1]},
            { type: 'Point', name: 'Nameless Point', coor: [0, -1], color: [0, 0, 0, 1]},
        ],
    },
    {
        type: 'Polygon',
        name: 'Nameless polygon',
        vertices: [
            { type: 'Point', name: 'Nameless Point', coor: [0.5, 0.5], color: [0, 0.5, 1, 1]},
            { type: 'Point', name: 'Nameless Point', coor: [0.5, -0.5], color: [0.5, 1, 0, 1]},
            { type: 'Point', name: 'Nameless Point', coor: [-0.5, -0.5], color: [1, 0.5, 0, 1]},
            { type: 'Point', name: 'Nameless Point', coor: [-0.5, 0.5], color: [0.5, 0, 1, 1]},
        ],
    },
]
let chosenID = [0, 1] //Yang akan ditampilkan di rightbar properties
let drawMethod = "";
let objectIdx = -1;
let verticeIdx = -1;

//Leftbar
const refreshObjectsList = () => {
    let inner = "<h3>Daftar Objek</h3>"
    for(let i=objects.length-1; i>=0; i--){
        inner += "<button class='objectPreview' onClick='chosenID=[" + i + ",-1]; refreshChosenInfo()'>"+objects[i].name+"</button>";
        for(let j=0; j<objects[i].vertices.length; j++){
            inner += "<button class='pointPreview' onClick='chosenID=[" + i + "," + j +"]; refreshChosenInfo()'>"+objects[i].vertices[j].name+"</button>";
        }
    }
    document.getElementById("leftbar").innerHTML = inner;
}
refreshObjectsList();

//Canvas Purposes
let canvas = document.getElementById( "gl-canvas" );

let gl = WebGLUtils.setupWebGL( canvas );
if ( !gl ) { alert( "WebGL isn't available" ); }

const mouseMoveListener = (e) => {
    if(objectIdx < 0 || verticeIdx < 0) return;
    let x = 2*(e.clientX - canvas.offsetLeft)/canvas.clientWidth - 1;
    let y = 1 -2*(e.clientY - canvas.offsetTop)/canvas.clientHeight;
    objects[objectIdx].vertices[verticeIdx].coor = [x, y];
    objects[objectIdx].vertices[verticeIdx].color = [0, 0, 0, 1];
}
canvas.addEventListener("mousedown", (e) => {
    if(objectIdx < 0 || verticeIdx < 0) return;
    let x = 2*(e.clientX - canvas.offsetLeft)/canvas.clientWidth - 1;
    let y = 1 -2*(e.clientY - canvas.offsetTop)/canvas.clientHeight;
    objects[objectIdx].vertices.push({type: "Point", name: "Nameless Point", coor: [x, y], color: [0, 0, 0, 1]})
    verticeIdx++;
    refreshObjectsList();
})


gl.viewport( 0, 0, canvas.width, canvas.height );
gl.clearColor( 0.8, 0.8, 0.8, 1.0 );

//  Load shaders and initialize attribute buffers
let program = initShaders( gl, "vertex-shader", "fragment-shader" );
gl.useProgram( program );

// Associate out shader variables with our data buffer
let vBuffer = gl.createBuffer();

let cBuffer = gl.createBuffer();

render();

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    for(let i=0; i<objects.length; i++){
        let vertices = [];
        let colors = [];
        for(let j=0; j<objects[i].vertices.length; j++){
            vertices.push(objects[i].vertices[j].coor);
            colors.push(objects[i].vertices[j].color);
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
    window.requestAnimFrame(render);
}

//Rightbar
const drawButton = (id) => {
    if(id == drawMethod){
        document.getElementById(id).innerHTML = id;
        drawMethod = "";
        // Save this object
        objects[objectIdx].vertices.pop();
        objectIdx = -1;
        verticeIdx = -1;
        refreshObjectsList();
    }else{ //Membuat objek baru
        if(drawMethod != ""){
            document.getElementById(drawMethod).innerHTML = drawMethod;
            // Save this object
            objects[objectIdx].vertices.pop();
            objectIdx = -1;
            verticeIdx = -1;
            refreshObjectsList();
        }
        document.getElementById(id).innerHTML = "Save";
        drawMethod = id;
        //Menambahkan objek baru dengan 1 vertice
        objectIdx = objects.length;
        verticeIdx = 0;
        objects.push({type: id, name: "Nameless " + id, vertices: [
            {type: "Point", name: "Nameless Point", coor: [0, 0], color: [0, 0, 0, 1]}
        ]});
    }
}

const updateObjName = (value) => {
    if(chosenID[1]<0){
        objects[chosenID[0]].name = value;
    }else{
        objects[chosenID[0]].vertices[chosenID[1]].name = value;
    }
    refreshObjectsList();
    refreshChosenInfo();
}
const updateSlider = (coorID, value) => {
    objects[chosenID[0]].vertices[chosenID[1]].coor[coorID] = parseFloat(value);
    refreshChosenInfo();
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
const updateColor = (value) => {
    value = hex_dec(value);
    let toColor = [1];
    for(let i=0; i<3; i++){
        toColor.unshift((value%256)/256);
        value = Math.floor(value/256);
    }
    if(chosenID[1]<0){
        for(let i=0; i<objects[chosenID[0]].vertices.length; i++){
            objects[chosenID[0]].vertices[i].color = toColor;
        }
    }else{
        objects[chosenID[0]].vertices[chosenID[1]].color = toColor;
    }
    refreshChosenInfo();
}

const refreshChosenInfo = () => {
    if(!objects[chosenID[0]]) return;
    let toShow = objects[chosenID[0]].vertices[chosenID[1]];
    if(toShow){ //chosenID 0 dan 1 valid, chosen pasti point
        let inner = "<div class='horizontalbox'>"; 
        inner += "<strong>Name: </strong><input type='text' onchange='updateObjName(this.value)' value='" + toShow.name + "'></input>";
        inner += "</div>";
        inner += "<div><strong>Type: </strong>" + toShow.type + "</div>";
        inner += "<div class='horizontalbox'>";
        inner += "<strong>x: </strong><div id='x-value'>" + toShow.coor[0].toFixed(3) + "</div>";
        inner += "<input type='range' min='-1' max='1' step=0.001 value='" + toShow.coor[0].toFixed(3) + "' onchange='updateSlider(0,this.value)'>";
        inner += "</div><div class='horizontalbox'>";
        inner += "<strong>y: </strong><div id='y-value'>" + toShow.coor[1].toFixed(3) + "</div>";
        inner += "<input type='range' min='-1' max='1' step=0.001 value='" + toShow.coor[1].toFixed(3) + "' onchange='updateSlider(1,this.value)'>";
        
        let meanColor=[];
        for(let i=0; i<3; i++){
            meanColor.push(Math.round(toShow.color[i]*256));
        }
        inner += "</div><div class='horizontalbox'>";
        inner += "<strong>Color: </strong><input type='text' onchange='updateColor(this.value)' value='" + dec_hex(meanColor[0]) + dec_hex(meanColor[1]) + dec_hex(meanColor[2]) + "'></input>";
        inner += "</div>";

        document.getElementById("properti").innerHTML = inner;

        return;
    } //chosenID 1 tidak valid, chosen pasti object
    toShow = objects[chosenID[0]];
    console.log(toShow);
    if(toShow.type == 'Polygon'){
        let inner = "<div class='horizontalbox'>"; 
        inner += "<strong>Name: </strong><input type='text' onchange='updateObjName(this.value)' value='" + toShow.name + "'></input>";
        inner += "</div>";
        inner += "<div><strong>Type: </strong>" + toShow.type + "</div>";
        inner += "<div class='horizontalbox'>";
        let nbV = toShow.vertices.length;
        let meanColor = [0, 0, 0];
        for(let i=0; i<nbV; i++){
            for(let j=0; j<3; j++){
                meanColor[j] += toShow.vertices[i].color[j];
            }
        }
        for(let i=0; i<3; i++){
            meanColor[i] = Math.round(meanColor[i]*256/nbV);
        }
        inner += "<strong>Color: </strong><input type='text' onchange='updateColor(this.value)' value='" + dec_hex(meanColor[0]) + dec_hex(meanColor[1]) + dec_hex(meanColor[2]) + "'></input>";
        inner += "</div>";
        document.getElementById("properti").innerHTML = inner;
    }//Lanjutin aja buat setiap bangun
}
refreshChosenInfo();