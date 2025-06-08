// client/src/components/common/Modal/Modal.jsx
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import  Button  from '../Button';
import './Modal.css';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'medium',
    showCloseButton = true,
    closeOnBackdropClick = true,
    closeOnEscape = true,
    className = '',
    headerActions,
    footerActions
}) => {
    const modalRef = useRef(null);
    const backdropRef = useRef(null);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && closeOnEscape && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
            
            // Focus trap
            if (modalRef.current) {
                modalRef.current.focus();
            }
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose, closeOnEscape]);

    const handleBackdropClick = (e) => {
        if (e.target === backdropRef.current && closeOnBackdropClick) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const modalContent = (
        <div 
            className={`modal-backdrop ${isOpen ? 'modal-backdrop--open' : ''}`}
            ref={backdropRef}
            onClick={handleBackdropClick}
        >
            <div 
                className={`modal modal--${size} ${className}`}
                ref={modalRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? "modal-title" : undefined}
            >
                {(title || showCloseButton || headerActions) && (
                    <div className="modal__header">
                        {title && (
                            <h2 className="modal__title" id="modal-title">
                                {title}
                            </h2>
                        )}
                        
                        <div className="modal__header-actions">
                            {headerActions}
                            {showCloseButton && (
                                <button 
                                    className="modal__close-button"
                                    onClick={onClose}
                                    aria-label="Закрыть модальное окно"
                                >
                                    <svg 
                                        width="24" 
                                        height="24" 
                                        viewBox="0 0 24 24" 
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div className="modal__body">
                    {children}
                </div>

                {footerActions && (
                    <div className="modal__footer">
                        {footerActions}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

// Компонент для подтверждения действий
export const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Подтверждение',
    message,
    confirmText = 'Подтвердить',
    cancelText = 'Отмена',
    variant = 'default'
}) => {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="small"
            footerActions={
                <div className="modal-actions">
                    <Button 
                        variant="outline" 
                        onClick={onClose}
                    >
                        {cancelText}
                    </Button>
                    <Button 
                        variant={variant === 'danger' ? 'danger' : 'primary'} 
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </Button>
                </div>
            }
        >
            <p className="confirm-modal__message">{message}</p>
        </Modal>
    );
};

// Компонент для информационных сообщений
export const InfoModal = ({
    isOpen,
    onClose,
    title = 'Информация',
    message,
    buttonText = 'ОК',
    icon
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="small"
            footerActions={
                <Button 
                    variant="primary" 
                    onClick={onClose}
                    className="info-modal__button"
                >
                    {buttonText}
                </Button>
            }
        >
            <div className="info-modal__content">
                {icon && (
                    <div className="info-modal__icon">
                        {icon}
                    </div>
                )}
                <p className="info-modal__message">{message}</p>
            </div>
        </Modal>
    );
};

export default Modal;