import React, { useState } from "react";
import apiService from "../../services/api";

interface CreatePasswordProps {
  walletAddress: string;
  apiLoading: boolean;
  setApiLoading: (loading: boolean) => void;
}

export default function CreatePassword({
  walletAddress,
  apiLoading,
  setApiLoading,
}: CreatePasswordProps) {
  // State for link device popup
  const [showLinkDevicePopup, setShowLinkDevicePopup] =
    useState<boolean>(false);
  const [devicePassword, setDevicePassword] = useState<string>("");
  const [passwordConfirm, setPasswordConfirm] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false);

  // Function to handle link device button click
  const handleLinkDeviceClick = () => {
    setShowLinkDevicePopup(true);
    setDevicePassword("");
    setPasswordConfirm("");
    setPasswordError("");
    setPasswordSuccess(false);
  };

  // Function to close the link device popup
  const closeLinkDevicePopup = () => {
    setShowLinkDevicePopup(false);
  };

  // Function to handle password setup
  const handleSetPassword = async () => {
    // Validate password
    if (devicePassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }

    if (devicePassword !== passwordConfirm) {
      setPasswordError("Passwords do not match");
      return;
    }

    try {
      setPasswordError("");
      setApiLoading(true);

      // Call API to set password
      await apiService.setUserPassword(walletAddress, devicePassword);

      // Show success state
      setPasswordSuccess(true);

      // Clear password fields
      setDevicePassword("");
      setPasswordConfirm("");

      // Close popup after delay
      setTimeout(() => {
        setShowLinkDevicePopup(false);
        setPasswordSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error setting password:", error);
      setPasswordError("Failed to set password. Please try again.");
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <>
      <button onClick={handleLinkDeviceClick} className="link-device-button">
        Link Device
      </button>

      {/* Link Device Popup */}
      {showLinkDevicePopup && (
        <div className="popup-overlay">
          <div className="link-device-popup">
            <div className="popup-header">
              <h3>Link Mobile Device</h3>
              <button className="close-popup" onClick={closeLinkDevicePopup}>
                &times;
              </button>
            </div>

            {!passwordSuccess ? (
              <div className="popup-content">
                <p className="popup-description">
                  To link your mobile device, please set a password for one-time
                  login. This password will be used to securely access your
                  wallet on your mobile device.
                </p>

                <div className="password-inputs">
                  <div className="input-group">
                    <label htmlFor="device-password">Password</label>
                    <input
                      id="device-password"
                      type="password"
                      value={devicePassword}
                      onChange={(e) => setDevicePassword(e.target.value)}
                      placeholder="Enter password"
                      disabled={apiLoading}
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="password-confirm">Confirm Password</label>
                    <input
                      id="password-confirm"
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="Confirm password"
                      disabled={apiLoading}
                    />
                  </div>
                </div>

                {passwordError && (
                  <div className="password-error">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="popup-actions">
                  <button
                    className="cancel-button"
                    onClick={closeLinkDevicePopup}
                    disabled={apiLoading}
                  >
                    Cancel
                  </button>
                  <button
                    className="set-password-button"
                    onClick={handleSetPassword}
                    disabled={apiLoading}
                  >
                    {apiLoading ? "Setting password..." : "Set Password"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="popup-content success-content">
                <div className="success-icon">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h3 className="success-message">Password Set Successfully</h3>
                <p className="success-description">
                  You can now use this password to link your mobile device.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
