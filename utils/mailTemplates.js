module.exports = {
  RECOVER_PASSWORD: (emailAddressTo, token) => ({
    from: "password-recovery@depatitos.com",
    to: `${emailAddressTo}`,
    subject: "Restart password",
    text:
      "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
      "Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n" +
      `${process.env.FRONT_URL}/reset-password/${token}\n\n` +
      "If you did not request this, please ignore this email and your password will remain unchanged.\n"
  })
};
