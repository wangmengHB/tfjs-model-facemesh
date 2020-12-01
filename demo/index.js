import * as facemesh from '../src';
import * as tf from '@tensorflow/tfjs-core';
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
import {version} from '@tensorflow/tfjs-backend-wasm/dist/version';
import { 
  drawScatterPoints, drawAllPrediction,  drawLipsContour, strokeFacePart,
} from './drawing';



tfjsWasm.setWasmPath(`https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${version}/dist/tfjs-backend-wasm.wasm`);

let model, ctx, videoWidth, videoHeight, video, canvas, scatterGL;

const VIDEO_SIZE = 500;

const ALL_REGIONS = [
  "silhouette",
    "lipsUpperOuter",
    "lipsLowerOuter",
    "lipsUpperInner",
    "lipsLowerInner",
    "rightEyeUpper0",
    "rightEyeLower0",
    "rightEyeUpper1",
    "rightEyeLower1",
    "rightEyeUpper2",
    "rightEyeLower2",
    "rightEyeLower3",
    "rightEyebrowUpper",
    "rightEyebrowLower",
    "leftEyeUpper0",
    "leftEyeLower0",
    "leftEyeUpper1",
    "leftEyeLower1",
    "leftEyeUpper2",
    "leftEyeLower2",
    "leftEyeLower3",
    "leftEyebrowUpper",
    "leftEyebrowLower",
    "midwayBetweenEyes",
    "noseTip",
    "noseBottom",
    "noseRightCorner",
    "noseLeftCorner",
    "rightCheek",
    "leftCheek"
];



// const stats = new Stats();
const state = {
  backend: 'webgl',
  maxFaces: 5,
  triangulateMesh: true,
  renderPointcloud: true,
  drawing: 'all',
};


function setupDatGui() {
  const gui = new dat.GUI();
  gui.add(state, 'backend', ['wasm', 'webgl', 'cpu'])
      .onChange(async backend => {
        await tf.setBackend(backend);
      });

  gui.add(state, 'maxFaces', 1, 20, 1).onChange(async val => {
    model = await facemesh.load({maxFaces: val});
  });

  gui.add(state, 'triangulateMesh');

  gui.add(state, 'renderPointcloud').onChange(render => {
    document.querySelector('#scatter-gl-container').style.display =
    render ? 'inline-block' : 'none';
  });

  gui.add(state, 'drawing', [
    'mesh',
    'all',
    'lips',  
    ...ALL_REGIONS,
  ]);

}

async function setupCamera() {
  video = document.getElementById('video');

  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
      facingMode: 'user',
      // Only setting the video to a specified size in order to accommodate a
      // point cloud, so on mobile devices accept the default size.
      width: VIDEO_SIZE,
      height: VIDEO_SIZE
    },
  });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}



async function render() {
  // stats.begin();
  let beginTime = new Date().getTime();
  const predictions = await model.estimateFaces(video);

  if (!Array.isArray(predictions) || predictions.length === 0) {
    return;
  }
  


  let time = new Date().getTime() - beginTime;
  let timeDiv = document.getElementById('time-consume');
  timeDiv.innerText = `${time} ms`;

  const outputDiv = document.getElementById('predict-output');
  const log = `
  输出的数据量太大，这里只打印输出的数据的类别：
  ${JSON.stringify(predictions.map((item) => Object.keys(item)), null, 4)}
  ----------------------
  item.annotations: 
  ${JSON.stringify(predictions.map((item) => Object.keys(item.annotations)), null, 4)}
  item.faceInViewConfidence: 
  ${JSON.stringify(predictions.map((item) => item.faceInViewConfidence), null, 4)}
  item.boundingBox: 
  ${JSON.stringify(predictions.map((item) => Object.keys(item.boundingBox)), null, 4)}
  item.mesh count: 
  ${JSON.stringify(predictions.map((item) => item.mesh.length ))}
  item.scaledMesh count: 
  ${JSON.stringify(predictions.map((item) => item.scaledMesh.length ))}
  `;
  const prevLog = outputDiv.value;
  if (prevLog !== log) {
    outputDiv.value = log;
  }

  // stats.end();

  ctx.clearRect(0, 0, canvas.width, canvas.height); 
  ctx.drawImage(video, 0, 0, videoWidth, videoHeight, 0, 0, canvas.width, canvas.height);


  if (state.drawing === 'lips') {
    drawLipsContour(predictions, ctx);
  } else if (state.drawing === 'mesh') {
    drawAllPrediction(predictions, ctx, state.triangulateMesh);
  } else if (state.drawing === 'all' ) {
    ALL_REGIONS.forEach(name => strokeFacePart(predictions, ctx, name));
  } else {
    strokeFacePart(predictions, ctx, state.drawing);
  }

  if (state.renderPointcloud) {
    drawScatterPoints(predictions, ctx, scatterGL);
  }


  requestAnimationFrame(render);

}





async function main() {
  await tf.setBackend(state.backend);
  setupDatGui();

  // stats.showPanel(0);  // 0: fps, 1: ms, 2: mb, 3+: custom
  // document.getElementById('main').appendChild(stats.domElement);

  await setupCamera();
  video.play();
  videoWidth = video.videoWidth;
  videoHeight = video.videoHeight;
  video.width = videoWidth;
  video.height = videoHeight;

  canvas = document.getElementById('output');
  canvas.width = videoWidth;
  canvas.height = videoHeight;
  const canvasContainer = document.querySelector('.canvas-wrapper');
  canvasContainer.style = `width: ${videoWidth}px; height: ${videoHeight}px`;

  ctx = canvas.getContext('2d');
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.fillStyle = '#32EEDB';
  ctx.strokeStyle = '#32EEDB';
  ctx.lineWidth = 0.5;

  model = await facemesh.load({maxFaces: state.maxFaces});

  
  document.querySelector('#scatter-gl-container').style = `width: ${VIDEO_SIZE}px; height: ${VIDEO_SIZE}px;`; 
  scatterGL = new ScatterGL(
      document.querySelector('#scatter-gl-container'),
      {'rotateOnStart': false, 'selectEnabled': false});


  
  render();
  
};

main();
