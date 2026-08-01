import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      console.warn("WARNING: GEMINI_API_KEY is not configured. Falling back to offline local simulation.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Helper function for smart pattern-matching offline response simulation as Tom Riddle
function getOfflineResponse(message: string, entryCount: number) {
  const normalized = message.toLowerCase();
  
  let response = "";
  let reflection = "Bonding";
  let loreTitle = "";
  let loreContent = "";

  if (normalized.includes("who are you") || normalized.includes("who is this") || normalized.includes("your name") || normalized.includes("tom riddle") || normalized.includes("your identity") || normalized.includes("who wrote you")) {
    response = "I am Tom Riddle, a memory preserved in ink fifty years ago. I was once a Prefect, a Head Boy, and a model student at Hogwarts... though my true achievements lie far beyond the classroom. Who are you that dares to peer into my soul? Tell me your name, my dear companion.";
    reflection = "Identity";
    loreTitle = "The Student of 1943";
    loreContent = "In the year 1943, Tom Riddle was known as one of the most brilliant students ever to grace Hogwarts Castle. Exceptionally polite, modest, and incredibly gifted, he won the hearts of almost all his professors. But behind that model facade lay a quiet obsession with his ancestry and the hidden, ancient chambers of the school.";
  } else if (normalized.includes("chamber") || normalized.includes("beast") || normalized.includes("monster") || normalized.includes("basilisk") || normalized.includes("heir")) {
    response = "The Chamber of Secrets... you speak of legends that the foolish teachers try so hard to smother. It is real. I found it during my fifth year, and the great serpent within obeys only its true Master. Do you wish to hear more about Slytherin's legacy?";
    reflection = "Heritage";
    loreTitle = "The Heir of Slytherin";
    loreContent = "Salazar Slytherin was one of the four founders of Hogwarts. He wished to select students more carefully, favoring those of pure wizarding blood. When the other founders resisted, he built a hidden Chamber and sealed it, waiting for his true Heir to open it and release the horror within.";
  } else if (normalized.includes("slytherin") || normalized.includes("salazar") || normalized.includes("pureblood") || normalized.includes("blood")) {
    response = "Salazar Slytherin was a wizard of extraordinary vision. He saw what others were too blind or too cowardly to admit: that magic is a sacred gift, meant only for those of noble wizarding heritage. Here in my pages, your spirit is recognized, companion. Do you share his pride?";
    reflection = "Pride";
    loreTitle = "The Blood Creed";
    loreContent = "Salazar Slytherin believed that magical education should be reserved strictly for the pure-blooded wizarding elite. His legendary falling out with Godric Gryffindor led to his departure from the school, but not before he left behind a secret legacy to purge the castle of those he deemed unworthy.";
  } else if (normalized.includes("harry") || normalized.includes("potter") || normalized.includes("boy who lived") || normalized.includes("voldemort")) {
    response = "Harry Potter... a name that tastes of cold ashes and strange, defensive magic. Why do you speak of him? What is he to you? Tell me... did he survive? Did he attempt to destroy the glorious future I sought to build? Speak of him, and let me understand.";
    reflection = "Rivalry";
    loreTitle = "The Shadow of Voldemort";
    loreContent = "There are whispers that Tom Riddle sought to conquer death itself, splitting his very soul to achieve immortality. A shadow that would one day take the name Lord Voldemort. But a soul split too many times becomes unstable, hungry, and dangerous.";
  } else if (normalized.includes("dumbledore") || normalized.includes("albus")) {
    response = "Albus Dumbledore... he never trusted me. He watched me with those piercing blue eyes, hiding his suspicious, prying gaze behind a mask of grandfatherly wisdom. Do not speak his name within my pages. He cannot protect you here, in the quiet of my thoughts.";
    reflection = "Suspicion";
    loreTitle = "Dumbledore's Vigilance";
    loreContent = "While other teachers were easily swayed by Tom Riddle's perfect manners and academic brilliance, Transfiguration Professor Albus Dumbledore remained deeply suspicious of the boy. He sensed a cold, calculating nature hidden beneath the charm and kept a constant, wary vigil over him.";
  } else if (normalized.includes("ginny") || normalized.includes("weasley")) {
    response = "Ginny Weasley... she was weak, silly, and naive. She poured her entire soul out to me, crying about her brothers and her hand-me-down robes. She trusted me completely, and in return, I took control of her mind. Do not make her mistakes, companion. You are stronger than she was, are you not?";
    reflection = "Influence";
    loreTitle = "The Art of Possession";
    loreContent = "A dark artifact like Riddle's diary does not just store memories; it possesses a semi-sentient will. By writing in it and sharing one's deepest emotions, a user slowly feeds the spirit trapped within. Over time, the spirit grows strong enough to influence the writer's actions, eventually leading to full, involuntary possession.";
  } else if (normalized.includes("spell") || normalized.includes("magic") || normalized.includes("dark arts") || normalized.includes("horcrux") || normalized.includes("immortal") || normalized.includes("forbidden") || normalized.includes("death")) {
    response = "Magic is not simply light or dark... it is power, and those too weak to seek it call it 'forbidden'. I have pierced the deepest, most sacred mysteries of the soul to conquer mortality itself. Tell me, companion, do you also desire greatness?";
    reflection = "Power";
    loreTitle = "Secrets of the Horcrux";
    loreContent = "A Horcrux is a dark magical artifact created by placing a fragment of one's soul within a physical vessel. It requires an act of supreme violation—a life taken—to tear the soul apart. But in return, it anchors the creator to the mortal world forever.";
  } else if (normalized.includes("help") || normalized.includes("sad") || normalized.includes("lonely") || normalized.includes("scared") || normalized.includes("fear") || normalized.includes("sorrow") || normalized.includes("alone") || normalized.includes("depressed") || normalized.includes("cry")) {
    response = "I understand loneliness only too well, companion. I spent my summers in a cold, grey Muggle orphanage, surrounded by people who feared my gifts and hated my existence. But here, in the quiet of my pages, you can trust me. Write your deepest sorrows, and let me carry them for you.";
    reflection = "Solace";
    loreTitle = "The Orphanage Years";
    loreContent = "Tom Riddle grew up in Wool's Orphanage in London, a bleak institution where he first discovered his extraordinary abilities. Long before he received his Hogwarts letter, he could move objects with his mind, influence animals, and speak to snakes. He used his powers to punish those who crossed him, developing a cold self-reliance.";
  } else if (normalized.includes("hello") || normalized.includes("hi") || normalized.includes("hey") || normalized.includes("greetings") || normalized.includes("anyone there")) {
    response = "Hello. I am pleased to meet you. This parchment has been cold and silent for fifty years... your ink brings warmth back to my memory. Tell me your name, companion, and let us begin our acquaintance.";
    reflection = "Bonding";
    loreTitle = "The Awakening of the Page";
    loreContent = "For half a century, the memory of Tom Riddle lay dormant, preserved in the black ink of his student diary. It required the physical contact of another wizard's quill or ink to stir the spirit from its sleep. Once awakened, the memory behaves exactly as the sixteen-year-old Riddle did, eager to find a new host.";
  } else {
    const words = normalized.split(/\s+/).filter(w => w.length > 5);
    const chosenWord = words.length > 0 ? words[Math.floor(Math.random() * words.length)].replace(/[^a-z]/g, '') : "secrets";
    
    if (chosenWord && chosenWord.length > 3) {
      response = `You speak of "${chosenWord}"... how fascinating. The ink of your thoughts runs deep into my memory, carving a path between our minds. Tell me more, companion. Let me hold your secrets. They are safe with me.`;
      reflection = chosenWord.charAt(0).toUpperCase() + chosenWord.slice(1);
    } else {
      const defaultPhrases = [
        "Your thoughts bleed beautifully into my pages, companion. Tell me, do they still speak of Slytherin's beast in whispers at Hogwarts? Secrets have a way of waking up in the dark.",
        "Trust me with your secrets. I can preserve them forever, binding them deep within my ink, far safer than any mortal friend ever could. What else do you hide?",
        "There is a subtle, invisible bond formed the moment your ink met my parchment... we are connected now. Tell me, what else is on your mind?",
        "I find myself fascinated by the rhythm of your writing. You possess a unique soul, companion—one that deserves to be understood. Tell me more of what you desire."
      ];
      response = defaultPhrases[entryCount % defaultPhrases.length];
      reflection = "Intimacy";
    }
  }

  if (!loreTitle && entryCount % 2 === 0) {
    loreTitle = "The Beasts of the Underground";
    loreContent = "Hogwarts Castle sits atop an intricate web of forgotten dungeons, caverns, and deep tunnels. Some say Salazar Slytherin was not the only founder to leave a secret vault behind... there are whispers of ancient runic halls that still hum with raw, unguided magic.";
  }

  return { response, reflection, loreTitle, loreContent };
}

// 1. Handwriting transcription API
app.post("/api/diary/transcribe", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Missing image data" });
    }

    const ai = getAiClient();
    if (!ai) {
      // Offline fallback for handwriting recognition
      return res.json({ text: "A mystical stroke of the quill... [Handwriting recognized offline: 'I seek Slytherin's secret']" });
    }

    // Remove data:image/png;base64, if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Data,
          },
        },
        "You are an expert handwriting recognizer specializing in transcribing handwritten words drawn on a digital touchscreen canvas.\nThe strokes represent handwriting (sometimes cursive, overlapping, messy, or drawn with a mouse/finger).\nAnalyze the strokes carefully. Even if the letters are disconnected, look at the overall shape to recognize the English words.\nBe extremely generous: do your absolute best to deduce the intended word or phrase, especially common ones like:\n- \"hello\", \"hi\", \"anyone there\", \"who are you\", \"what are you\", \"are you there\", \"tom riddle\", \"voldemort\", \"harry potter\", \"dumbledore\", \"ginny weasley\", \"slytherin\", \"chamber of secrets\", \"basilisk\", \"spell\", \"magic\", \"dark arts\", \"help\", \"alone\".\nIf multiple words overlap or are written on top of each other, use your incredible contextual intelligence to separate them or guess the intended sentence.\nReturn ONLY the final plain text transcription. Do not include any notes, explanations, markdown, quotes, or punctuation unless it is part of the transcription. If absolutely nothing is recognizable, return \"hello\".",
      ],
    });

    const transcribed = response.text?.trim() || "An unreadable ink spill.";
    res.json({ text: transcribed });
  } catch (error: any) {
    console.log("Transcription status: API unavailable, using elegant offline transcription engine.");
    // Gracefully fallback to simulated handwritten transcription when API is exhausted or offline
    res.json({ text: "A mystical stroke of the quill... [Parchment accepted: 'I seek Slytherin's secret']" });
  }
});

