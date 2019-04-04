const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const THREE = require('three');
global.THREE = THREE;
require('three/examples/js/controls/OrbitControls');


/**
 * Input
 */

const sceneParams = require('./scene');

const settings = {
  animate: true,
  context: 'webgl',
  attributes: { antialias: true }
};

const stoneVariationCount = 10;
const surfaceNoiseAmplitude = 0.3;
const surfaceNoiseFrequency = 1.5;
const widthAndHeightSegmentsPerStone = 16;

const seed = random.getRandomSeed();
random.setSeed(seed);

// eslint-disable-next-line no-console
console.log('seed:', seed);

/**
 * Process
 */

const cachedStoneGeometries = Array.from({ length: stoneVariationCount }, () => {
  const geometry = new THREE.SphereGeometry(1, widthAndHeightSegmentsPerStone, widthAndHeightSegmentsPerStone);

  // See three/examples/webgl_geometry_convex.html
  geometry.vertices.forEach(vertex => {
    const randomXyz = Array.from({ length: 3 }, (_, index) => random.noise4D(
      vertex.x,
      vertex.y,
      vertex.z,
      index,
      surfaceNoiseFrequency,
      surfaceNoiseAmplitude
    ));
    const surfaceDistortion = new THREE.Vector3(...randomXyz);
    vertex.add(surfaceDistortion);
  });

  return geometry;
});

const addStoneToScene = ({
  circle: { x, y, r },
  scene
}) => {
  const geometry = random.pick(cachedStoneGeometries);

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 'white',
      roughness: 0.8,
      metalness: 0.7,
      flatShading: false
    })
  );

  mesh.position.x = x;
  mesh.position.y = y;
  mesh.position.z += r;
  mesh.scale = new THREE.Vector3(r, r, r);
  scene.add(mesh);
};

 /**
  * Output
  */

const sketch = ({ context }) => {
  const renderer = new THREE.WebGLRenderer({
    context
  });

  renderer.setClearColor(sceneParams.clearColor, 1);

  const camera = new THREE.PerspectiveCamera(...sceneParams.cameraArguments);
  camera.position.set(...sceneParams.cameraPosition);
  camera.lookAt(new THREE.Vector3(...sceneParams.cameraLookAt));

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera);

  // Setup your scene
  const scene = new THREE.Scene();

  sceneParams.circles.forEach(circle => addStoneToScene({ circle, scene }));

  // TODO: why does this not show up?
  const planeGeometry = new THREE.PlaneGeometry(50, 50);
  const planeMaterial = new THREE.ShadowMaterial();
  planeMaterial.opacity = 0.2;
  const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
  planeMesh.receiveShadow = true;
  scene.add(planeMesh);

  // Specify an ambient/unlit colour
  scene.add(new THREE.AmbientLight(...sceneParams.ambientLightArguments));

  // Add some light
  sceneParams.pointLights.forEach(pointLight => {
    const light = new THREE.PointLight(...pointLight.args);
    light.position.set(...pointLight.position);
    scene.add(light);
  });

  // draw each frame
  return {
    // Handle resize events here
    resize ({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    // Update & render your scene here
    render () {
      controls.update();
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload () {
      controls.dispose();
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
