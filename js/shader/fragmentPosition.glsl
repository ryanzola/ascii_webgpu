uniform float time;
uniform float delta;
#include noise.glsl;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 position = texture2D( texturePosition, uv );
  vec4 velocity = texture2D( textureVelocity, uv );

  position += velocity * 1.0/60.0;

  vec4 rands = hash43(vec3(uv*5.0, 0.0));

  position.xyz += curl(vec3(position.xy, rands.x), time * mix(0.3, 0.7, rands.y), 0.1) * 0.001 * smoothstep(0.3, 0.8, rands.z);

  gl_FragColor = vec4(position.xyz, position.w);
}
