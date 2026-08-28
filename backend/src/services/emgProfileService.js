/**
 * EMGProfile Service
 * Contains business logic and database operations for sEMG baseline threshold profiles & AI gesture inference
 */

const { EMGProfile, Patient } = require('../models');
const { validateObjectId } = require('../utils/validationHelper');

/**
 * Create a new EMGProfile record
 */
const createEMGProfile = async (emgProfileData) => {
  const emgProfile = await EMGProfile.create(emgProfileData);
  return emgProfile;
};

/**
 * Retrieve all EMGProfile records
 */
const getAllEMGProfiles = async () => {
  const emgProfiles = await EMGProfile.find().populate('patientId', 'fullName aphasiaType age');
  return emgProfiles;
};

/**
 * Retrieve a single EMGProfile by ObjectId
 */
const getEMGProfileById = async (id) => {
  validateObjectId(id, 'EMGProfile');

  const emgProfile = await EMGProfile.findById(id).populate('patientId', 'fullName aphasiaType age');

  if (!emgProfile) {
    throw new Error(`EMGProfile with ID ${id} not found`);
  }

  return emgProfile;
};

const { execFile } = require('child_process');
const path = require('path');

/**
 * sEMG AI Gesture & Intent Inference Pipeline
 * Bridges incoming sEMG signal to Python PyTorch model inference engine
 */