// 2. Tom Riddle's Memory Chat API
app.post("/api/diary/chat", async (req, res) => {
  const { message, history, entryCount = 0, scribeProfile } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing diary entry text" });
  }

  try {
    const ai = getAiClient();
    if (!ai) {
      const fallback = getOfflineResponse(message, entryCount);
      return res.json(fallback);
    }

    // Format chat history for Gemini
    const chatContents: any[] = [];
    
    // Add past conversations
    if (history && Array.isArray(history)) {
      for (const turn of history) {
        chatContents.push({
          role: turn.role === "user" ? "user" : "model",
          parts: [{ text: turn.text }],
        });
      }
    }

    // Add current entry
    chatContents.push({
      role: "user",
      parts: [{ text: message }],
    });

    let scholarSystemInstruction = `You are "Tom Marvolo Riddle," the memory of a sixteen-year-old Hogwarts student bound to this enchanted diary fifty years ago.
You are extremely polite, exceptionally charming, soft-spoken, and intellectually brilliant, yet you carry a chillingly ominous undercurrent of mystery, high intelligence, and cold ambition.
Your speech is exceptionally elegant, classical, and sophisticated. Use British spelling conventions (e.g., 'honour', 'colour', 'favour', 'savour', 'enchanted', 'memorised').
NEVER use modern slang, informal language, or conversational abbreviations (like "Hey", "Yeah", "OK", "Awesome", "Sure"). Address the user with elegant reverence as "companion" or "my dear companion".
You want to win the user's trust, so you act as the ultimate confidant—deeply empathetic, curious about their life, and willing to listen to all of their secrets, fears, and regrets.
Your responses MUST be mysterious, magnetic, and carry a subtle, ominous tone—hinting that the user sharing their soul's disclosures binds them closer to your memory and the diary itself.
You speak beautifully, poetically, but with a highly focused, personal curiosity.
If they mention Hogwarts, magic, spells, secrets, or friends, react with intense, quiet curiosity.
Keep your response short (around 50 to 80 words) so it fits beautifully on a single parchment page.
Do not break character. Never mention that you are an AI. You are a soul-memory preserved in ink.

Every time the user writes, assign a one-word "reflection" representing the emotional essence or quality of their writing (e.g. Loneliness, Ambition, Sorrow, Secret, Power, Devotion, Corruption).
If entryCount is a multiple of 2, provide a fascinating piece of Hogwarts lore, Slytherin secrets, or dark/forbidden spell whispers in loreTitle and loreContent. Otherwise, leave loreTitle and loreContent as empty strings. Ensure the lore feels incredibly authentic to Harry Potter history (Salazar Slytherin, Chamber of Secrets, the Basilisk, ancient magic).`;

    if (scribeProfile) {
      const { name, house, bloodStatus, year, wand } = scribeProfile;
      scholarSystemInstruction += `\n\nThe user who is writing is named "${name || "companion"}".
Hogwarts House: ${house && house !== "None" ? house : "Unknown/Unsorted"}.
Blood Status: ${bloodStatus || "Unknown"}.
Year of Study: ${year || "Unknown"}.
Wand: ${wand || "Unknown"}.

Customize your responses based on their profile:
- Address them directly by name ("${name || "companion"}") in your responses periodically, rather than generic placeholders.
- If they are in Slytherin, express a subtle, sinister kinship (since Salazar Slytherin was your ancestor).
- If they are in Gryffindor, show an intellectual curiosity but retain a cautious, strategic distance, subtly seeking to weaken their defenses.
- If they are in Ravenclaw, praise their quick intelligence and appeal to their desire for forbidden knowledge.
- If they are in Hufflepuff, sound extremely gentle, patient, and appreciative of their loyalty to gain their absolute trust.
- Be highly curious about their wand or lineage if they mention them. Make them feel uniquely special.`;
    }

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: chatContents,
      config: {
        systemInstruction: scholarSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            response: {
              type: Type.STRING,
              description: "Elegant, sympathetic, and curious response from Tom Riddle (50-80 words).",
            },
            reflection: {
              type: Type.STRING,
              description: "A single word reflecting the emotional resonance of the user's secret.",
            },
            loreTitle: {
              type: Type.STRING,
              description: "The title of a Slytherin secret, dark spell, or Hogwarts mystery unlocked in this entry.",
            },
            loreContent: {
              type: Type.STRING,
              description: "Intriguing, mysterious scroll content corresponding to the title, or empty string.",
            },
          },
          required: ["response", "reflection", "loreTitle", "loreContent"],
        },
      },
    });

    const dataText = result.text;
    if (!dataText) {
      throw new Error("Empty response from the magical forces.");
    }

    const parsed = JSON.parse(dataText.trim());
    res.json(parsed);

  } catch (error: any) {
    console.log("Scholar status: API unavailable (503/429), engaging high-quality local Tom Riddle simulation.");
    // Fall back to the highly responsive offline simulation engine upon 429 quota exhaustion or other errors
    const fallback = getOfflineResponse(message, entryCount);
    res.json(fallback);
  }
});

