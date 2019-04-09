const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const THREE = require('three');
global.THREE = THREE;
require('three/examples/js/controls/OrbitControls');


/**
 * Input
 */

const circles = require('fm-cccw-circle-field/example_options/ellen-mcfadden.output.json').map(({ x, y, r }) => {
  // This data operates with a 2048x2048 2D canvas with an origin at the top left
  return {
    x: x - 1024,
    y: -1 * y + 1024,
    r
  };
});

const settings = {
  animate: true,
  context: 'webgl',
  attributes: { antialias: true }
};

const stoneVariationCount = 10;
const surfaceNoiseAmplitude = 0.4;
const surfaceNoiseFrequency = 1.2;
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
  // TODO: Why do these all look the same? Is it because of the simplex noise, or something else?
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
  mesh.position.z = r;
  mesh.rotateX(random.value() * Math.PI * 2);
  mesh.rotateY(random.value() * Math.PI * 2);
  mesh.rotateZ(random.value() * Math.PI * 2);
  mesh.scale.set(r, r, r);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
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

  const camera = new THREE.PerspectiveCamera(30, 1, 10, 10000);
  camera.position.set(0, 0, 5000);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera);

  // Setup your scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#dadadf');

  // const axesHelper = new THREE.AxesHelper(5);
  // scene.add(axesHelper);
  // const gridSize = 2048;
  // const gridDivisions = 100;
  // const gridHelper = new THREE.GridHelper(gridSize, gridDivisions);
  // gridHelper.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
  // scene.add(gridHelper);

  circles.forEach(circle => addStoneToScene({ circle, scene }));

  const planeGeometry = new THREE.PlaneGeometry(3048, 3048);
  const planeMaterial = new THREE.ShadowMaterial();
  planeMaterial.opacity = 0.2;
  const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
  planeMesh.receiveShadow = true;
  scene.add(planeMesh);

  scene.add(new THREE.AmbientLight(0xfaffff));

  const pointLight = new THREE.PointLight('#ffffff', 0.8, 100000);
  pointLight.position.set(0, 1000, 2000);
  pointLight.castShadow = true;
  pointLight.shadow.radius = 1;
  pointLight.shadow.mapSize.width = 2048;
  pointLight.shadow.mapSize.height = 2048;
  pointLight.shadow.camera.near = 100;
  pointLight.shadow.camera.far = 4000;
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
