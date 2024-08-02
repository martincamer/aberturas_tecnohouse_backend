import { pool } from "../db.js";

export const getAberturas = async (req, res, next) => {
  try {
    // Consulta SQL sin filtro por user_id
    const result = await pool.query("SELECT * FROM aberturas");

    // Retorna el resultado como JSON
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const getAbertura = async (req, res) => {
  const result = await pool.query("SELECT * FROM aberturas WHERE id = $1", [
    req.params.id,
  ]);

  if (result.rowCount === 0) {
    return res.status(404).json({
      message: "No existe ningun salida con ese id",
    });
  }

  return res.json(result.rows[0]);
};

export const crearNuevaAbertura = async (req, res, next) => {
  const { detalle, stock, color, linea, tipo, ancho_alto } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO aberturas (detalle,stock, color, linea, tipo,ancho_alto, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [detalle, stock, color, linea, tipo, ancho_alto, req.userId]
    );

    const todasLasAberturas = await pool.query("SELECT * FROM aberturas");

    res.json(todasLasAberturas.rows);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Ya existe una abertura con ese id",
      });
    }

    next(error);
  }
};

export const actualizarAbertura = async (req, res) => {
  const id = req.params.id;

  const { detalle, stock, color, linea, tipo, ancho_alto } = req.body;

  const result = await pool.query(
    "UPDATE aberturas SET detalle = $1, stock = $2, color = $3, linea = $4, tipo = $5, ancho_alto = $6 WHERE id = $7",
    [detalle, stock, color, linea, tipo, ancho_alto, id]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({
      message: "No existe una salida con ese id",
    });
  }

  const todasLasAberturas = await pool.query("SELECT * FROM aberturas");

  res.json(todasLasAberturas.rows);
};

export const eliminarAbertura = async (req, res) => {
  const result = await pool.query("DELETE FROM aberturas WHERE id = $1", [
    req.params.id,
  ]);

  if (result.rowCount === 0) {
    return res.status(404).json({
      message: "No existe ningun presupuesto con ese id",
    });
  }

  const todasLasAberturas = await pool.query("SELECT * FROM aberturas");

  res.json(todasLasAberturas.rows);
};
