import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const TRANSITION_DURATION_MS = 200;

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Trigger animation on next frame
      requestAnimationFrame(() => requestAnimationFrame(() => setIsVisible(true)));
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), TRANSITION_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Lock body scroll and compensate for scrollbar to prevent layout shift
  useEffect(() => {
    if (!shouldRender) return;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [shouldRender]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!shouldRender) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-hidden={!isVisible}
    >
      {/* Backdrop with transition */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-200 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleBackdropClick}
        style={{ transitionDuration: `${TRANSITION_DURATION_MS}ms` }}
      />
      {/* Content with transition - flex-shrink-0 keeps it from shrinking, my-auto centers when scrollable */}
      <div
        className={`relative m-auto flex-shrink-0 bg-white rounded-xl shadow-2xl ${sizes[size]} w-full transition-all duration-200 ease-out ${
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.96] translate-y-2'
        }`}
        style={{ transitionDuration: `${TRANSITION_DURATION_MS}ms` }}
      >
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
              <button
                onClick={onClose}
                className="p-1.5 -mr-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
          )}
          <div className="p-6">{children}</div>
        </div>
    </div>
  );
};

export default Modal;

