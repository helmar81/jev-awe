import {onRequest} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import cors from "cors";

const corsHandler = cors({origin: true});
const typesafeKey = defineSecret("TYPESAFE_API_KEY");

const MAX_TEXT_LENGTH = 2000;

export const analyze = onRequest(
  {region: "europe-west4", secrets: [typesafeKey], maxInstances: 3},
  (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).json({error: "Method Not Allowed"});
        return;
      }

      const text = req.body?.text;
      if (typeof text !== "string" || !text.trim()) {
        res.status(400).json({error: "Please enter some text."});
        return;
      }

      if (text.length > MAX_TEXT_LENGTH) {
        res.status(400).json({
          error: `Text is too long (max ${MAX_TEXT_LENGTH} characters).`,
        });
        return;
      }

      try {
        const apiRes = await fetch("https://api.typesafe.ai/v1/systemone", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${typesafeKey.value().trim()}`,
          },
          body: JSON.stringify({
            model: "jev-latest",
            state: text,
            questions: {
              department: {
                type: "choice",
                instructions: "Which team should handle this",
                criteria: {
                  billing: "Payment or subscription issues",
                  technical: "Bugs or integration problems",
                  sales: "Pricing or account questions",
                },
              },
              is_urgent: {
                type: "noul",
                instructions: "The message conveys urgency or time-sensitivity",
              },
              frustration: {
                type: "score",
                instructions: "How frustrated the customer appears",
                criteria: [
                  "Calm, just stating facts",
                  "Frustrated but civil",
                  "Very angry, strong language",
                ],
              },
            },
          }),
        });

        const raw = await apiRes.text();
        if (!apiRes.ok) {
          logger.error("TypeSafe error", apiRes.status, raw);
          res.status(502).json({error: `TypeSafe returned ${apiRes.status}`});
          return;
        }

        const data = JSON.parse(raw);
        res.status(200).json({answers: data.answers ?? data});
      } catch (e) {
        logger.error("analyze failed", e);
        res.status(500).json({error: "Failed to analyze request"});
      }
    });
  }
);