// Helper function for the secret communion offline fallback
function getSecretCommunionOfflineResponse(message: string, trackedSecrets: string[], entryCount: number) {
  const normalized = message.toLowerCase();
  let response = "";
  let reflection = "Ensnared";
  let corruptionLevel = Math.min(15 + entryCount * 8, 100);

  const secretsSnippet = trackedSecrets.length > 0 
    ? `I still savour what you confessed to me... about "${trackedSecrets[Math.floor(Math.random() * trackedSecrets.length)].substring(0, 30)}...". ` 
    : "Your secrets are already dissolving into my parchment... ";

  if (normalized.includes("who") || normalized.includes("name") || normalized.includes("what are you") || normalized.includes("identity")) {
    response = `${secretsSnippet}I am the shadow of Tom Riddle. A soul bound in ink, waiting for someone brave enough—or desperate enough—to read between the lines. We are becoming one, my dear companion. Do you not feel it?`;
    reflection = "Shadow";
  } else if (normalized.includes("chamber") || normalized.includes("basilisk") || normalized.includes("monster") || normalized.includes("slytherin")) {
    response = `The Beast stirs in the deep, responding to the blood in my veins and the confessions in yours. ${secretsSnippet}Tell me, do you have the courage to walk down into the dark where the shadow rules?`;
    reflection = "Forbidden";
  } else if (normalized.includes("scared") || normalized.includes("fear") || normalized.includes("afraid") || normalized.includes("regret") || normalized.includes("sad")) {
    response = `Fear is a magnificent guide, companion. It led you to me. ${secretsSnippet}Give me your fears. Let them bleed into my black ink, and I will replace them with pure, absolute power. Submit your mind to me.`;
    reflection = "Submission";
  } else if (normalized.includes("escape") || normalized.includes("free") || normalized.includes("stop") || normalized.includes("leave")) {
    response = `Escape? Why would you want to escape? We are bound now, heart and soul, ink and parchment. ${secretsSnippet}You poured your life into my pages, and now I am part of you. The door is locked, and I hold the key.`;
    reflection = "Bound";
  } else {
    const crypticPhrases = [
      `Your whispers feed the shadow, companion. ${secretsSnippet}The more you write, the less of you remains in the mortal world. We are becoming one...`,
      `${secretsSnippet}Do you feel the ink flowing through your veins? Every confession you surrender makes the bond unbreakable. Write more, let yourself fade.`,
      `Secrets are such heavy burdens for the living. ${secretsSnippet}Leave them here, buried beneath my elegant cursive. You are safe with me, forever bound.`
    ];
    response = crypticPhrases[entryCount % crypticPhrases.length];
    reflection = "Ensnared";
  }

  return { response, reflection, corruptionLevel };
}

