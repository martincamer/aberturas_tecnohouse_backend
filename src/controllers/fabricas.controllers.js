import { pool } from "../db.js";

export const getFabricas = async (req, res, next) => {
  try {
    // Consulta SQL sin filtro por user_id
    const result = await pool.query("SELECT * FROM fabricas");

    // Retorna el resultado como JSON
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const getFabrica = async (req, res) => {
  const result = await pool.query("SELECT * FROM fabricas WHERE id = $1", [
    req.params.id,
  ]);

  if (result.rowCount === 0) {
    return res.status(404).json({
      message: "No existe ningun salida con ese id",
    });
  }

  return res.json(result.rows[0]);
};

export const crearNuevaFabrica = async (req, res, next) => {
  const { nombre } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO fabricas (nombre, user_id) VALUES ($1, $2) RETURNING *",
      [nombre, req.userId]
    );

    const todasLasFabricas = await pool.query("SELECT * FROM fabricas");

    res.json(todasLasFabricas.rows);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Ya existe una abertura con ese id",
      });
    }

    next(error);
  }
};

export const actualizarFabrica = async (req, res) => {
  const id = req.params.id;

  const { nombre } = req.body;

  const result = await pool.query(
    "UPDATE fabricas SET nombre = $1 WHERE id = $2",
    [nombre, id]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({
      message: "No existe una salida con ese id",
    });
  }

  const todasLasFabricas = await pool.query("SELECT * FROM fabricas");

  res.json(todasLasFabricas.rows);
};

export const eliminarFabrica = async (req, res) => {
  const result = await pool.query("DELETE FROM fabricas WHERE id = $1", [
    req.params.id,
  ]);

  if (result.rowCount === 0) {
    return res.status(404).json({
      message: "No existe ningun presupuesto con ese id",
    });
  }

  const todasLasFabricas = await pool.query("SELECT * FROM fabricas");

  res.json(todasLasFabricas.rows);
};