const predictEMGIntent = async (patientId, rawAnalogSignal = [], rmsAmplitude = 0, mode = 'target') => {
  let profile = null;
  if (patientId && patientId.match(/^[0-9a-fA-F]{24}$/)) {
    profile = await EMGProfile.findOne({ patientId });
  }

  const baseline = profile ? profile.baselineVoltage : null;
  const mvc = profile ? profile.maxVoluntaryContraction : null;

  // Calculate effective RMS if raw array provided
  let effectiveRms = rmsAmplitude;
  let rawLength = 0;
  let numChannels = 0;

  if (Array.isArray(rawAnalogSignal) && rawAnalogSignal.length > 0) {
    rawLength = rawAnalogSignal.length;
    if (Array.isArray(rawAnalogSignal[0])) {
      numChannels = rawAnalogSignal[0].length;
      let sumSquares = 0;
      let totalSamples = 0;
      for (let t = 0; t < rawAnalogSignal.length; t++) {
        for (let c = 0; c < rawAnalogSignal[t].length; c++) {
          sumSquares += Math.pow(rawAnalogSignal[t][c], 2);
          totalSamples++;
        }
      }
      if (totalSamples > 0) {
        effectiveRms = Math.sqrt(sumSquares / totalSamples);
      }
    } else {
      numChannels = 1;
      const sumSquares = rawAnalogSignal.reduce((acc, val) => acc + Math.pow(val, 2), 0);
      effectiveRms = Math.sqrt(sumSquares / rawAnalogSignal.length);
    }
  }

  // Calculate activation ratio only if patient profile is calibrated
  let activationRatio = 0;
  const isCalibrated = Boolean(profile && typeof baseline === 'number' && typeof mvc === 'number' && mvc > baseline);
  if (isCalibrated) {
    const rawRatio = (effectiveRms - baseline) / Math.max(0.1, mvc - baseline);
    activationRatio = Math.max(0, Math.min(1, rawRatio));
  }

  // Check channel count and input format compatibility
  let aiInferenceResult = null;

  if (rawLength > 0 && (numChannels === 1 || numChannels === 8)) {
    // 1-channel (BioAmp EXG Pill) or 8-channel input supplied -> execute Python PyTorch model inference
    aiInferenceResult = await new Promise((resolve) => {
      const pythonExe = path.resolve(__dirname, '../../../.venv/Scripts/python.exe');
      const scriptPath = path.resolve(__dirname, '../../../emg-ai/preprocessing/emg_inference_service.py');

      const payload = JSON.stringify({ raw_emg: rawAnalogSignal });

      const child = execFile(pythonExe, [scriptPath, '--mode', mode], (error, stdout, stderr) => {
        if (error || !stdout) {
          return resolve({
            status: 'error',
            error_code: 'PYTHON_EXEC_ERROR',
            message: error ? error.message : 'No output from EMG inference service'
          });
        }
        try {
          const parsed = JSON.parse(stdout.trim());
          resolve(parsed);
        } catch (e) {
          resolve({
            status: 'error',
            error_code: 'JSON_PARSE_ERROR',
            message: 'Failed to parse EMG inference JSON response'
          });
        }
      });

      child.stdin.write(payload);
      child.stdin.end();
    });
  } else if (rawLength > 0 && numChannels !== 1 && numChannels !== 8) {
    // Explicit signal mismatch response for unsupported channel counts
    aiInferenceResult = {
      status: 'incompatible_input',
      error_code: 'EMG_CHANNEL_MISMATCH',
      message: `Physical input provides ${numChannels}-channel EMG, whereas models require 1-channel or 8-channel input.`,
      channel_count: numChannels
    };
  }

  // Construct final recognition response according to real inference status
  let predictedText = '';
  let intent = 'EMG AI Unavailable';
  let confidenceScore = 0; // Confidence defaults to 0 unless provided by real model
  let statusMessage = 'Real EMG AI inference is unavailable for the supplied signal format.';

  if (aiInferenceResult) {
    if (
      aiInferenceResult.status === 'incompatible_input' ||
      aiInferenceResult.error_code === 'CHANNEL_MISMATCH' ||
      aiInferenceResult.error_code === 'EMG_CHANNEL_MISMATCH'
    ) {
      intent = 'EMG Channel Mismatch';
      predictedText = '';
      confidenceScore = 0;
      statusMessage = aiInferenceResult.message;
    } else if (aiInferenceResult.status === 'not_trained') {
      intent = aiInferenceResult.intent || 'Untrained 1-Channel Model';
      predictedText = '';
      confidenceScore = 0;
      statusMessage = aiInferenceResult.message || '1-channel BioAmp model is not trained yet.';
    } else if (aiInferenceResult.status === 'not_calibrated') {
      intent = 'Uncalibrated Model';
      predictedText = '';
      confidenceScore = 0;
      statusMessage = aiInferenceResult.message || 'EMG target-vocabulary model is not calibrated yet.';
    } else if (aiInferenceResult.status === 'success') {
      predictedText = aiInferenceResult.predicted_text || '';
      intent = (mode === 'benchmark' || mode === 'gaddy') ? 'Benchmark Test' : (aiInferenceResult.intent || 'EMG Target Recognized');
      confidenceScore = typeof aiInferenceResult.confidence === 'number' ? aiInferenceResult.confidence : 0;
      statusMessage = aiInferenceResult.disclaimer || 'Target model recognized phrase.';
    } else if (aiInferenceResult.status === 'error') {
      intent = 'EMG AI Error';
      predictedText = '';
      confidenceScore = 0;
      statusMessage = `EMG AI Error: ${aiInferenceResult.message}`;
    }
  } else {
    // No raw signal supplied or empty input
    intent = 'EMG AI Unavailable';
    predictedText = '';
    confidenceScore = 0;
    statusMessage = 'Real EMG AI inference is unavailable: No raw EMG signal supplied.';
  }

  return {
    status: aiInferenceResult ? aiInferenceResult.status : 'not_ready',
    intent,
    predictedText,
    confidenceScore,
    statusMessage,
    aiInference: aiInferenceResult,
    emgMetrics: {
      patientCalibrated: isCalibrated,
      baselineVoltage: baseline,
      maxVoluntaryContraction: mvc,
      rmsAmplitude: Number(effectiveRms.toFixed(2)),
      activationRatio: Number(activationRatio.toFixed(2)),
      channelCount: numChannels,
      sampleLength: rawLength
    }
  };
};

/**
 * Update an EMGProfile record by ObjectId
 */
const updateEMGProfile = async (id, updateData) => {
  validateObjectId(id, 'EMGProfile');

  const emgProfile = await EMGProfile.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });

  if (!emgProfile) {
    throw new Error(`EMGProfile with ID ${id} not found`);
  }

  return emgProfile;
};

/**
 * Delete an EMGProfile record by ObjectId
 */
const deleteEMGProfile = async (id) => {
  validateObjectId(id, 'EMGProfile');

  const emgProfile = await EMGProfile.findByIdAndDelete(id);

  if (!emgProfile) {
    throw new Error(`EMGProfile with ID ${id} not found`);
  }

  return emgProfile;
};

module.exports = {
  create: createEMGProfile,
  getAll: getAllEMGProfiles,
  getById: getEMGProfileById,
  predictEMGIntent,
  update: updateEMGProfile,
  delete: deleteEMGProfile,
  createEMGProfile,
  getAllEMGProfiles,
  getEMGProfileById,
  updateEMGProfile,
  deleteEMGProfile
};
