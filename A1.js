// Test GIt!!!!!!!!!!
THREE.Object3D.prototype.setMatrix = function(a) {
  this.matrix = a;
  this.matrix.decompose(this.position, this.quaternion, this.scale);
};

var start = Date.now();
// SETUP RENDERER AND SCENE
var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xffffff); // white background colour
document.body.appendChild(renderer.domElement);

// SETUP CAMERA
var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000); // view angle, aspect ratio, near, far
camera.position.set(10,5,10);
camera.lookAt(scene.position);
scene.add(camera);

// SETUP ORBIT CONTROL OF THE CAMERA
var controls = new THREE.OrbitControls(camera);
controls.damping = 0.2;

// ADAPT TO WINDOW RESIZE
function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
resize();

// FLOOR WITH CHECKERBOARD
var floorTexture = new THREE.ImageUtils.loadTexture('images/tile.jpg');
floorTexture.wrapS = floorTexture.wrapT = THREE.MirroredRepeatWrapping;
floorTexture.repeat.set(4, 4);

var floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture, side: THREE.DoubleSide });
var floorGeometry = new THREE.PlaneBufferGeometry(15, 15);
var floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = Math.PI / 2;
floor.position.y = 0.0;
scene.add(floor);

// TRANSFORMATIONS

function multMat(m1, m2){
  return new THREE.Matrix4().multiplyMatrices(m1, m2);
}

function inverseMat(m){
  return new THREE.Matrix4().getInverse(m, true);
}

function idMat4(){

  return new THREE.Matrix4();

}

function translateMat(matrix, x, y, z){
  // Apply translation [x, y, z] to @matrix
  // matrix: THREE.Matrix3
  // x, y, z: float
  var matrixTrans = idMat4().set(1,0,0,x,
                                 0,1,0,y,
                                 0,0,1,z,
                                 0,0,0,1)

  return multMat(matrixTrans, matrix);
  // TODO
}

function rotateMat(matrix, angle, axis){
  // Apply rotation by @angle with respect to @axis to @matrix
  // matrix: THREE.Matrix3
  // angle: float
  // axis: string "x", "y" or "z"
  var matrixRotate;
  if (axis == "x") {
    matrixRotate = idMat4().set(1,0,0,0,
                                0,Math.cos(angle),(-(Math.sin(angle))),0,
                                0,Math.sin(angle),Math.cos(angle),1,
                                 0,0,0,1)
  } else if (axis == "y") {
    matrixRotate = idMat4().set(Math.cos(angle),0,Math.sin(angle),0,
                               0,1,0,0,
                                (-(Math.sin(angle))),0,Math.cos(angle),0,
                               0,0,0,1);
  } else {
    matrixRotate = idMat4().set(Math.cos(angle),(-(Math.sin(angle))),0,0,
                              (Math.sin(angle)),(Math.cos(angle)),0,0,
                              0,0,1,0,
                              0,0,0,1);
  }

  return multMat(matrixRotate, matrix);

}

function rotateVec3(v, angle, axis){
  // Apply rotation by @angle with respect to @axis to vector @v
  //   // v: THREE.Vector3
  //   // angle: float
  //   // axis: string "x", "y" or "z"
  var matrixRotate;

  if (axis == "x") {
    matrixRotate = new THREE.Matrix3().set(1,0,0,
                                        0,Math.cos(angle),(-(Math.sin(angle))),
                                          0,Math.sin(angle),Math.cos(angle))
  } else if (axis == "y") {
    matrixRotate = new THREE.Matrix3().set(Math.cos(angle),0,Math.sin(angle),
                                          0,1,0,
                                          (-(Math.sin(angle))),0,Math.cos(angle))
  } else {
    matrixRotate = new THREE.Matrix3().set(Math.cos(angle),(-(Math.sin(angle))),0,
                                          (Math.sin(angle)),(Math.cos(angle)),0,
                                          0,0,1)
  }

  return matrixRotate.multiplyVector3(v);
}

