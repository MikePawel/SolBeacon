import React, { useEffect, useState } from "react";
import styles from "@/app/styles/Toast.module.css";

interface ToastProps {
  message: string;
  link?: string;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, link, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  return (
    <div className={styles.toast}>
      <div className={styles.toastContent}>
        <p>{message}</p>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.toastLink}
          >
            View on Explorer
          </a>
        )}
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          onClose();
        }}
        className={styles.closeButton}
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
