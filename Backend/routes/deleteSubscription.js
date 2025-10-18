import express from "express";
import { deleteSub } from "../controller/deleteSub.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.delete("/:id", protectRoute, deleteSub);

export default router;
