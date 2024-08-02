import Router from "express-promise-router";
import { isAuth } from "../middlewares/auth.middleware.js";
import {
  crearNuevaSalida,
  eliminarSalida,
  getSalida,
  getSalidas,
} from "../controllers/salidas.controllers.js";

const router = Router();

router.get("/salidas", isAuth, getSalidas);

router.get("/salida/:id", isAuth, getSalida);

router.post("/crear-salida", isAuth, crearNuevaSalida);

router.delete("/salidas/:id", isAuth, eliminarSalida);

export default router;
