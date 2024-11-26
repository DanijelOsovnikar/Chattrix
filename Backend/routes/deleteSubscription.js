import express from "express";
import { deleteSub } from "../controller/deleteSub.controller.js";

const router = express.Router();

router.delete("/:id", deleteSub);

export default router;
