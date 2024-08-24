import { pool } from "../db.js";

export const getPedidosTodos = async (req, res, next) => {
  try {
    // Consulta SQL sin filtro por user_id
    const result = await pool.query("SELECT * FROM pedidos");

    // Retorna el resultado como JSON
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const getPedidos = async (req, res, next) => {
  try {
    // Consulta SQL con filtro por user_id
    const result = await pool.query(
      "SELECT * FROM pedidos WHERE user_id = $1",
      [req.userId]
    );

    // Retorna el resultado como JSON
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const getPedido = async (req, res) => {
  const result = await pool.query("SELECT * FROM pedidos WHERE id = $1", [
    req.params.id,
  ]);

  if (result.rowCount === 0) {
    return res.status(404).json({
      message: "No existe ningún pedido con ese id",
    });
  }

  return res.json(result.rows[0]);
};

export const crearNuevoPedido = async (req, res, next) => {
  const { aberturas = [] } = req.body;
  const estado = "pendiente";

  // Asegúrate de que `aberturas` sea un array de objetos JSON
  if (!Array.isArray(aberturas)) {
    return res.status(400).json({
      message: "El campo 'aberturas' debe ser un array de objetos JSON.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Insertar nuevo pedido
    const result = await client.query(
      "INSERT INTO pedidos (aberturas, estado, fabrica, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [JSON.stringify(aberturas), estado, req.fabrica, req.userId]
    );

    await client.query("COMMIT");

    // Obtener pedidos filtrados por `fabrica` o `user_id`
    const todosLosPedidos = await client.query(
      "SELECT * FROM pedidos WHERE fabrica = $1 AND user_id = $2",
      [req.fabrica, req.userId]
    );

    // Responder con los pedidos
    res.json({
      pedidos: todosLosPedidos.rows,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error en la creación de pedido:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "Ya existe una abertura con ese id",
      });
    }

    next(error);
  } finally {
    client.release();
  }
};

export const eliminarPedido = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // Obtener la información del pedido que se va a eliminar
    const pedidoResult = await client.query(
      "SELECT * FROM pedidos WHERE id = $1",
      [req.params.id]
    );

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({
        message: "No existe ningún pedido con ese id",
      });
    }

    const pedido = pedidoResult.rows[0];

    // Obtener todos los pedidos
    const todosLosPedidos = await client.query("SELECT * FROM pedidos");

    // Responder con los pedidos
    res.json({
      pedidos: todosLosPedidos.rows,
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }
    console.error("Error al eliminar el pedido:", error);
    res.status(500).json({
      message: "Ocurrió un error al eliminar el pedido",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

export const actualizarEstadoPedido = async (req, res, next) => {
  const { pedidoId } = req.params;
  const { estado } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verificar si el pedido existe
    const pedidoExistente = await client.query(
      "SELECT * FROM pedidos WHERE id = $1",
      [pedidoId]
    );

    if (pedidoExistente.rowCount === 0) {
      return res.status(404).json({
        message: "El pedido no existe.",
      });
    }

    // Actualizar el estado del pedido
    await client.query("UPDATE pedidos SET estado = $1 WHERE id = $2", [
      estado,
      pedidoId,
    ]);

    await client.query("COMMIT");

    // Obtener el pedido actualizado
    const todosLosPedidos = await client.query("SELECT * FROM pedidos");

    // Responder con el pedido actualizado
    res.json({
      pedidos: todosLosPedidos.rows,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error al actualizar el estado del pedido:", error);
    next(error);
  } finally {
    client.release();
  }
};
