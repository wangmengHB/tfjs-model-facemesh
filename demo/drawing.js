import {TRIANGULATION} from './triangulation';

let scatterGLHasInitialized = false;


function drawPath(ctx, points, closePath) {
    const region = new Path2D();
    region.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
        const point = points[i];
        region.lineTo(point[0], point[1]);
    }

    if (closePath) {
        region.closePath();
    }
    ctx.stroke(region);
}


export function drawScatterPoints(predictions, ctx, scatterGL) {
    if (!scatterGL) {
      return;
    }
    if (!Array.isArray(predictions)) {
      return;
    }
  
    const pointsData = predictions.map(prediction => {
      let scaledMesh = prediction.scaledMesh;
      return scaledMesh.map(point => ([-point[0], -point[1], -point[2]]));
    });
    
    let flattenedPointsData = [];
    for (let i = 0; i < pointsData.length; i++) {
      flattenedPointsData = flattenedPointsData.concat(pointsData[i]);
    }
    const dataset = new ScatterGL.Dataset(flattenedPointsData);
    
    if (!scatterGLHasInitialized) {
      scatterGL.render(dataset);
    } else {
      scatterGL.updateDataset(dataset);
    }
    scatterGLHasInitialized = true;
   
}


export function drawAllPrediction(predictions, ctx, triangulateMesh = false) {
    if (!Array.isArray(predictions)) {
        return;
    }
    if (predictions.length > 0) {
        predictions.forEach(prediction => {
        const keypoints = prediction.scaledMesh;
            if (triangulateMesh) {
                for (let i = 0; i < TRIANGULATION.length / 3; i++) {
                const points = [
                    TRIANGULATION[i * 3], TRIANGULATION[i * 3 + 1],
                    TRIANGULATION[i * 3 + 2]
                ].map(index => keypoints[index]);

                drawPath(ctx, points, true);
                }
            } else {
                for (let i = 0; i < keypoints.length; i++) {
                const x = keypoints[i][0];
                const y = keypoints[i][1];

                ctx.beginPath();
                ctx.arc(x, y, 1 /* radius */, 0, 2 * Math.PI);
                ctx.fill();
                }
            }
        });
    }

}

export function drawLipsContour(predictions, ctx) {
    if (!Array.isArray(predictions)) {
      return;
    }
  
    ctx.save();
    ctx.lineWidth = 2;
    ctx.fillStyle = 'red';
    predictions.forEach((item) => {
      const { lipsUpperOuter, lipsUpperInner, lipsLowerInner, lipsLowerOuter } = item.annotations;
      const upperContour = lipsUpperInner.concat(lipsUpperOuter.slice().reverse());
      ctx.beginPath();
      ctx.moveTo(upperContour[0][0], upperContour[0][1]);
      for (let i = 1; i < upperContour.length; i++) {
        const [x, y] = upperContour[i];
        ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.fill();
      const lowerContour = lipsLowerInner.concat(lipsLowerOuter.slice().reverse());
      ctx.beginPath();
      ctx.moveTo(lowerContour[0][0], lowerContour[0][1]);
      for (let i = 1; i < lowerContour.length; i++) {
        const [x, y] = lowerContour[i];
        ctx.lineTo(x,y);
      }
      ctx.closePath();  
      ctx.fill();
    })
    ctx.restore();
}


export function strokeFacePart(predictions, ctx, name) {
    if (!Array.isArray(predictions)) {
        return;
      }
    
      ctx.save();
      ctx.lineWidth = 2;
      ctx.fillStyle = 'pink';
      predictions.forEach((item) => {
        const contour = item.annotations[name];
        console.log(name, contour);
        if (!Array.isArray(contour)) {
            return;
        }

        if (contour.length > 1) {
            ctx.beginPath();
            ctx.moveTo(contour[0][0], contour[0][1]);
            for (let i = 1; i < contour.length; i++) {
                const [x, y] = contour[i];
                ctx.lineTo(x,y);
            }
            // ctx.closePath();
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(contour[0][0], contour[0][1], 5, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }

        
      })
      ctx.restore();

}