function rescaleMat(matrix, x, y, z){
  // Apply scaling @x, @y and @z to @matrix
  // matrix: THREE.Matrix3
  // x, y, z: float

  var matrixScale = new idMat4().set(x,0,0,0,
                                  0,y,0,0,
                                  0,0,z,0,
                                  0,0,0,1);

  return multMat(matrixScale, matrix);

}

class Robot {
  constructor() {
    // Geometry
    this.torsoHeight = 1.5;
    this.torsoRadius = 0.75;
    this.headRadius = 0.32;
    this.feetHeight = 0.5;
    // Add parameters for parts
    // TODO

    // Animation
    this.walkDirection = new THREE.Vector3( 0, 0, 1 );

    // Material
    this.material = new THREE.MeshNormalMaterial();

    // Initial pose
    this.initialize()
  }

  initialTorsoMatrix(){
    var initialTorsoMatrix = idMat4();
    initialTorsoMatrix = translateMat(initialTorsoMatrix, 0,this.torsoHeight/2, 0);

    return initialTorsoMatrix;
  }

  initialHeadMatrix(){
    var initialHeadMatrix = idMat4();
    initialHeadMatrix = translateMat(initialHeadMatrix, 0, this.torsoHeight/2 + this.headRadius, 0);

    return initialHeadMatrix;
  }

  initialFeetMatrix(){
    var initialFeetMatrix = idMat4();
    initialFeetMatrix = translateMat(initialFeetMatrix, 0,-(this.torsoHeight/2 + this.feetHeight), 0);
    initialFeetMatrix = rotateMat(initialFeetMatrix,1.5708,"z");
    initialFeetMatrix = translateMat(initialFeetMatrix,-1,-1.1,0);
    initialFeetMatrix = rescaleMat(initialFeetMatrix,-1,1,1);

    return initialFeetMatrix;
  }

  initialize() {
    // Torso
    var torsoGeometry = new THREE.CubeGeometry(2*this.torsoRadius, this.torsoHeight, this.torsoRadius, 64);
    this.torso = new THREE.Mesh(torsoGeometry, this.material);

    // Head
    var headGeometry = new THREE.CubeGeometry(2*this.headRadius, this.headRadius, this.headRadius);
    this.head = new THREE.Mesh(headGeometry, this.material);

    // Feet
    var feetGeometry = new THREE.SphereGeometry(this.feetHeight);
    this.feet = new THREE.Mesh(feetGeometry, this.material);

    // Add parts
    // TODO

    // Torse transformation
    this.torsoInitialMatrix = this.initialTorsoMatrix();
    this.torsoMatrix = idMat4();
    this.torso.setMatrix(this.torsoInitialMatrix);

    // Head transformation
    this.headInitialMatrix = this.initialHeadMatrix();
    this.headMatrix = idMat4();
    var matrix = multMat(this.torsoInitialMatrix, this.headInitialMatrix);
    this.head.setMatrix(matrix);

    // feet transormation
    this.feetInitialMatrix = this.initialFeetMatrix();
    this.feetMatrix = idMat4();
    var matrix = multMat(this.torsoInitialMatrix, this.feetInitialMatrix);
    this.feet.setMatrix(matrix);

    // Add transformations
    // TODO

	// Add robot to scene
	scene.add(this.torso);
    scene.add(this.head);
    scene.add(this.feet);
    // Add parts
    // TODO
  }

  rotateTorso(angle){
    var torsoMatrix = this.torsoMatrix;

    this.torsoMatrix = idMat4();
    this.torsoMatrix = rotateMat(this.torsoMatrix, angle, "y");
    this.torsoMatrix = multMat(torsoMatrix, this.torsoMatrix);

    var matrixTorse = multMat(this.torsoMatrix, this.torsoInitialMatrix);
    this.torso.setMatrix(matrixTorse);

    var matrixHead = multMat(this.headMatrix, this.headInitialMatrix);
    var matrixRotateHead = multMat(matrixTorse, matrixHead);
    this.head.setMatrix(matrixRotateHead);

    var matrixFeet = multMat(this.feetMatrix, this.feetInitialMatrix);
    var matrixRotateFeet = multMat(matrixTorse,matrixFeet);
    this.feet.setMatrix(matrixRotateFeet);

    this.walkDirection = rotateVec3(this.walkDirection, angle, "y");
  }

