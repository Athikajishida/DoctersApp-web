import React from 'react';
import { Download, File } from 'lucide-react';

interface Attachment {
  id: string;
  name: string;
  type: 'pathology' | 'imageology' | 'additional';
  url: string;
  uploadedAt: string;
}

interface AttachmentDownloadProps {
  patientId: string;
  attachments?: Attachment[];
}

const AttachmentDownload: React.FC<AttachmentDownloadProps> = ({
  patientId,
  attachments = []
}) => {
  const downloadAttachment = (attachment: Attachment) => {
    // Create a temporary link element to trigger download
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const AttachmentSection = ({
    title,
    type,
    attachments: sectionAttachments
  }: {
    title: string;
    type: string;
    attachments: Attachment[];
  }) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      {sectionAttachments.length > 0 ? (
        <div className="space-y-3">
          {sectionAttachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <File className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                  <p className="text-xs text-gray-500">
                    Uploaded {new Date(attachment.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => downloadAttachment(attachment)}
                className="flex items-center justify-center p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <File className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm">No {title.toLowerCase()} attachments available</p>
        </div>
      )}
    </div>
  );

  // Filter attachments by type
  const pathologyAttachments = attachments.filter(att => att.type === 'pathology');
  const imageologyAttachments = attachments.filter(att => att.type === 'imageology');
  const additionalAttachments = attachments.filter(att => att.type === 'additional');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div>
        <AttachmentSection 
          title="Pathology" 
          type="pathology" 
          attachments={pathologyAttachments} 
        />
      </div>
      
      <div>
        <AttachmentSection 
          title="Imageology" 
          type="imageology" 
          attachments={imageologyAttachments} 
        />
      </div>
      
      <div>
        <AttachmentSection 
          title="Additional Attachments" 
          type="additional" 
          attachments={additionalAttachments} 
        />
      </div>
    </div>
  );
};

export default AttachmentDownload;