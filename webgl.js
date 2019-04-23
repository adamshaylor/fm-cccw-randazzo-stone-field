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
const surfaceNoiseAmplitude = 0.5;
const widthSegments = 7;
const heightSegments = 5;
const stoneColor = '#dcdcdc';
const ambientLight = 0xfaffff;
const backgroundColor = '#dadadf';

const seed = random.getRandomSeed();
random.setSeed(seed);

// eslint-disable-next-line no-console
console.log('seed:', seed);

/**
 * Process
 */

const stoneGeometries = Array.from({ length: stoneVariationCount }, () => {
  const geometry = new THREE.SphereGeometry(
    1,
    widthSegments,
    heightSegments
  );
  geometry.vertices.forEach(vertex => {
    vertex.addScalar(random.range(surfaceNoiseAmplitude / -2, surfaceNoiseAmplitude / 2));
  });
  return geometry;
});

const circleToMesh = ({ x, y, r }) => {
  const mesh = new THREE.Mesh(
    random.pick(stoneGeometries),
    new THREE.MeshStandardMaterial({
      color: stoneColor,
      roughness: 0.8,
      metalness: 0.5,
      flatShading: false
    })
  );

  mesh.position.x = x;
  mesh.position.y = y;
  mesh.position.z = r;

  mesh.rotateX(Math.random() * 2 * Math.PI);
  mesh.rotateY(Math.random() * 2 * Math.PI);
  mesh.rotateZ(Math.random() * 2 * Math.PI);

  mesh.scale.set(r, r, r);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

const meshes = circles.map(circleToMesh);


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

  const controls = new THREE.OrbitControls(camera);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(backgroundColor);

  meshes.forEach(mesh => scene.add(mesh));

  const planeGeometry = new THREE.PlaneGeometry(3048, 3048);
  const planeMaterial = new THREE.ShadowMaterial();
  planeMaterial.opacity = 0.2;
  const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
  planeMesh.receiveShadow = true;
  scene.add(planeMesh);

  scene.add(new THREE.AmbientLight(ambientLight));

  const pointLight = new THREE.PointLight('#ffffff', 0.8, 100000);
  pointLight.position.set(0, 1000, 2000);
  pointLight.castShadow = true;
  pointLight.shadow.radius = 1;
  pointLight.shadow.mapSize.width = 2048;
  pointLight.shadow.mapSize.height = 2048;
  pointLight.shadow.camera.near = 100;
  pointLight.shadow.camera.far = 4000;
  scene.add(pointLight);

  return {
    resize ({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    render () {
      renderer.render(scene, camera);
    },
    unload () {
      controls.dispose();
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
