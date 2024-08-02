import { pool } from "../db.js";
import { createAccessToken } from "../libs/jwt.js";
import bcrypts from "bcryptjs";

// signin
export const signin = async (req, res) => {
  const { username, password } = req.body;

  const result = await pool.query("SELECT * FROM users WHERE username = $1", [
    username,
  ]);
  if (result.rowCount === 0) {
    return res.status(400).json({
      message: "El usuario no está registrado",
    });
  }

  const validPassword = await bcrypts.compare(
    password,
    result.rows[0].password
  );
  if (!validPassword) {
    return res.status(400).json({
      message: "La contraseña es incorrecta",
    });
  }
  const token = await createAccessToken({
    id: result.rows[0].id,
    role: result.rows[0].role_id,
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000,
  });

  return res.json(result.rows[0]);
};

// signup
export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypts.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users(username,password,email) VALUES($1,$2,$3) RETURNING *",
      [username, hashedPassword, email] // Assuming 'user' role has an id of 2
    );

    const token = await createAccessToken({
      id: result.rows[0].id,
      role: result.rows[0].role_id,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({
        message: "El correo ya está registrado",
      });
    }

    next(error);
  }
};

//logout
export const signout = (req, res) => {
  res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "none" });
  res.sendStatus(200);
};

//profile user
export const profile = async (req, res) => {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [
    req.userId,
  ]);
  return res.json(result.rows[0]);
};
