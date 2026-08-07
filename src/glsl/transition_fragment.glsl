precision highp float;
uniform sampler2D t1, t2;
uniform float progress, grade, scaleB, mode, radius, width, intensity, time;
uniform vec2 res, img;
varying vec2 vUv;
vec2 cover(vec2 uv){
  float ca = res.x/res.y, ia = img.x/img.y;
  if (ca > ia) uv.y = (uv.y-0.5)*(ia/ca)+0.5;
  else         uv.x = (uv.x-0.5)*(ca/ia)+0.5;
  return uv;
}
vec3 lift(vec3 c){
  float l = dot(c, vec3(0.2126,0.7152,0.0722));
  return clamp(vec3(l) + (c-vec3(l))*grade, 0.0, 1.0);
}
float hash(vec2 p){ return fract(1e4*sin(17.*p.x + p.y*0.1)*(0.1+abs(sin(p.y*13.+p.x)))); }
float hnoise(vec2 x){
  vec2 i = floor(x), f = fract(x);
  float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
  vec2 u = f*f*(3.-2.*f);
  return mix(a,b,u.x) + (c-a)*u.y*(1.-u.x) + (d-b)*u.x*u.y;
}
void main(){
  vec2 p  = cover(vUv);
  vec2 pB = (p-0.5)/scaleB + 0.5;
  vec3 A, B;
  if (mode < 0.5) {
    vec2 asp = vec2(res.y/res.x, 1.0);
    float n = hnoise(p*res/220.0 + time*0.06);
    float pr = progress*0.66 + n*0.04;
    float circ = 1.0 - smoothstep(-width, 0.0,
                   radius*distance(vec2(0.5,0.47)*asp, p*asp) - pr*(1.+width));
    float k = clamp(circ, 0.0, 1.0);
    A =      texture2D(t1, (p -0.5)*(1.0-k)+0.5).rgb;
    B = lift(texture2D(t2, (pB-0.5)*k     +0.5).rgb);
    gl_FragColor = vec4(mix(A,B,k), 1.0); return;
  }
  if (mode < 1.5) {
    float hn = hnoise(p*res/intensity);
    vec2 d = vec2(0.0, normalize(vec2(0.5,0.5) - p).y);
    A =      texture2D(t1, p  + d*progress      /5.0*(1.0+hn/2.0)).rgb;
    B = lift(texture2D(t2, pB - d*(1.0-progress)/5.0*(1.0+hn/2.0)).rgb);
    gl_FragColor = vec4(mix(A,B,progress), 1.0); return;
  }
  if (mode < 2.5) {
    float x = smoothstep(0.0, 1.0, progress*2.0 + p.y - 1.0);
    A =      texture2D(t1, (p -0.5)*(1.-x)+0.5).rgb;
    B = lift(texture2D(t2, (pB-0.5)*x     +0.5).rgb);
    gl_FragColor = vec4(mix(A,B,x), 1.0); return;
  }
  A =      texture2D(t1, p ).rgb;
  B = lift(texture2D(t2, pB).rgb);
  gl_FragColor = vec4(mode < 3.5 ? mix(A,B,progress)
                                 : (progress < 0.5 ? A : B), 1.0);
}
