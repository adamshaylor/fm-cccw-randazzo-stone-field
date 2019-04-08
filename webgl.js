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
      color: '#dcdcdc',
      roughness: 0.8,
      metalness: 0.5,
      flatShading: false
    })
  );

  mesh.position.x = x;
  mesh.position.y = y;
  // Make the rocks look like they're sitting instead of floating
  mesh.position.z += r;
  mesh.scale = new THREE.Vector3(r, r, r);
  mesh.castShadow = true;
  scene.add(mesh);
};

 /**
  * Output
  */

const sketch = ({ context }) => {
  const renderer = new THREE.WebGLRenderer({
    context
  });

  renderer.shadowMap.enabled = true;

  const camera = new THREE.PerspectiveCamera(...sceneParams.cameraArguments);
  camera.position.set(...sceneParams.cameraPosition);
  camera.lookAt(new THREE.Vector3(...sceneParams.cameraLookAt));

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera);

  // Setup your scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f0f0f0');

  sceneParams.circles.forEach(circle => addStoneToScene({ circle, scene }));

  const planeGeometry = new THREE.PlaneGeometry(10, 10);
  const planeMaterial = new THREE.ShadowMaterial();
  planeMaterial.opacity = 0.2;
  const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
  planeMesh.receiveShadow = true;
  scene.add(planeMesh);

  scene.add(new THREE.AmbientLight('#ffffff'));

  const pointLight = new THREE.PointLight('#ffffff', 1, 80);
  pointLight.position.set(0, 10, 20);
  pointLight.castShadow = true;
  pointLight.shadow.radius = 10;
  pointLight.shadow.mapSize.width = 2048;
  pointLight.shadow.mapSize.height = 2048;
  pointLight.shadow.camera.near = 1;
  pointLight.shadow.camera.far = 100;
  scene.add(pointLight);

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
