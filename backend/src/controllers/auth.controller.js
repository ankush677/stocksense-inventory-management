const crypto = require("crypto");
const pool = require("../config/db");

function hashPassword(password, salt) {
  return crypto
    .scryptSync(password, salt, 64)
    .toString("hex");
}

function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString("hex");

  return {
    salt,
    hash: hashPassword(password, salt),
  };
}

function verifyPassword(password, salt, storedHash) {
  const hash = hashPassword(password, salt);

  return crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(storedHash, "hex")
  );
}

function createToken() {
  return crypto.randomBytes(32).toString("hex");
}

function createOtp() {
  return String(
    crypto.randomInt(100000, 1000000)
  );
}

function hashOtp(otp) {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
}

/* =========================================================
   SIGN UP
   ========================================================= */

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await pool.query(
      `SELECT id
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const { salt, hash } = createPasswordHash(password);
    const token = createToken();

    const result = await pool.query(
      `INSERT INTO users
       (
         name,
         email,
         password_hash,
         password_salt,
         auth_token
       )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email`,
      [
        name.trim(),
        normalizedEmail,
        hash,
        salt,
        token,
      ]
    );

    res.status(201).json({
      message: "Account created successfully",
      token,
      user: result.rows[0],
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create account",
    });
  }
};

/* =========================================================
   LOGIN
   ========================================================= */

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `SELECT
         id,
         name,
         email,
         password_hash,
         password_salt
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    const validPassword = verifyPassword(
      password,
      user.password_salt,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = createToken();

    await pool.query(
      `UPDATE users
       SET auth_token = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [token, user.id]
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to login",
    });
  }
};

/* =========================================================
   LOGOUT
   ========================================================= */

const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace(
      "Bearer ",
      ""
    );

    if (token) {
      await pool.query(
        `UPDATE users
         SET auth_token = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE auth_token = $1`,
        [token]
      );
    }

    res.json({
      message: "Logged out successfully",
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to logout",
    });
  }
};

/* =========================================================
   FORGOT PASSWORD — GENERATE OTP
   ========================================================= */

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `SELECT id
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No account found with this email",
      });
    }

    const otp = createOtp();
    const otpHash = hashOtp(otp);

    await pool.query(
      `UPDATE users
       SET reset_otp_hash = $1,
           reset_otp_expires_at = CURRENT_TIMESTAMP + INTERVAL '10 minutes',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [otpHash, result.rows[0].id]
    );

    /*
      Hackathon/demo mode:
      The OTP is returned so the complete OTP flow
      can be demonstrated without an email provider.
    */

    console.log(
      `StockSense password reset OTP for ${normalizedEmail}: ${otp}`
    );

    res.json({
      message: "OTP generated successfully",
      demo_otp: otp,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to generate OTP",
    });
  }
};

/* =========================================================
   RESET PASSWORD
   ========================================================= */

const resetPassword = async (req, res) => {
  try {
    const {
      email,
      otp,
      new_password,
    } = req.body;

    if (!email || !otp || !new_password) {
      return res.status(400).json({
        message: "Email, OTP and new password are required",
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `SELECT
         id,
         reset_otp_hash,
         reset_otp_expires_at
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    const user = result.rows[0];

    if (!user.reset_otp_hash) {
      return res.status(400).json({
        message: "Please request a new OTP",
      });
    }

    if (
      !user.reset_otp_expires_at ||
      new Date(user.reset_otp_expires_at) < new Date()
    ) {
      return res.status(400).json({
        message: "OTP has expired. Please request a new OTP",
      });
    }

    const providedOtpHash = hashOtp(otp);

    if (providedOtpHash !== user.reset_otp_hash) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    const { salt, hash } = createPasswordHash(new_password);

    await pool.query(
      `UPDATE users
       SET password_hash = $1,
           password_salt = $2,
           reset_otp_hash = NULL,
           reset_otp_expires_at = NULL,
           auth_token = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [hash, salt, user.id]
    );

    res.json({
      message: "Password reset successfully",
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to reset password",
    });
  }
};

module.exports = {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
};