  moveTorso(speed){
    this.torsoMatrix = translateMat(this.torsoMatrix, speed * this.walkDirection.x, speed * this.walkDirection.y, speed * this.walkDirection.z);

    var matrixTorso = multMat(this.torsoMatrix, this.torsoInitialMatrix);
    this.torso.setMatrix(matrixTorso);

    var matrixHead = multMat(this.headMatrix, this.headInitialMatrix);
    var matrixTranslateHead = multMat(matrixTorso, matrixHead);
    this.head.setMatrix(matrixTranslateHead);

    var matrixFeet = multMat(this.feetMatrix, this.feetInitialMatrix);
    var matrixTranslateFeet = multMat(matrixTorso, matrixFeet);
    this.feet.setMatrix(matrixTranslateFeet);
  }

  rotateHead(angle){
    var headMatrix = this.headMatrix;

    this.headMatrix = idMat4();
    this.headMatrix = rotateMat(this.headMatrix, angle, "y");
    this.headMatrix = multMat(headMatrix, this.headMatrix);

    var matrix = multMat(this.headMatrix, this.headInitialMatrix);
    matrix = multMat(this.torsoMatrix, matrix);
    matrix = multMat(this.torsoInitialMatrix, matrix);
    this.head.setMatrix(matrix);
  }

  // Add methods for other parts
  // TODO
}

var robot = new Robot();

// LISTEN TO KEYBOARD
var keyboard = new THREEx.KeyboardState();

var selectedRobotComponent = 0;
var components = [
  "Torso",
  "Head",
  "Feet",
  // Add parts names
  // TODO
];
var numberComponents = components.length;

function checkKeyboard() {
  // Next element
  if (keyboard.pressed("e")){
    selectedRobotComponent = selectedRobotComponent + 1;

    if (selectedRobotComponent<0){
      selectedRobotComponent = numberComponents - 1;
    }

    if (selectedRobotComponent >= numberComponents){
      selectedRobotComponent = 0;
    }

    window.alert(components[selectedRobotComponent] + " selected");
  }

  // Previous element
  if (keyboard.pressed("q")){
    selectedRobotComponent = selectedRobotComponent - 1;

    if (selectedRobotComponent < 0){
      selectedRobotComponent = numberComponents - 1;
    }

    if (selectedRobotComponent >= numberComponents){
      selectedRobotComponent = 0;
    }

    window.alert(components[selectedRobotComponent] + " selected");
  }

  // UP
  if (keyboard.pressed("w")){
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.moveTorso(0.1);
        break;
      case "Head":
        break;
      // Add more cases
      // TODO
    }
  }

  // DOWN
  if (keyboard.pressed("s")){
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.moveTorso(-0.1);
        break;
      case "Head":
        break;
      // Add more cases
      // TODO
    }
  }

  // LEFT
  if (keyboard.pressed("a")){
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.rotateTorso(0.1);
        break;
      case "Head":
        robot.rotateHead(0.1);
        break;
      // Add more cases
      // TODO
    }
  }

  // RIGHT
  if (keyboard.pressed("d")){
    switch (components[selectedRobotComponent]){
      case "Torso":
        robot.rotateTorso(-0.1);
        break;
      case "Head":
        robot.rotateHead(-0.1);
        break;
      // Add more cases
      // TODO
    }
  }
}

// SETUP UPDATE CALL-BACK
function update() {
  checkKeyboard();
  requestAnimationFrame(update);
  renderer.render(scene, camera);
}

update();