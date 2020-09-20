// Team Jean --
// Jean-Marc Prud'homme (20137035)
// Jean-Daniel Toupin
// TP1 IFT 3355 -  MEGATRON


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

  return new THREE.Matrix4().set(1,0,0,0,
                                 0,1,0,0,
                                 0,0,1,0,
                                 0,0,0,1)


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

}

function rotateMat(matrix, angle, axis){
  // Apply rotation by @angle with respect to @axis to @matrix
  // matrix: THREE.Matrix3
  // angle: float
  // axis: string "x", "y" or "z"
  var matrixRotate;
  if (axis === "x") {
    matrixRotate = idMat4().set(1,0,0,0,
                                0,Math.cos(angle),(-(Math.sin(angle))),0,
                                0,Math.sin(angle),Math.cos(angle),1,
                                 0,0,0,1)
  } else if (axis === "y") {
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

  if (axis === "x") {
    matrixRotate = new THREE.Matrix3().set(1,0,0,
                                        0,Math.cos(angle),(-(Math.sin(angle))),
                                          0,Math.sin(angle),Math.cos(angle))
  } else if (axis === "y") {
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
    this.armRightRadius = 0.3;
    this.armLeftRadius = 0.3;
    this.foreArmRightRadius = 0.3;
    this.foreArmLeftRadius = 0.3;
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
    initialTorsoMatrix = translateMat(initialTorsoMatrix, 0,this.torsoHeight/2 + this.feetHeight *1.6, 0);

    return initialTorsoMatrix;
  }

  initialHeadMatrix(){
    var initialHeadMatrix = idMat4();
    initialHeadMatrix = translateMat(initialHeadMatrix, 0, this.torsoHeight/2 + this.headRadius, 0);

    return initialHeadMatrix;
  }

  initialFeetMatrix(){
    var initialFeetMatrix = idMat4();
    initialFeetMatrix = rotateMat(initialFeetMatrix,1.5708,"z");
    initialFeetMatrix = rescaleMat(initialFeetMatrix,3,.3,.4);
    initialFeetMatrix = translateMat(initialFeetMatrix, 0,-(this.torsoHeight/2 + this.feetHeight), 0);
    initialFeetMatrix = translateMat(initialFeetMatrix,5,-2,0);


    return initialFeetMatrix;
  }

  initialArmRightMatrix(){
    var initialArmRightMatrix = idMat4();
    initialArmRightMatrix = rescaleMat(initialArmRightMatrix, 1.5,.5,.5)
    initialArmRightMatrix = rotateMat(initialArmRightMatrix,(-Math.PI/2), "z")
    initialArmRightMatrix = translateMat(initialArmRightMatrix,
        this.torsoRadius + this.armRightRadius,
        this.torsoRadius/2, 0);

    return initialArmRightMatrix;
  }

  initialArmLeftMatrix(){
    var initialArmLeftMatrix = idMat4();
    initialArmLeftMatrix = rescaleMat(initialArmLeftMatrix, 1.5,.5,.5)
    initialArmLeftMatrix = rotateMat(initialArmLeftMatrix,Math.PI/2, "z")
    initialArmLeftMatrix = translateMat(initialArmLeftMatrix,
        -(this.torsoRadius + this.armLeftRadius),
        this.torsoRadius/2, 0);

    return initialArmLeftMatrix;
  }

  initialRightForeArmMatrix(){
    var initialRightForeArmMatrix = idMat4();
    initialRightForeArmMatrix = rescaleMat(initialRightForeArmMatrix, 1.5,.5,.5)
    initialRightForeArmMatrix = rotateMat(initialRightForeArmMatrix,(-Math.PI/2), "z")
    initialRightForeArmMatrix = translateMat(initialRightForeArmMatrix,
        this.torsoRadius + this.foreArmRightRadius,
        (-this.torsoRadius/2), 0);

    return initialRightForeArmMatrix;
  }

  initialLeftForeArmMatrix(){
    var initialLeftForeArmMatrix = idMat4();
    initialLeftForeArmMatrix = rescaleMat(initialLeftForeArmMatrix, 1.5,.5,.5)
    initialLeftForeArmMatrix = rotateMat(initialLeftForeArmMatrix,Math.PI/2, "z")
    initialLeftForeArmMatrix = translateMat(initialLeftForeArmMatrix,
        -(this.torsoRadius + this.foreArmLeftRadius),
        (-this.torsoRadius/2), 0);

    return initialLeftForeArmMatrix;
  }


  initialize() {
    // Torso
    var torsoGeometry = new THREE.CubeGeometry(2*this.torsoRadius, this.torsoHeight, this.torsoRadius, 64);
    this.torso = new THREE.Mesh(torsoGeometry, this.material);

    // Head
    var headGeometry = new THREE.CubeGeometry(2*this.headRadius, this.headRadius, this.headRadius);
    this.head = new THREE.Mesh(headGeometry, this.material);

    //right arm
    var armRightGeometry = new THREE.SphereGeometry(this.armRightRadius,8,6,0,Math.PI * 2,0,Math.PI);
    this.armRight = new THREE.Mesh(armRightGeometry, this.material);

    //right ForeArm
    var rightForeArmGeometry = new THREE.SphereGeometry(this.foreArmRightRadius,8,6,0,Math.PI * 2,0,Math.PI);
    this.rightForeArm = new THREE.Mesh(rightForeArmGeometry, this.material);

    //left arm
    var armLeftGeometry = new THREE.SphereGeometry(this.armLeftRadius,8,6,0,Math.PI * 2,0,Math.PI);
    this.armLeft = new THREE.Mesh(armLeftGeometry, this.material);

    //left foreArm
    var leftForeArmGeometry = new THREE.SphereGeometry(this.foreArmLeftRadius,8,6,0,Math.PI * 2,0,Math.PI);
    this.leftForeArm = new THREE.Mesh(leftForeArmGeometry, this.material);

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
    var matrixHead = multMat(this.torsoInitialMatrix, this.headInitialMatrix);
    this.head.setMatrix(matrixHead);

    // Arm left Transformation
    this.armLeftInitialMatrix = this.initialArmLeftMatrix();
    this.armLeftMatrix = idMat4();
    var matrixLeftArm = multMat(this.torsoInitialMatrix, this.armLeftInitialMatrix);
    this.armLeft.setMatrix(matrixLeftArm);

    // right foreArm Transformation
    this.rightForeArmInitMatrix = this.initialRightForeArmMatrix();
    this.rightForeArmMatrix = idMat4();
    var rightForeArmMatrix = multMat(this.torsoInitialMatrix, this.rightForeArmInitMatrix);
    this.rightForeArm.setMatrix(rightForeArmMatrix);

    // Left foreArm Transformation
    this.leftForeArmInitMatrix = this.initialLeftForeArmMatrix();
    this.leftForeArmMatrix = idMat4();
    var leftForeArmMatrix = multMat(this.torsoInitialMatrix, this.leftForeArmInitMatrix);
    this.leftForeArm.setMatrix(leftForeArmMatrix);

    // Arm right Transformation
    this.armRightInitialMatrix = this.initialArmRightMatrix();
    this.armRightMatrix = idMat4();
    var matrixRightArm = multMat(this.torsoInitialMatrix, this.armRightInitialMatrix);
    this.armRight.setMatrix(matrixRightArm);

    // feet transormation
    this.feetInitialMatrix = this.initialFeetMatrix();
    this.feetMatrix = idMat4();
    var matrixFeet = multMat(this.torsoInitialMatrix, this.feetInitialMatrix);
    this.feet.setMatrix(matrixFeet);

    // Add transformations
    // TODO

	// Add robot to scene
	scene.add(this.torso);
    scene.add(this.head);
    scene.add(this.armRight);
    scene.add(this.feet);
    scene.add(this.armLeft);
    scene.add(this.rightForeArm);
    scene.add(this.leftForeArm);
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

    var matrixArmRight = multMat(this.armRightMatrix, this.armRightInitialMatrix);
    var matrixRotArm = multMat(matrixTorse, matrixArmRight);
    this.armRight.setMatrix(matrixRotArm);

    var matrixLeftArm = multMat(this.armLeftMatrix, this.armLeftInitialMatrix);
    var matrixRotLeftArm = multMat(matrixTorse, matrixLeftArm);
    this.armLeft.setMatrix(matrixRotLeftArm);

    var matrixLeftForeArm = multMat(this.leftForeArmMatrix, this.leftForeArmInitMatrix);
    var matrixRotLeftForeArm = multMat(matrixTorse, matrixLeftForeArm);
    this.leftForeArm.setMatrix(matrixRotLeftForeArm);

    var matrixRightForeArm = multMat(this.rightForeArmMatrix, this.rightForeArmInitMatrix);
    var matrixRotRightForeArm = multMat(matrixTorse, matrixRightForeArm);
    this.rightForeArm.setMatrix(matrixRotRightForeArm);

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

    var matrixArmRight = multMat(this.armRightMatrix, this.armRightInitialMatrix);
    var matrixTransArm = multMat(matrixTorso, matrixArmRight);
    this.armRight.setMatrix(matrixTransArm);

    var matrixArmLeft = multMat(this.armLeftMatrix, this.armLeftInitialMatrix);
    var matrixTransArmLeft = multMat(matrixTorso, matrixArmLeft);
    this.armLeft.setMatrix(matrixTransArmLeft);

    var matrixForeArmLeft = multMat(this.leftForeArmMatrix, this.leftForeArmInitMatrix);
    var matrixTransForeArmLeft = multMat(matrixTorso, matrixForeArmLeft);
    this.leftForeArm.setMatrix(matrixTransForeArmLeft);

    var matrixForeArmright = multMat(this.rightForeArmMatrix, this.rightForeArmInitMatrix);
    var matrixTransForeArmRight = multMat(matrixTorso, matrixForeArmright);
    this.rightForeArm.setMatrix(matrixTransForeArmRight);


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
  "Arms",
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