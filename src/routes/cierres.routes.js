import Router from "express-promise-router";
import { isAuth } from "../middlewares/auth.middleware.js";
import {
  actualizarCierres,
  crearNuevoCierre,
  eliminarFabrica,
  getCierre,
  getCierres,
} from "../controllers/cierres.controllers.js";

const router = Router();

router.get("/cierres", isAuth, getCierres);

router.get("/cierres/:id", isAuth, getCierre);

router.post("/cierres", isAuth, crearNuevoCierre);

router.put("/cierres/:id", isAuth, actualizarCierres);

router.delete("/cierres/:id", isAuth, eliminarFabrica);

export default router;
