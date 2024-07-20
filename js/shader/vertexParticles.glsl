varying vec2 vUv;
varying vec3 vPosition;
varying float vShade;
uniform sampler2D uPositions;

attribute vec2 reference;

float PI = 3.1415926535897932384626433832795;

void main(){
  vUv = uv;
  vPosition = position;

  vec3 pos = texture2D(uPositions, reference).xyz;

  vShade = texture2D(uPositions, reference).w;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = 150.0 * ( 1.0 / - mvPosition.z );
  gl_Position = projectionMatrix * mvPosition;
}