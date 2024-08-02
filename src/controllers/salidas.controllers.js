import { pool } from "../db.js";

export const getSalidas = async (req, res, next) => {
  try {
    // Consulta SQL sin filtro por user_id
    const result = await pool.query("SELECT * FROM salidas");

    // Retorna el resultado como JSON
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const getSalida = async (req, res) => {
  const result = await pool.query("SELECT * FROM salidas WHERE id = $1", [
    req.params.id,
  ]);

  if (result.rowCount === 0) {
    return res.status(404).json({
      message: "No existe ningun salida con ese id",
    });
  }

  return res.json(result.rows[0]);
};

export const crearNuevaSalida = async (req, res, next) => {
  const {
    fabrica = "",
    fecha_salida = "",
    remitos = [],
    aberturas = [],
    contratos = [],
    files = [],
  } = req.body;

  // Asegúrate de que `aberturas` sea un array de objetos JSON
  if (!Array.isArray(aberturas)) {
    return res.status(400).json({
      message: "El campo 'aberturas' debe ser un array de objetos JSON.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Obtener el stock actual de las aberturas y validar
    const stockData = await Promise.all(
      aberturas.map(async (abertura) => {
        const { id, cantidad } = abertura;
        if (id && Number(cantidad) > 0) {
          const stockResult = await client.query(
            "SELECT stock FROM aberturas WHERE id = $1",
            [id]
          );

          const stockDisponible = stockResult.rows[0]?.stock || 0;
          if (Number(cantidad) > Number(stockDisponible)) {
            throw new Error(
              `No hay suficiente stock para la abertura con ID ${id}. Stock disponible: ${stockDisponible}`
            );
          }
          return {
            id,
            cantidad,
            stock: Number(stockDisponible),
          };
        }
        return null;
      })
    );

    // Insertar nueva salida
    const result = await client.query(
      "INSERT INTO salidas (fabrica, fecha_salida, remitos, aberturas, contratos, files, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        fabrica,
        fecha_salida,
        JSON.stringify(remitos),
        JSON.stringify(aberturas),
        JSON.stringify(contratos),
        JSON.stringify(files),
        req.userId,
      ]
    );

    // Actualizar stock en la tabla aberturas
    for (const stock of stockData) {
      const { id, cantidad } = stock;
      await client.query(
        "UPDATE aberturas SET stock = stock - $1 WHERE id = $2",
        [cantidad, id]
      );
    }

    await client.query("COMMIT");

    // Obtener todas las salidas
    const todasLasSalidas = await client.query("SELECT * FROM salidas");
    const todosLasAberturas = await client.query("SELECT * FROM aberturas");

    // Responder con las salidas
    res.json({
      aberturas: todosLasAberturas.rows,
      salidas: todasLasSalidas.rows,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error en la creación de salida:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "Ya existe una abertura con ese id",
      });
    }

    // Manejar el error de stock insuficiente
    if (error.message.includes("No hay suficiente stock")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    next(error);
  } finally {
    client.release();
  }
};

// export const crearNuevaSalida = async (req, res, next) => {
//   const {
//     fabrica = "",
//     fecha_salida = "",
//     remitos = "",
//     aberturas = [],
//     files = "[]",
//   } = req.body;

//   // Asegúrate de que `aberturas` sea un array de objetos JSON
//   if (!Array.isArray(aberturas)) {
//     return res.status(400).json({
//       message: "El campo 'aberturas' debe ser un array de objetos JSON.",
//     });
//   }

//   // Validar que cada objeto en el array `aberturas` tenga los campos esperados
//   for (const abertura of aberturas) {
//     if (
//       !abertura.id ||
//       typeof abertura.cantidad !== "string" || // Verifica que cantidad sea un número
//       abertura.cantidad <= 0
//     ) {
//       return res.status(400).json({
//         message:
//           "Cada abertura debe tener un id y un campo cantidad que sea un número entero positivo mayor que cero.",
//       });
//     }
//   }

//   const client = await pool.connect();

//   try {
//     await client.query("BEGIN");

//     // Obtener el stock actual de las aberturas
//     const stockData = await Promise.all(
//       aberturas.map(async (abertura) => {
//         const { id, cantidad } = abertura;
//         if (id && cantidad > 0) {
//           const stockResult = await client.query(
//             "SELECT stock, detalle, color, linea FROM aberturas WHERE id = $1",
//             [id]
//           );
//           return {
//             id,
//             totalCantidad: cantidad,
//             stock: stockResult.rows[0]?.stock || 0,
//             detalle: stockResult.rows[0]?.detalle || "",
//             color: stockResult.rows[0]?.color || "",
//             linea: stockResult.rows[0]?.linea || "",
//           };
//         }
//         return null;
//       })
//     );

//     // Validar si alguna abertura tiene una cantidad solicitada mayor al stock disponible
//     const errorDetalles = stockData.filter(
//       (stock) => stock && stock.totalCantidad > stock.stock
//     );

//     if (errorDetalles.length > 0) {
//       return res.status(400).json({
//         message: "No hay suficiente stock para algunas aberturas.",
//         detalles: errorDetalles,
//       });
//     }

//     // Insertar nueva salida
//     const result = await client.query(
//       "INSERT INTO salidas (fabrica, fecha_salida, remitos, aberturas, files, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
//       [
//         fabrica,
//         fecha_salida,
//         remitos,
//         JSON.stringify(aberturas),
//         JSON.stringify(files),
//         req.userId,
//       ]
//     );

//     // Actualizar stock en la tabla aberturas
//     for (const abertura of aberturas) {
//       const { id, cantidad } = abertura;

//       if (id && cantidad > 0) {
//         // Actualizar el stock
//         await client.query(
//           "UPDATE aberturas SET stock = stock - $1 WHERE id = $2",
//           [cantidad, id]
//         );
//       }
//     }

//     await client.query("COMMIT");

//     // Obtener todas las salidas
//     const todasLasSalidas = await client.query("SELECT * FROM salidas");
//     const todosLasAberturas = await client.query("SELECT * FROM aberturas");

//     // Responder con las salidas
//     res.json({
//       aberturas: todosLasAberturas.rows,
//       salidas: todasLasSalidas.rows,
//     });
//   } catch (error) {
//     await client.query("ROLLBACK");

//     console.error("Error en la creación de salida:", error);

//     if (error.code === "23505") {
//       return res.status(409).json({
//         message: "Ya existe una abertura con ese id",
//       });
//     }

//     next(error);
//   } finally {
//     client.release();
//   }
// };

// export const crearNuevaSalida = async (req, res, next) => {
//   const {
//     fabrica = "",
//     fecha_salida = "",
//     remitos = "",
//     aberturas = [],
//     files = "[]",
//   } = req.body;

//   // Asegúrate de que `aberturas` sea un array de objetos JSON
//   if (!Array.isArray(aberturas)) {
//     return res.status(400).json({
//       message: "El campo 'aberturas' debe ser un array de objetos JSON.",
//     });
//   }

//   // Validar que cada objeto en el array `aberturas` tenga los campos esperados
//   for (const abertura of aberturas) {
//     if (
//       !abertura.id ||
//       !Array.isArray(abertura.cantidad) || // Verifica que cantidad sea un array
//       abertura.cantidad.some((cant) => typeof cant !== "string") // Verifica que cada cantidad sea una cadena
//     ) {
//       return res.status(400).json({
//         message:
//           "Cada abertura debe tener un id y un campo cantidad que sea un array de cadenas.",
//       });
//     }
//   }

//   const client = await pool.connect();

//   try {
//     await client.query("BEGIN");

//     // Obtener el stock actual de las aberturas
//     const stockData = await Promise.all(
//       aberturas.map(async (abertura) => {
//         const { id, cantidad } = abertura;
//         const totalCantidad = cantidad.reduce(
//           (acc, val) => acc + (parseInt(val, 10) || 0),
//           0
//         );
//         if (id && totalCantidad > 0) {
//           const stockResult = await client.query(
//             "SELECT stock, detalle, color, linea FROM aberturas WHERE id = $1",
//             [id]
//           );
//           return {
//             id,
//             totalCantidad,
//             stock: stockResult.rows[0]?.stock || 0,
//             detalle: stockResult.rows[0]?.detalle || "",
//             color: stockResult.rows[0]?.color || "",
//             linea: stockResult.rows[0]?.linea || "",
//           };
//         }
//         return null;
//       })
//     );

//     // Validar si alguna abertura tiene una cantidad solicitada mayor al stock disponible
//     const errorDetalles = stockData.filter(
//       (stock) => stock && stock.totalCantidad > stock.stock
//     );

//     if (errorDetalles.length > 0) {
//       return res.status(400).json({
//         message: "No hay suficiente stock para algunas aberturas.",
//         detalles: errorDetalles,
//       });
//     }

//     // Insertar nueva salida
//     const result = await client.query(
//       "INSERT INTO salidas (fabrica, fecha_salida, remitos, aberturas, files, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
//       [
//         fabrica,
//         fecha_salida,
//         remitos,
//         JSON.stringify(aberturas),
//         JSON.stringify(files),
//         req.userId,
//       ]
//     );

//     // Actualizar stock en la tabla aberturas
//     for (const abertura of aberturas) {
//       const { id, cantidad } = abertura;

//       if (id && cantidad) {
//         // Sumar todas las cantidades proporcionadas
//         const totalCantidad = cantidad.reduce(
//           (acc, val) => acc + (parseInt(val, 10) || 0),
//           0
//         );

//         // Validar si la cantidad es válida y mayor que cero
//         if (totalCantidad > 0) {
//           // Actualizar el stock
//           await client.query(
//             "UPDATE aberturas SET stock = stock - $1 WHERE id = $2",
//             [totalCantidad, id]
//           );
//         }
//       }
//     }

//     await client.query("COMMIT");

//     // Obtener todas las salidas
//     const todasLasSalidas = await client.query("SELECT * FROM salidas");
//     const todosLasAberturas = await client.query("SELECT * FROM aberturas");

//     // Responder con las salidas
//     res.json({
//       aberturas: todosLasAberturas.rows,
//       salidas: todasLasSalidas.rows,
//     });
//   } catch (error) {
//     await client.query("ROLLBACK");

//     console.error("Error en la creación de salida:", error);

//     if (error.code === "23505") {
//       return res.status(409).json({
//         message: "Ya existe una abertura con ese id",
//       });
//     }

//     next(error);
//   } finally {
//     client.release();
//   }
// };

// export const crearNuevaSalida = async (req, res, next) => {
//   const {
//     fabrica = "",
//     fecha_salida = "",
//     remitos = "",
//     aberturas = [],
//     files = "[]",
//   } = req.body;

//   // Asegúrate de que `aberturas` sea un array de objetos JSON
//   if (!Array.isArray(aberturas)) {
//     return res.status(400).json({
//       message: "El campo 'aberturas' debe ser un array de objetos JSON.",
//     });
//   }

//   // Validar que cada objeto en el array `aberturas` tenga los campos esperados
//   for (const abertura of aberturas) {
//     if (!abertura.id || !Array.isArray(abertura.cantidad)) {
//       return res.status(400).json({
//         message:
//           "Cada abertura debe tener un id y un campo cantidad que sea un array.",
//       });
//     }
//   }

//   const client = await pool.connect();

//   try {
//     await client.query("BEGIN");

//     // Insertar nueva salida
//     const result = await client.query(
//       "INSERT INTO salidas (fabrica, fecha_salida, remitos, aberturas, files, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
//       [
//         fabrica,
//         fecha_salida,
//         remitos,
//         JSON.stringify(aberturas),
//         JSON.stringify(files),
//         req.userId,
//       ]
//     );

//     // Actualizar stock en la tabla aberturas
//     for (const abertura of aberturas) {
//       const { id, cantidad } = abertura;

//       if (id && cantidad) {
//         // Sumar todas las cantidades proporcionadas
//         const totalCantidad = cantidad.reduce(
//           (acc, val) => acc + (parseInt(val, 10) || 0),
//           0
//         );

//         // Validar si la cantidad es válida y mayor que cero
//         if (totalCantidad > 0) {
//           // Actualizar el stock
//           await client.query(
//             "UPDATE aberturas SET stock = stock - $1 WHERE id = $2",
//             [totalCantidad, id]
//           );
//         }
//       }
//     }

//     await client.query("COMMIT");

//     // Obtener todas las salidas
//     const todasLasSalidas = await client.query("SELECT * FROM salidas");
//     const todosLasAberturas = await client.query("SELECT * FROM aberturas");

//     // Responder con las salidas
//     res.json({
//       aberturas: todosLasAberturas.rows,
//       salidas: todasLasSalidas.rows,
//     });
//   } catch (error) {
//     await client.query("ROLLBACK");

//     console.error("Error en la creación de salida:", error);

//     if (error.code === "23505") {
//       return res.status(409).json({
//         message: "Ya existe una abertura con ese id",
//       });
//     }

//     next(error);
//   } finally {
//     client.release();
//   }
// };

// export const crearNuevaSalida = async (req, res, next) => {
//   const {
//     fabrica = "",
//     fecha_salida = "",
//     remitos = "",
//     aberturas = [],
//   } = req.body;

//   try {
//     const result = await pool.query(
//       "INSERT INTO salidas (fabrica, fecha_salida, remitos, aberturas, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
//       [fabrica, fecha_salida, remitos, aberturas, req.userId]
//     );

//     console.log(aberturas);

//     const todasLasSalidas = await pool.query("SELECT * FROM salidas");

//     res.json(todasLasSalidas.rows);
//   } catch (error) {
//     if (error.code === "23505") {
//       return res.status(409).json({
//         message: "Ya existe una abertura con ese id",
//       });
//     }

//     next(error);
//   }
// };

// export const eliminarSalida = async (req, res) => {
//   const result = await pool.query("DELETE FROM salidas WHERE id = $1", [
//     req.params.id,
//   ]);

//   if (result.rowCount === 0) {
//     return res.status(404).json({
//       message: "No existe ningun presupuesto con ese id",
//     });
//   }

//   const todasLasSalidas = await pool.query("SELECT * FROM salidas");

//   res.json(todasLasSalidas.rows);
// };

export const eliminarSalida = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // Obtener la información de la salida que se va a eliminar
    const salidaResult = await client.query(
      "SELECT * FROM salidas WHERE id = $1",
      [req.params.id]
    );

    if (salidaResult.rows.length === 0) {
      return res.status(404).json({
        message: "No existe ninguna salida con ese id",
      });
    }

    const salida = salidaResult.rows[0];
    const aberturas = JSON.parse(salida.aberturas);

    // Actualizar el stock en la tabla aberturas
    for (const abertura of aberturas) {
      const { id, cantidad } = abertura;
      await client.query(
        "UPDATE aberturas SET stock = stock + $1 WHERE id = $2",
        [cantidad, id]
      );
    }

    // Eliminar la salida de la tabla salidas
    await client.query("DELETE FROM salidas WHERE id = $1", [req.params.id]);

    await client.query("COMMIT");

    // Obtener todas las salidas
    const todasLasSalidas = await client.query("SELECT * FROM salidas");
    const todosLasAberturas = await client.query("SELECT * FROM aberturas");

    // Responder con las salidas
    res.json({
      aberturas: todosLasAberturas.rows,
      salidas: todasLasSalidas.rows,
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }
    console.error("Error al eliminar la salida:", error);
    res.status(500).json({
      message: "Ocurrió un error al eliminar la salida",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};
