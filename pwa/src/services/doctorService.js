import apiClient from './apiClient';

/**
 * VoiceBack Doctor Domain API Service
 */
export const doctorService = {
  // Create Doctor Profile linked to a UserLogin record
  createDoctorProfile: async (doctorPayload) => {
    const response = await apiClient.post('/doctors', doctorPayload);
    return response.data;
  },

  // Get Doctor Profile by ObjectId
  getDoctorById: async (id) => {
    const response = await apiClient.get(`/doctors/${id}`);
    return response.data;
  },

  // Get All Doctors List
  getAllDoctors: async () => {
    const response = await apiClient.get('/doctors');
    return response.data;
  },

  // Update Doctor Profile
  updateDoctor: async (id, updateData) => {
    const response = await apiClient.put(`/doctors/${id}`, updateData);
    return response.data;
  },
};

export default doctorService;
