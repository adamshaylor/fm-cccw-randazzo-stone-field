const scene = {};

scene.cameraArguments = [45, 1, 0.01, 100];
scene.cameraPosition = [0, 0, 10];
scene.cameraLookAt = [0, 0, 0];
// scene.clearColor = '#f0f0f0';
// scene.background = 0xf0f0f0;

scene.ambientLightArguments = ['#79314f'];

scene.pointLights = [
  {
    args: [],
    position: [0, 10, 20],
    shadowCamera: {
      near: 0.1,
      far: 1000
    }
  }
];

scene.circles = [
  {
    x: 0,
    y: 0,
    r: 1
  }
];

module.exports = scene;