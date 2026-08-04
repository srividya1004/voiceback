import apiClient from './apiClient';

/**
 * VoiceBack Patient Domain API Service
 */
export const patientService = {
  // Create Patient Profile linked to a UserLogin record
  createPatientProfile: async (patientPayload) => {
    const response = await apiClient.post('/patients', patientPayload);
    return response.data;
  },

  // Get Patient by MongoDB ObjectId
  getPatientById: async (id) => {
    const response = await apiClient.get(`/patients/${id}`);
    return response.data;
  },

  // Get All Patients Roster
  getAllPatients: async () => {
    const response = await apiClient.get('/patients');
    return response.data;
  },

  // Update Patient Profile
  updatePatient: async (id, updateData) => {
    const response = await apiClient.put(`/patients/${id}`, updateData);
    return response.data;
  },
};

export default patientService;
