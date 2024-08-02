import Router from "express-promise-router";
import { isAuth } from "../middlewares/auth.middleware.js";
import {
  actualizarAbertura,
  crearNuevaAbertura,
  eliminarAbertura,
  getAbertura,
  getAberturas,
} from "../controllers/aberturas.controllers.js";

const router = Router();

router.get("/aberturas", isAuth, getAberturas);

router.get("/abertura/:id", isAuth, getAbertura);

router.post("/crear-abertura", isAuth, crearNuevaAbertura);

router.put("/aberturas/:id", isAuth, actualizarAbertura);

router.delete("/aberturas/:id", isAuth, eliminarAbertura);

export default router;
