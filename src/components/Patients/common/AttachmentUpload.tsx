import React, { useState, useRef } from 'react';
import { Upload, X, File, Download } from 'lucide-react';

interface Attachment {
  id: string;
  name: string;
  type: 'pathology' | 'imageology' | 'additional';
  url: string;
  uploadedAt: string;
}

interface AttachmentUploadProps {
  patientId: string;
  attachments?: Attachment[]; // made optional for safety
  onUpload: (file: File, type: string) => Promise<void>;
  onDelete?: (attachmentId: string) => Promise<void>;
}

const AttachmentUpload: React.FC<AttachmentUploadProps> = ({
  patientId,
  attachments = [], // fallback to empty array
  onUpload,
  onDelete
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null, type: string = 'additional') => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const file = files[0];
      await onUpload(file, type);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent, type: string = 'additional') => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files, type);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const downloadAttachment = (attachment: Attachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.click();
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
      <h3 className="text-lg font-medium text-gray-900 mb-3">{title}</h3>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={(e) => handleDrop(e, type)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <div className="text-sm text-gray-600">
          <label className="cursor-pointer">
            <span className="text-blue-600 hover:text-blue-500 font-medium">Click to upload</span>
            <span> or drag and drop</span>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => handleFileSelect(e.target.files, type)}
            />
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG, DOC up to 10MB</p>
      </div>

      {/* Existing Attachments */}
      {sectionAttachments.length > 0 && (
        <div className="mt-4 space-y-2">
          {sectionAttachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
            >
              <div className="flex items-center space-x-3">
                <File className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                  <p className="text-xs text-gray-500">
                    Uploaded {new Date(attachment.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadAttachment(attachment)}
                  className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
                {onDelete && (
                  <button
                    onClick={() => onDelete(attachment.id)}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    title="Delete"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const pathologyAttachments = attachments.filter(att => att.type === 'pathology');
  const imageologyAttachments = attachments.filter(att => att.type === 'imageology');
  const additionalAttachments = attachments.filter(att => att.type === 'additional');

  if (uploading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Uploading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AttachmentSection title="Pathology" type="pathology" attachments={pathologyAttachments} />
      <AttachmentSection title="Imageology" type="imageology" attachments={imageologyAttachments} />
      <AttachmentSection title="Additional Attachments" type="additional" attachments={additionalAttachments} />
    </div>
  );
};

export default AttachmentUpload;
