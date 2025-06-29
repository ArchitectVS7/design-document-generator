// Response Review Component v0.7.0

import React, { useState } from 'react';

interface ResponseReviewProps {
  agentId: number;
  response: string;
  agentName: string;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onEdit: (editedResponse: string) => void;
  onClose: () => void;
}

const ResponseReview: React.FC<ResponseReviewProps> = ({
  agentId,
  response,
  agentName,
  onApprove,
  onReject,
  onEdit,
  onClose
}) => {
  const [editedResponse, setEditedResponse] = useState(response);
  const [isEditing, setIsEditing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onEdit(editedResponse);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedResponse(response);
    setIsEditing(false);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    onReject(rejectionReason);
    setShowRejectDialog(false);
    setRejectionReason('');
  };

  const handleShowRejectDialog = () => {
    setShowRejectDialog(true);
  };

  const handleCancelReject = () => {
    setShowRejectDialog(false);
    setRejectionReason('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Review Response</h2>
            <p className="text-sm text-gray-600 mt-1">
              Review and edit the response from {agentName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response from {agentName}
              </label>
              {isEditing ? (
                <textarea
                  value={editedResponse}
                  onChange={(e) => setEditedResponse(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={15}
                />
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">{response}</pre>
                </div>
              )}
            </div>

            {/* Response metadata */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-green-900">Response Details</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Length: {response.length} characters | 
                    Estimated tokens: {Math.ceil(response.length / 4)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-green-600">Agent ID</div>
                  <div className="text-sm font-medium text-green-900">{agentId}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Response
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleShowRejectDialog}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reject
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onApprove}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Approve & Continue
            </button>
          </div>
        </div>
      </div>

      {/* Rejection Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Response</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Rejection
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejecting this response..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={handleCancelReject}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reject Response
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponseReview; 