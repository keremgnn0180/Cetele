import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title = "Kaydı Sil" }) => {
  if (!isOpen) return null;

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div className="delete-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-header">
          <div className="delete-modal-icon-container">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="delete-modal-title">{title}</h3>
          </div>
        </div>
        
        <div className="delete-modal-body">
          Bu kaydı silmek istediğinize emin misiniz?
          <br />
          <strong style={{ color: 'var(--danger)', display: 'block', marginTop: '8px' }}>
            Bu işlem ilişkili diğer tüm kayıtları da etkileyebilir.
          </strong>
        </div>

        <div className="delete-modal-actions">
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ padding: '10px 20px', fontSize: '0.9rem' }}
            onClick={onClose}
          >
            Vazgeç
          </button>
          <button 
            type="button" 
            className="btn btn-danger" 
            style={{ 
              padding: '10px 20px', 
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            <Trash2 size={16} />
            Evet, Sil
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
