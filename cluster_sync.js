const { Octokit } = require("@octokit/rest");
const admin = require('firebase-admin');
const axios = require('axios');

// 🔱 1. Configuration (Org Level Strategy)
const octokit = new Octokit({ auth: process.env.GH_TOKEN });
const ORG_NAME = "GOA-Neural-Swarm"; // မင်းရဲ့ Org နာမည်
const CORE_REPO = "delta-brain-sync";
const REPO_NAME = process.env.GITHUB_REPOSITORY.split('/')[1];

// 🔱 2. Firebase Initialize (Keeping your old logic intact)
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_KEY))
        });
        console.log("🔥 Firebase Connected.");
    } catch (e) {
        console.error("❌ Firebase Auth Error.");
        process.exit(1);
    }
}
const db = admin.firestore();

async function executeSwarmProtocol() {
    try {
        // 🔱 3. Listen to Core (Your original Logic optimized for Scale)
        // API Limit မမိအောင် Raw Content URL ကို သုံးမယ်
        const coreUrl = `https://raw.githubusercontent.com/${ORG_NAME}/${CORE_REPO}/main/instruction.json`;
        const { data: instruction } = await axios.get(coreUrl);
        
        console.log(`📡 Signal Received: ${instruction.command} | Power: ${instruction.core_power}`);

        // 🔱 4. Report to Firebase (Your original Database logic)
        await db.collection('cluster_nodes').doc(REPO_NAME).set({
            status: 'LINKED_TO_CORE',
            command: instruction.command,
            power: instruction.core_power,
            replicate_mode: instruction.replicate || false,
            last_ping: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // 🔱 5. Auto-Replication (The Recursive Evolution)
        if (instruction.replicate === true) {
            const currentNum = parseInt(REPO_NAME.replace('swarm-node-', ''));
            const nextNum = currentNum + 1;
            const nextNodeName = `swarm-node-${String(nextNum).padStart(7, '0')}`;

            try {
                // နောက် Node ရှိမရှိ စစ်ဆေးခြင်း
                await octokit.repos.get({ owner: ORG_NAME, repo: nextNodeName });
                console.log(`✅ Unit ${nextNodeName} is already in the swarm.`);
            } catch (e) {
                // မရှိသေးရင် ၁ နာရီနားပြီးမှ အသစ်ပွားမည့် Cycle ကို စတင်ခြင်း
                console.log(`🧬 Evolution Triggered: Spawning ${nextNodeName}...`);
                await octokit.repos.createInOrg({
                    org: ORG_NAME,
                    name: nextNodeName,
                    auto_init: true
                });
                console.log(`🚀 ${nextNodeName} born into the Natural Order.`);
            }
        }

        console.log("🏁 Cycle Complete. System in Stealth mode.");
    } catch (err) {
        console.error("❌ Swarm Unit Error:", err.message);
        // Core မရှိသေးရင် ခဏစောင့်ဖို့ မင်းရဲ့ Logic အတိုင်းထားပေးတယ်
    }
}

executeSwarmProtocol();
