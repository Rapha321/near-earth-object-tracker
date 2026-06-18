import { Router, type IRouter } from "express";
import healthRouter from "./health";
import neoRouter from "./neo";

const router: IRouter = Router();

router.use(healthRouter);
router.use(neoRouter);

export default router;
