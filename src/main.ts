import {vec3, mat4, mat3, vec4} from 'gl-matrix';
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
  scale: 1,
  branchCol: 1,
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
let fruitLoc : Array<mat4>;

let prev_iter = controls.iterations;
let prev_scale = controls.scale;
let prev_col = controls.branchCol;

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

function crawlTurtle(axiom: string, scale: number) {
  let c = new Crawl(turtle, scale);
  c.createRules();
  c.crawl(axiom);
  transforms = c.getBranchTransform();
  fruitLoc = c.getFruitTransform();
}

function makeBase() {
  let baseString = readTextFile("../base.obj");
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
  let skullString = readTextFile("../skull.obj");
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

function makeTree(iter: number, scale: number) {
  let leafString = readTextFile("../cylinder.obj");
  leafMesh = new Mesh(leafString, vec3.fromValues(0, 0, 0));
  createGrammar("[A]/[A]/[A]/[A]/[A]/[A]/[A]", iter);
  crawlTurtle(grammarOut, scale);
  leafMesh.create();
  updateTransform(leafMesh, transforms.length, transforms);
  updateColor(leafMesh, transforms.length, .9, 0.0, .1, 1.0);
  leafMesh.setNumInstances(transforms.length);

  let fruitString = readTextFile("../teardrop.obj");
  fruitMesh = new Mesh(fruitString, vec3.fromValues(0, 0, 0));
  fruitMesh.create();
  updateTransform(fruitMesh, fruitLoc.length, fruitLoc);
  updateColor(fruitMesh, fruitLoc.length, 1.0, 0.0, 0.0, 1.0);
  fruitMesh.setNumInstances(fruitLoc.length);
}

function loadScene() {
  screenQuad = new ScreenQuad();
  screenQuad.create();
  makeSkull();
  makeBase();
  makeTree(controls.iterations, controls.scale);
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
  gui.add(controls, 'scale', 1, 2).step(.2).setValue(1);
  gui.add(controls, 'branchCol', 0, 1).step(.1).setValue(1);

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
      makeTree(controls.iterations, controls.scale);
      prev_iter = controls.iterations;
    }

    if (controls.scale != prev_scale) {
      makeTree(controls.iterations, controls.scale);
      prev_scale = controls.scale;
    }

    if (controls.branchCol != prev_col) {
      updateColor(leafMesh, transforms.length, 0.9 * controls.branchCol, 0.0, 0.1 * controls.branchCol, 1.0);
      prev_col = controls.branchCol;
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
