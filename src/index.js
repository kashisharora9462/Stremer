import connectDB from "../db/index.js";


import dotenv from "dotenv";
import { DB_NAME } from "./constants.js";
import express from "express";

dotenv.config({ path: './.env' });
const app = express();

connectDB();