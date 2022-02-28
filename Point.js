class Point {
  constructor(coor, color, id=-1){
      this.id = id;
      this.name = "Nameless point";
      this.coor = coor;
      this.color = color;
  }

  copy = (obj) => {
      this.id = obj.id;
      this.name = obj.name;
      this.coor = obj.coor;
      this.color = obj.color;
  }

  leftDisplay = (modelId) => {
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
      
      const sumColor = [];
      for (let i = 0; i < 3; i++) {
        sumColor.push(Math.round(this.color[i] * 256));
      }

      inner += "</div><div class='horizontalbox'>";
      inner += "<strong>Color: </strong><input type='text' onchange='updateColor(this.value); refreshChosenInfo()' value='" + dec_hex(sumColor[0]) + dec_hex(sumColor[1]) + dec_hex(sumColor[2]) + "'></input>";
      inner += '<input type="color" value="#' + dec_hex(sumColor[0]) + dec_hex(sumColor[1]) + dec_hex(sumColor[2]) +'" oninput="updateColor(this.value, true)" onchange="refreshChosenInfo()">'
      inner += "</div>";
      return inner;
  }

  render = (color) => {
      const vertices = [
          [this.coor[0] + 5*epsilon, this.coor[1]],
          [this.coor[0], this.coor[1] + 5*epsilon],
          [this.coor[0] - 5*epsilon, this.coor[1]],
          [this.coor[0], this.coor[1] - 5*epsilon],
      ];
      const colors = [color, color, color, color];

      gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
      gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

      const vPosition = gl.getAttribLocation( program, "vPosition" );
      gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
      gl.enableVertexAttribArray( vPosition );

      gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
      gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

      const vColor = gl.getAttribLocation( program, "vColor" );
      gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
      gl.enableVertexAttribArray( vColor );

      gl.drawArrays( gl.TRIANGLE_FAN, 0, vertices.length);
  }
}