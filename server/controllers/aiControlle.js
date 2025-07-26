import OpenAI from "openai";
import sql from "../config/db.js";
import { clerkClient } from "@clerk/express";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import FormData from "form-data";
import fs from 'fs'
import pdf from 'pdf-parse/lib/pdf-parse.js'

// Initialize OpenAI (Gemini-style endpoint)
const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

// Generate Article
export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: length,
    });

    const content = response.choices[0].message.content;

    await sql`
      INSERT INTO creations(user_id, prompt, content, type)
      VALUES(${userId}, ${prompt}, ${content}, 'article')
    `;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Generate Blog Title
export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const content = response.choices[0].message.content;

    await sql`
      INSERT INTO creations(user_id, prompt, content, type)
      VALUES(${userId}, ${prompt}, ${content}, 'blog-title')
    `;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Generate Image
export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, publish } = req.body;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions",
      });
    }

    // ✅ Create FormData and append prompt
    const form = new FormData();
    form.append("prompt", prompt);

    // ✅ Send request to ClipDrop API
    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      form,
      {
        headers: {
          "x-api-key": process.env.CLIPDROP_API_KEY,
          ...form.getHeaders(),
        },
        responseType: "arraybuffer",
      }
    );

    // ✅ Convert binary data to base64
    const base64Image = `data:image/png;base64,${Buffer.from(data, "binary").toString("base64")}`;

    // ✅ Upload to Cloudinary
    const { secure_url } = await cloudinary.uploader.upload(base64Image);

    // ✅ Insert into database
    await sql`
      INSERT INTO creations(user_id, prompt, content, type, publish)
      VALUES(${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})
    `;

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth();
    const {image} = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions",
      });
    }

    // ✅ Upload to Cloudinary
    const { secure_url } = await cloudinary.uploader.upload(image.path ,{
        transformation:[{
            effect:'background_removel',
            background_removel :'remove_the_background'
        }]
    });

    // ✅ Insert into database
    await sql`
      INSERT INTO creations(user_id, prompt, content, type)
      VALUES(${userId}, 'Remove background from image', ${secure_url}, 'image')
    `;

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { object } = req.body;   
    const {image} = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions",
      });
    }

    // ✅ Upload to Cloudinary
    const { public_id } = await cloudinary.uploader.upload(image.path );

    const imageUrl = cloudinary.url(public_id , {
        transformation:[{effect: `gen_remove:${object}`}],
        resource_type:'image'
    })
    // ✅ Insert into database
    await sql`
      INSERT INTO creations(user_id, prompt, content, type)
      VALUES(${userId},${`Remove ${object} from image`} , ${imageUrl}, 'image')
    `;

    res.json({ success: true, content: imageUrl });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const resumeReview = async (req, res) => {
  try {
    const { userId } = req.auth(); 
    const resume  = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions",
      });
    }

    if(resume.size > 5 * 1024 * 1024){
      return res.json({success:false , message: "Resume file size exceed allowed size (5MB)."})
    }
    const dataBuffer = fs.readFileSync(resume.path) 
    const pdfData = await pdf(dataBuffer)
    const prompt = `Review the following resume and provide contructive feedback on its strengths , weaknessses , and ares for improvement. Resume Content:\n\n${pdfData.text}`
    
      const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });
    const content = response.choices[0].message.content
    
    // ✅ Insert into database
    await sql`
      INSERT INTO creations(user_id, prompt, content, type)
      VALUES(${userId},'Review the uploaded resume' , ${content}, 'resume-review')
    `;
    res.json({ success: true, content });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

