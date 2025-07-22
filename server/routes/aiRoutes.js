import express from 'express'
import { generateArticle } from '../controllers/aiControlle.js';
import { auth } from '../middlewares/auth.js';

const aiRouter = express.Router();
aiRouter.post('/generate-article' , auth, generateArticle)

export default aiRouter ;