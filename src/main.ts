import {vec3, mat4, mat3, vec4, quat} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import ScreenQuad from './geometry/ScreenQuad';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import Grammar from './lsystem/Grammar';
import Turtle from './lsystem/Turtle';
import Crawl from './lsystem/Crawl';
import Mesh from './geometry/Mesh';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  iterations: 0,
  branchColor: 0,
  fruitScale: 0,
  fruitEffect: 0,
  fullEffect: 0,
};

let leafMesh : Mesh;
let skullMesh : Mesh;
let fruitMesh: Mesh;
let baseMesh: Mesh;

let screenQuad: ScreenQuad;
let time: number = 0.0;

let grammarOut : string;
let turtle : Turtle = new Turtle(vec3.fromValues(0, 0, 0), mat3.fromValues(1, 0, 0, 0, 1, 0, 0, 0, 1), 0);
let transforms : Array<mat4>;
let fruitLoc : Array<[quat, vec3]>;

let prev_iter = controls.iterations;
let prev_color = controls.branchColor;
let prev_scale = controls.fruitScale;
let prev_fruitEffect = controls.fruitEffect;
let prev_fullEffect = controls.fullEffect;

function readTextFile(file: string): string {
  var text = "";
  var rawFile = new XMLHttpRequest();
  rawFile.open("GET", file, false);
  rawFile.onreadystatechange = function ()
  {
      if(rawFile.readyState === 4)
      {
          if(rawFile.status === 200 || rawFile.status == 0)
          {
              var allText = rawFile.responseText;
              text = allText;
          }
      }
  }
  rawFile.send(null);
  return text;
}

function createGrammar(axiom: string, iter: number) {
  let grammar = new Grammar(axiom);
  grammar.createRules();
  grammarOut = grammar.expand(iter);
}

function crawlTurtle(axiom: string) {
  let c = new Crawl(turtle);
  c.createRules();
  c.crawl(axiom);
  transforms = c.getBranchTransform();
  fruitLoc = c.getFruitTransform();
}

function updateTransform(mesh: Mesh, iter: number, transArrays: Array<mat4>) {
  let colArray1 = [];
  let colArray2 = [];
  let colArray3 = [];
  let colArray4 = [];
  for(let i = 0; i < iter; i++) {
    for(let j = 0; j < 4; j++) {
      colArray1.push(transArrays[i][j]);
      colArray2.push(transArrays[i][j + 4]);
      colArray3.push(transArrays[i][j + 8]);
      colArray4.push(transArrays[i][j + 12]);
    }
  }
  let col1: Float32Array = new Float32Array(colArray1);
  let col2: Float32Array = new Float32Array(colArray2);
  let col3: Float32Array = new Float32Array(colArray3);
  let col4: Float32Array = new Float32Array(colArray4);
  mesh.setTransformVBOs(col1, col2, col3, col4);
}

function updateTransformFruit(scale: number) {
  let colArray1 = [];
  let colArray2 = [];
  let colArray3 = [];
  let colArray4 = [];
  for(let i = 0; i < fruitLoc.length; i++) {
    let m = mat4.create();
    let v = vec3.create();
    vec3.scale(v, vec3.fromValues(0.2, 0.2, 0.2), scale);
    mat4.fromRotationTranslationScale(m, fruitLoc[i][0], fruitLoc[i][1], v);
    for(let j = 0; j < 4; j++) {
      colArray1.push(m[j]);
      colArray2.push(m[j + 4]);
      colArray3.push(m[j + 8]);
      colArray4.push(m[j + 12]);
    }
  }
  let col1: Float32Array = new Float32Array(colArray1);
  let col2: Float32Array = new Float32Array(colArray2);
  let col3: Float32Array = new Float32Array(colArray3);
  let col4: Float32Array = new Float32Array(colArray4);
  fruitMesh.setTransformVBOs(col1, col2, col3, col4);
}

function updateColor(mesh: Mesh, iter: number, red: number, green : number, blue: number, alpha: number) {
  let fcolorsArray = [];
  for(let i = 0; i < iter; i++) {
    for(let j = 0; j < 4; j++) {
      fcolorsArray.push(red);
      fcolorsArray.push(green);
      fcolorsArray.push(blue);
      fcolorsArray.push(alpha); // Alpha channel
    }
  }
  let fcolors: Float32Array = new Float32Array(fcolorsArray);
  mesh.setColorVBOs(fcolors);
}

