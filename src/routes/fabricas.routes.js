import Router from "express-promise-router";
import { isAuth } from "../middlewares/auth.middleware.js";
import {
  actualizarFabrica,
  crearNuevaFabrica,
  eliminarFabrica,
  getFabrica,
  getFabricas,
} from "../controllers/fabricas.controllers.js";

const router = Router();

router.get("/fabricas", isAuth, getFabricas);

router.get("/fabrica/:id", isAuth, getFabrica);

router.post("/crear-fabrica", isAuth, crearNuevaFabrica);

router.put("/fabricas/:id", isAuth, actualizarFabrica);

router.delete("/fabricas/:id", isAuth, eliminarFabrica);

export default router;
