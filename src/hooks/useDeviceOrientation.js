import { useState, useEffect } from "react";

export const useDeviceOrientation = () => {
  const [orientation, setOrientation] = useState(null);

  useEffect(() => {
    const handleOrientation = (event) => {
      // For iOS devices
      if (event.webkitCompassHeading) {
        setOrientation(event.webkitCompassHeading);
      }
      // For Android devices
      else if (event.alpha) {
        setOrientation(360 - event.alpha);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", handleOrientation);
    }

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  return { orientation };
};