function makeBase() {
  let baseString = readTextFile("base.obj");
  baseMesh = new Mesh(baseString, vec3.fromValues(0, 10, 0));
  baseMesh.create();
  let a = new Array();
  let q = mat4.create();
  mat4.identity(q);
  a.push(q);
  updateTransform(baseMesh, 1, a);
  updateColor(baseMesh, 1, 0.1, 0.1, 0.1, 1);
  baseMesh.setNumInstances(1);
}

function makeSkull() {
  let skullString = readTextFile("skull.obj");
  skullMesh = new Mesh(skullString, vec3.fromValues(0, 10, 0));
  skullMesh.create();
  let a = new Array();
  let q = mat4.create();
  mat4.identity(q);
  a.push(q);
  updateTransform(skullMesh, 1, a);
  updateColor(skullMesh, 1, 1.0, 1.0, 1.0, 1.0);
  skullMesh.setNumInstances(1);
}

function makeTree(iter: number) {
  let leafString = readTextFile("cylinder.obj");
  leafMesh = new Mesh(leafString, vec3.fromValues(0, 0, 0));
  createGrammar("[A]/[A]/[A]/[A]/[A]/[A]/[A]", iter);
  crawlTurtle(grammarOut);
  leafMesh.create();
  updateTransform(leafMesh, transforms.length, transforms);
  updateColor(leafMesh, transforms.length, .9, 0.0, .1, 1.0);
  leafMesh.setNumInstances(transforms.length);

  let fruitString = readTextFile("teardrop.obj");
  fruitMesh = new Mesh(fruitString, vec3.fromValues(0, 0, 0));
  fruitMesh.create();
  updateTransformFruit(1);
  updateColor(fruitMesh, fruitLoc.length, 1.0, 0.0, 0.0, 1.0);
  fruitMesh.setNumInstances(fruitLoc.length);
}

function loadScene() {
  screenQuad = new ScreenQuad();
  screenQuad.create();
  makeSkull();
  makeBase();
  makeTree(controls.iterations);
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'iterations', 0, 9).step(1).setValue(7);
  gui.add(controls, 'branchColor', 0, 1).step(.05).setValue(0);
  gui.add(controls, 'fruitScale', 0, 2).step(.05).setValue(2);
  gui.add(controls, 'fruitEffect', 0, 3).step(.05).setValue(3);
  gui.add(controls, 'fullEffect', 0, 12).step(.1).setValue(12);

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 1), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  //gl.enable(gl.BLEND);
  //gl.blendFunc(gl.ONE, gl.ONE); // Additive blending
  gl.enable(gl.DEPTH_TEST);

  const instancedShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/instanced-frag.glsl')),
  ]);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    instancedShader.setTime(time);
    flat.setTime(time++);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);

    if (controls.iterations != prev_iter) {
      makeTree(controls.iterations);
      prev_iter = controls.iterations;
    }

    if (controls.branchColor != prev_color) {
      updateColor(leafMesh, transforms.length, 0.9 * controls.branchColor, 0.0, .1 * controls.branchColor, 1.0);
      prev_color = controls.branchColor;
    }

    if (controls.fruitScale != prev_scale) {
      updateTransformFruit(controls.fruitScale);
      prev_scale = controls.fruitScale;
    }

    if (controls.fruitEffect != prev_fruitEffect) {
      let scale = controls.fruitEffect;
      if (scale < 1) {
        scale = 0;
      } else {
        scale -= 1;
      }
      updateTransformFruit(scale);
      let val = 1 - controls.fruitEffect * .5;
      updateColor(leafMesh, transforms.length, 0.9 * val, 0.0, .1 * val, 1.0);
      prev_fruitEffect = controls.fruitEffect;
    }

    if (controls.fullEffect != prev_fullEffect) {
      let scale = controls.fullEffect;
      let color = controls.fullEffect;
      let iter = controls.fullEffect;
      if (iter > 9) {
        iter = 9;
      }
      if (scale < 10) {
        scale = 0;
      } else if (scale >= 10) {
        scale -= 10;
      }
      if (color < 9) {
        color = 1;
      } else if (color >= 9) {
        color = 1 - ((color - 9) * .5);
      }
      makeTree(iter);
      updateTransformFruit(scale);
      updateColor(leafMesh, transforms.length, 0.9 * color, 0.0, .1 * color, 1.0);
      prev_fullEffect = controls.fullEffect;
    }
    
    renderer.clear();
    renderer.render(camera, flat, [screenQuad]);
    renderer.render(camera, instancedShader, [
      leafMesh, skullMesh, fruitMesh, baseMesh,
    ]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    flat.setDimensions(window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flat.setDimensions(window.innerWidth, window.innerHeight);

  // Start the render loop
  tick();
}

main();