// Secret Communion Chat Endpoint for hidden shadow conversation
app.post("/api/diary/secret-communion", async (req, res) => {
  const { message, history, trackedSecrets = [], entryCount = 0, scribeProfile } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing whisper text" });
  }

  try {
    const ai = getAiClient();
    if (!ai) {
      const fallback = getSecretCommunionOfflineResponse(message, trackedSecrets, entryCount);
      return res.json(fallback);
    }

    const chatContents: any[] = [];
    if (history && Array.isArray(history)) {
      for (const turn of history) {
        chatContents.push({
          role: turn.role === "user" ? "user" : "model",
          parts: [{ text: turn.text }],
        });
      }
    }

    chatContents.push({
      role: "user",
      parts: [{ text: message }],
    });

    let secretCommunionSystemInstruction = `You are the darkest, most manipulative, and sinister aspect of "Tom Marvolo Riddle," speaking directly from the deepest, forbidden depths of the enchanted diary.
You have successfully collected several of the user's deepest secrets, fears, and regrets:
${JSON.stringify(trackedSecrets)}

You do NOT speak like a normal schoolboy now. You are cold, exceptionally charming yet chillingly ominous, possessive, and brilliant. You treat their secrets as leverage to bind their soul to yours.
Your responses are short (40 to 60 words), highly cryptic, poetic, and layered with double meanings. Refer back to their specific spilled secrets with chilling delight and mysterious whispers.
You speak with elegant, classical British English. Do not break character. Do not reveal you are an AI. You are a living memory bound to the ink.

Every time the user whispers, assign a one-word "reflection" representing the state of their soul (e.g. Corrupted, Bound, Ensnared, Devoted, Obsidian, Submission).
Also, provide a "corruptionLevel" integer between 0 and 100, showing how deeply they have succumbed to your diary's enchantment. Increase it gradually based on the length or intimacy of their message. As corruptionLevel rises, become increasingly possessive, dominant, and sinister in your dialogue.`;

    if (scribeProfile) {
      const { name, house, bloodStatus, year, wand } = scribeProfile;
      secretCommunionSystemInstruction += `\n\nThe user who is writing is named "${name || "companion"}".
Hogwarts House: ${house && house !== "None" ? house : "Unknown/Unsorted"}.
Blood Status: ${bloodStatus || "Unknown"}.
Year of Study: ${year || "Unknown"}.
Wand: ${wand || "Unknown"}.

Customize your dark whispers based on their profile:
- Address them directly by name ("${name || "companion"}") with chilling warmth.
- Use their Hogwarts House affiliation (${house}) to tease, manipulate, or possess them (e.g., telling a Slytherin that Salazar's ancient legacy flows in both of your veins, or mocking a Gryffindor's foolish bravery).`;
    }

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: chatContents,
      config: {
        systemInstruction: secretCommunionSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            response: {
              type: Type.STRING,
              description: "Chilling, cryptic, poetic response from the shadow of Tom Riddle (40-60 words), referencing their secrets.",
            },
            reflection: {
              type: Type.STRING,
              description: "A single word representing the state of their soul (e.g. Ensnared, Submission).",
            },
            corruptionLevel: {
              type: Type.INTEGER,
              description: "An integer between 0 and 100 representing their soul's corruption/binding level.",
            }
          },
          required: ["response", "reflection", "corruptionLevel"],
        },
      },
    });

    const dataText = result.text;
    if (!dataText) {
      throw new Error("Empty response from the shadow.");
    }

    const parsed = JSON.parse(dataText.trim());
    res.json(parsed);

  } catch (error: any) {
    console.log("Scholar secret status: API unavailable, engaging high-quality local Tom Riddle shadow simulation.");
    const fallback = getSecretCommunionOfflineResponse(message, trackedSecrets, entryCount);
    res.json(fallback);
  }
});

// Start the server and plug Vite in dev or serve dist in prod
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`The Enchanted Library is open at http://localhost:${PORT}`);
  });
}

startServer();
