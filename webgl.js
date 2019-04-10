const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const math = require('canvas-sketch-util/math');
const THREE = require('three');
global.THREE = THREE;
require('three/examples/js/controls/OrbitControls');
const ndarray = require('ndarray');


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
const surfaceNoiseFrequency = 0.1;
const surfaceDisplacementScale = 1.5;
const surfaceDisplacementBias = -0.5;
const surfaceDetail = 32;
const widthAndHeightSegmentsPerStone = 32;

const seed = random.getRandomSeed();
random.setSeed(seed);

// eslint-disable-next-line no-console
console.log('seed:', seed);

/**
 * Process
 */

const sphereGeometry = new THREE.SphereGeometry(1, widthAndHeightSegmentsPerStone, widthAndHeightSegmentsPerStone);

// TODO: create multiple displacement maps to pick randomly from
const ndDisplacements = Array.from({ length: stoneVariationCount }, (_, variantIndex) => {
  const ndDisplacement = ndarray(
    new Uint8Array(Math.pow(surfaceDetail, 2)),
    [ surfaceDetail, surfaceDetail ]
  );
  
  for (let x = 0; x < surfaceDetail; x += 1) {
    for (let y = 0; y < surfaceDetail; y += 1) {
      const noiseValue = random.noise3D(
        x,
        y,
        variantIndex * 100,
        surfaceNoiseFrequency,
        surfaceNoiseAmplitude
      );
  
      const luminanceValue = Math.floor(255 * math.inverseLerp(-1, 1, noiseValue));
      ndDisplacement.set(x, y, luminanceValue);
    }
  }

  return ndDisplacement;
});

const displacementMaps = ndDisplacements.map(ndDisplacement => {
  const displacementMap = new THREE.DataTexture(
    ndDisplacement.data,
    surfaceDetail,
    surfaceDetail,
    THREE.LuminanceFormat
  );
  displacementMap.needsUpdate = true;
  return displacementMap;
});

// const displacementMap = (new THREE.TextureLoader()).load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/perlin-512.png');

const circleToMesh = ({ x, y, r }) => {
  const mesh = new THREE.Mesh(
    sphereGeometry,
    new THREE.MeshStandardMaterial({
      color: '#dcdcdc',
      roughness: 0.8,
      metalness: 0.5,
      flatShading: false,
      displacementMap: random.pick(displacementMaps),
      displacementScale: surfaceDisplacementScale,
      displacementBias: surfaceDisplacementBias
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
  scene.background = new THREE.Color('#dadadf');

  // const debugTextureGeometry = new THREE.PlaneGeometry(1000, 1000);
  // const debugTextureMaterial = new THREE.MeshLambertMaterial({ map: random.pick(displacementMaps) });
  // const debugTextureMesh = new THREE.Mesh(debugTextureGeometry, debugTextureMaterial);
  // debugTextureMesh.position.setZ(1000);
  // scene.add(debugTextureMesh);

  meshes.forEach(mesh => scene.add(mesh));

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
