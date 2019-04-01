const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const THREE = require('three');
global.THREE = THREE;
require('three/examples/js/controls/OrbitControls');


/**
 * Input
 */

const settings = {
  animate: true,
  context: 'webgl',
  attributes: { antialias: true }
};

const surfaceNoiseAmplitude = 0.2;
const surfaceNoiseFrequency = 1.5;
const widthAndHeightSegmentsPerStone = 16;

const seed = random.getRandomSeed();
random.setSeed(seed);

// eslint-disable-next-line no-console
console.log('seed:', seed);

/**
 * Process
 */


 /**
  * Output
  */

const sketch = ({ context }) => {
  const renderer = new THREE.WebGLRenderer({
    context
  });

  renderer.setClearColor('#000', 1);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(2, 2, -4);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera);

  // Setup your scene
  const scene = new THREE.Scene();

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

  const mesh = new THREE.Mesh(
    // new THREE.BoxGeometry(1, 1, 1)
    geometry,
    new THREE.MeshPhysicalMaterial({
      color: 'white',
      roughness: 0.75,
      flatShading: true
    })
  );
  scene.add(mesh);

  // Specify an ambient/unlit colour
  scene.add(new THREE.AmbientLight('#59314f'));

  // Add some light
  const light = new THREE.PointLight('#45caf7', 1, 15.5);
  light.position.set(2, 2, -4).multiplyScalar(1.5);
  scene.add(light);

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
    render ({ time }) {
      mesh.rotation.y = time * (10 * Math.PI / 180);
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
