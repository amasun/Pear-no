attribute vec2 a;
varying vec2 vUv;
void main(){
  vUv = a * 0.5 + 0.5;
  gl_Position = vec4(a, 0.0, 1.0);
}
