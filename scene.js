const scene = {};

scene.cameraArguments = [45, 1, 0.01, 100];
scene.cameraPosition = [0, 0, 10];
scene.cameraLookAt = [0, 0, 0];
scene.clearColor = '#f0f0f0';

scene.ambientLightArguments = ['#79314f'];

scene.pointLights = [
  {
    args: ['#75caf7', 1, 30],
    position: [0, 5, 5]
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