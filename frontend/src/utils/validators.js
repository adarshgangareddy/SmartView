export const validateSchedule = (openTime, closeTime) => {
  if (!openTime || !closeTime) {
    return { valid: false, message: 'Both opening and closing times are required.' };
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;
  if (!timeRegex.test(openTime)) {
    return { valid: false, message: 'Invalid opening time format (HH:mm).' };
  }
  if (!timeRegex.test(closeTime)) {
    return { valid: false, message: 'Invalid closing time format (HH:mm).' };
  }

  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (closeMinutes <= openMinutes) {
    return {
      valid: false,
      message: 'Closing time must be strictly after opening time.',
    };
  }

  return { valid: true };
};
