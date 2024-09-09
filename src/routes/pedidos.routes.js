import Router from "express-promise-router";
import { isAuth } from "../middlewares/auth.middleware.js";
import {
  actualizarEstadoPedido,
  actualizarPedido,
  crearNuevoPedido, // Cambiar nombre de la función si es necesario
  eliminarPedido, // Cambiar nombre de la función si es necesario
  getPedido, // Cambiar nombre de la función si es necesario
  getPedidos,
  getPedidosTodos, // Cambiar nombre de la función si es necesario
} from "../controllers/pedido.controllers.js"; // Cambiar la importación al archivo correcto

const router = Router();

// Rutas para pedidos
router.get("/pedidos", isAuth, getPedidos);

router.get("/pedidos-todos", isAuth, getPedidosTodos);

router.get("/pedido/:id", isAuth, getPedido);

router.post("/crear-pedido", isAuth, crearNuevoPedido);

router.delete("/pedido/:id", isAuth, eliminarPedido);

router.put("/pedido/:id", isAuth, actualizarPedido);

router.put("/pedido-estado/:pedidoId", isAuth, actualizarEstadoPedido);

export default router;
