// pages/admin/appointments/AppointmentDetails.tsx
import { useParams } from 'react-router-dom';
import { useConsultation } from '../../../hooks/useConsultations';

const AppointmentDetailsPage = () => {
  const { id } = useParams();
  const consultationId = Number(id);
  const { consultation, loading, error, formatConsultationForDisplay } = useConsultation(consultationId);

  if (loading) return <div>Loading...</div>;
  if (error || !consultation) return <div>Error loading consultation.</div>;

  const formatted = formatConsultationForDisplay;

  const handleStartMeeting = () => {
    if (formatted?.meetLink) {
      // Open Google Meet in new tab
      window.open(formatted.meetLink, '_blank');
    } else {
      alert('No meeting link available for this appointment');
    }
  };

  return (
    <div>
      <h1>Appointment Details</h1>
      <div>
        <p><strong>Patient:</strong> {formatted?.patientName} ({formatted?.patientEmail})</p>
        <p><strong>Date:</strong> {formatted?.appointmentDate}</p>
        <p><strong>Time:</strong> {formatted?.appointmentTime}</p>
        <p><strong>Treatment History:</strong> {formatted?.treatmentHistory}</p>
        <p><strong>Additional Details:</strong> {formatted?.additionalDetails}</p>
        
        {formatted?.meetLink && (
          <div className="mt-4">
            <p><strong>Meeting:</strong></p>
            <button
              onClick={handleStartMeeting}
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Start Google Meet
            </button>
          </div>
        )}
        
        <div className="mt-4">
          <p><strong>Uploads:</strong></p>
          <ul>
            {formatted?.hasPathologyUpload && <li>Pathology file uploaded</li>}
            {formatted?.hasImageologyUpload && <li>Imageology file uploaded</li>}
            {formatted?.hasAdditionalUpload && <li>Additional file uploaded</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsPage;