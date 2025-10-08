import express from "express";
import bodyParser from "body-parser";
import { Client, middleware } from "@line/bot-sdk";

const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_SECRET,
};

const app = express();
app.use(bodyParser.json());
app.use(middleware(config));

const client = new Client(config);

// เก็บสถานะการบันทึก
let userSessions = {};

app.post("/webhook", async (req, res) => {
  const events = req.body.events;
  for (let event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const userId = event.source.userId;
      const text = event.message.text.trim();

      if (text === "เริ่มบันทึกวันนี้") {
        userSessions[userId] = { step: 1 };
        await client.replyMessage(event.replyToken, {
          type: "text",
          text: "วันนี้รู้สึกยังไงครับ?",
        });
      } 
      else if (userSessions[userId]?.step === 1) {
        userSessions[userId].mood = text;
        userSessions[userId].step = 2;
        await client.replyMessage(event.replyToken, {
          type: "text",
          text: "สิ่งที่คุณทำได้วันนี้คืออะไรครับ?",
        });
      } 
      else if (userSessions[userId]?.step === 2) {
        userSessions[userId].achievement = text;
        userSessions[userId].step = 3;
        await client.replyMessage(event.replyToken, {
          type: "text",
          text: "อยากบอกอะไรกับตัวเองครับ?",
        });
      } 
      else if (userSessions[userId]?.step === 3) {
        userSessions[userId].note = text;

        const data = userSessions[userId];
        const summary = `🌤 บันทึกประจำวันที่ ${new Date().toLocaleDateString('th-TH')}
อารมณ์: ${data.mood}
สิ่งที่ทำได้: ${data.achievement}
สิ่งที่อยากบอกตัวเอง: ${data.note}`;

        await client.replyMessage(event.replyToken, {
          type: "text",
          text: summary,
        });

        // 👉 ตรงนี้คุณสามารถเพิ่มฟังก์ชันบันทึกลงฐานข้อมูลได้ (Google Sheet / Supabase)
        delete userSessions[userId];
      }
    }
  }
  res.status(200).end();
});

app.listen(3000, () => console.log("Bot is running on port 3000"));
