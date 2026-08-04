import apiClient from './apiClient';

/**
 * VoiceBack Caregiver Domain API Service
 */
export const caregiverService = {
  // Create Caregiver Profile linked to a UserLogin record
  createCaregiverProfile: async (caregiverPayload) => {
    const response = await apiClient.post('/caregivers', caregiverPayload);
    return response.data;
  },

  // Get Caregiver Profile by ObjectId
  getCaregiverById: async (id) => {
    const response = await apiClient.get(`/caregivers/${id}`);
    return response.data;
  },

  // Get All Caregivers List
  getAllCaregivers: async () => {
    const response = await apiClient.get('/caregivers');
    return response.data;
  },

  // Update Caregiver Profile
  updateCaregiver: async (id, updateData) => {
    const response = await apiClient.put(`/caregivers/${id}`, updateData);
    return response.data;
  },
};

export default caregiverService;
