import express from "express";
import { subscribe } from "../controller/subscribe.controller.js";

const router = express.Router();

router.post("/:id", subscribe);

export default router;
