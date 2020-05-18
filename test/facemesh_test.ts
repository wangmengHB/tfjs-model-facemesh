/**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import * as tf from '@tensorflow/tfjs-core';
// tslint:disable-next-line: no-imports-from-dist
import {ALL_ENVS, describeWithFlags} from '@tensorflow/tfjs-core/dist/jasmine_util';

import * as facemesh from './index';
import {stubbedImageVals} from './test_util';

describeWithFlags('Facemesh', ALL_ENVS, () => {
  let model: facemesh.FaceMesh;
  beforeAll(async () => {
    // Note: this makes a network request for model assets.
    model = await facemesh.load();
  });

  it('estimateFaces does not leak memory', async () => {
    const input: tf.Tensor3D = tf.zeros([128, 128, 3]);

    // returnTensors = false, flipHorizontal = false
    let numTensors = tf.memory().numTensors;
    let returnTensors = false;
    let flipHorizontal = false;
    await model.estimateFaces(input, returnTensors, flipHorizontal);
    expect(tf.memory().numTensors).toEqual(numTensors);

    // returnTensors = false, flipHorizontal = true
    numTensors = tf.memory().numTensors;
    returnTensors = false;
    flipHorizontal = true;
    await model.estimateFaces(input, returnTensors, flipHorizontal);
    expect(tf.memory().numTensors).toEqual(numTensors);

    // returnTensors = true, flipHorizontal = false
    numTensors = tf.memory().numTensors;
    returnTensors = true;
    flipHorizontal = false;
    await model.estimateFaces(input, returnTensors, flipHorizontal);
    expect(tf.memory().numTensors).toEqual(numTensors);

    // returnTensors = true, flipHorizontal = true
    numTensors = tf.memory().numTensors;
    returnTensors = true;
    flipHorizontal = true;
    await model.estimateFaces(input, returnTensors, flipHorizontal);
    expect(tf.memory().numTensors).toEqual(numTensors);
  });

  it('estimateFaces returns objects with expected properties', async () => {
    // Stubbed image contains a single face.
    const input = tf.tensor3d(stubbedImageVals, [128, 128, 3]);

    // Call estimateFaces once up front to exclude any initialization tensors
    // from memory test.
    await model.estimateFaces(input);

    const numTensors = tf.memory().numTensors;
    const result = await model.estimateFaces(input);
    const face = result[0];

    expect(tf.memory().numTensors).toEqual(numTensors);
    expect(face.faceInViewConfidence).toBeDefined();
    expect(face.boundingBox).toBeDefined();
    expect(face.mesh).toBeDefined();
    expect(face.scaledMesh).toBeDefined();
  });
});
