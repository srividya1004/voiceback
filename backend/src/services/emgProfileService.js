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

  const baseline = profile ? profile.baselineVoltage : 1.2;
  const mvc = profile ? profile.maxVoluntaryContraction : 3.5;

  // Calculate effective RMS if raw array provided
  let effectiveRms = rmsAmplitude;
  if (Array.isArray(rawAnalogSignal) && rawAnalogSignal.length > 0) {
    const sumSquares = rawAnalogSignal.reduce((acc, val) => acc + Math.pow(val, 2), 0);
    effectiveRms = Math.sqrt(sumSquares / rawAnalogSignal.length);
  }

  const rawRatio = (effectiveRms - baseline) / Math.max(0.1, mvc - baseline);
  const activationRatio = Math.max(0, Math.min(1, rawRatio));

  // If rawAnalogSignal has (T, 8) matrix, execute Python PyTorch model inference
  let aiInferenceResult = null;
  if (Array.isArray(rawAnalogSignal) && rawAnalogSignal.length > 0 && Array.isArray(rawAnalogSignal[0]) && rawAnalogSignal[0].length === 8) {
    aiInferenceResult = await new Promise((resolve) => {
      const pythonExe = path.resolve(__dirname, '../../../.venv/Scripts/python.exe');
      const scriptPath = path.resolve(__dirname, '../../../emg-ai/preprocessing/emg_inference_service.py');

      const payload = JSON.stringify({ raw_emg: rawAnalogSignal });

      const child = execFile(pythonExe, [scriptPath, '--mode', mode], (error, stdout, stderr) => {
        if (error || !stdout) {
          return resolve({
            status: 'error',
            message: error ? error.message : 'No output from EMG inference service'
          });
        }
        try {
          const parsed = JSON.parse(stdout.trim());
          resolve(parsed);
        } catch (e) {
          resolve({
            status: 'error',
            message: 'Failed to parse EMG inference JSON response'
          });
        }
      });

      child.stdin.write(payload);
      child.stdin.end();
    });
  }

  // Handle Model Separation status
  let predictedText = '';
  let intent = 'Baseline / Rest';
  let confidenceScore = 0.95;
  let statusMessage = 'Baseline signal evaluated.';

  if (aiInferenceResult) {
    if (aiInferenceResult.status === 'not_calibrated') {
      statusMessage = aiInferenceResult.message;
      intent = 'Uncalibrated Model';
      predictedText = '';
    } else if (aiInferenceResult.status === 'success') {
      predictedText = aiInferenceResult.predicted_text || '';
      intent = mode === 'benchmark' ? 'Benchmark Test' : 'EMG Target Recognized';
      statusMessage = aiInferenceResult.disclaimer || 'Target model recognized phrase.';
    } else if (aiInferenceResult.status === 'error') {
      statusMessage = `EMG AI Error: ${aiInferenceResult.message}`;
    }
  } else {
    // Threshold fallback if raw 8-channel array not provided
    if (activationRatio < 0.15) {
      intent = 'Baseline / Rest';
      predictedText = '';
    } else if (activationRatio >= 0.15 && activationRatio < 0.35) {
      intent = 'Water Request';
      predictedText = 'I need water, please.';
    } else if (activationRatio >= 0.35 && activationRatio < 0.60) {
      intent = 'Assistance Request';
      predictedText = 'I need help.';
    } else if (activationRatio >= 0.60 && activationRatio < 0.85) {
      intent = 'Pain Alert';
      predictedText = 'I am experiencing pain.';
    } else {
      intent = 'Emergency Alert';
      predictedText = 'Emergency help needed!';
    }
  }

  return {
    intent,
    predictedText,
    confidenceScore,
    statusMessage,
    aiInference: aiInferenceResult,
    emgMetrics: {
      baselineVoltage: baseline,
      maxVoluntaryContraction: mvc,
      rmsAmplitude: Number(effectiveRms.toFixed(2)),
      activationRatio: Number(activationRatio.toFixed(2))
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
