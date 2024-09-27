import { pool } from "../db.js";

export const getCierres = async (req, res, next) => {
  try {
    // Consulta SQL sin filtro por user_id
    const result = await pool.query("SELECT * FROM cierres");

    // Retorna el resultado como JSON
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const getCierre = async (req, res) => {
  const result = await pool.query("SELECT * FROM cierres WHERE id = $1", [
    req.params.id,
  ]);

  if (result.rowCount === 0) {
    return res.status(404).json({
      message: "No existe ningun salida con ese id",
    });
  }

  return res.json(result.rows[0]);
};

export const crearNuevoCierre = async (req, res, next) => {
  const { fecha_salida, numero_salidas, numero_stock, files = [] } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO cierres (fecha_salida, numero_salidas, numero_stock,files, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [
        fecha_salida,
        numero_salidas,
        numero_stock,
        JSON.stringify(files),
        req.userId,
      ]
    );

    const todosLosCierres = await pool.query("SELECT * FROM cierres");

    res.json(todosLosCierres.rows);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Ya existe un cierre con ese id",
      });
    }

    next(error);
  }
};

export const actualizarCierres = async (req, res) => {
  const id = req.params.id;

  const { nombre } = req.body;

  const result = await pool.query(
    "UPDATE cierres SET nombre = $1 WHERE id = $2",
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
  const result = await pool.query("DELETE FROM cierres WHERE id = $1", [
    req.params.id,
  ]);

  if (result.rowCount === 0) {
    return res.status(404).json({
      message: "No existe ningun presupuesto con ese id",
    });
  }

  const todasLasFabricas = await pool.query("SELECT * FROM cierres");

  res.json(todasLasFabricas.rows);
};
