const { Octokit } = require("@octokit/rest");
const admin = require('firebase-admin');
const axios = require('axios');

// 🔱 1. Configuration (Screenshot အရ အတည်ပြုပြီးသား Owner Name ကို သုံးထားသည်)
const octokit = new Octokit({ auth: process.env.GH_TOKEN });
const REPO_OWNER = "GOA-neurons"; 
const CORE_REPO = "delta-brain-sync";
const REPO_NAME = process.env.GITHUB_REPOSITORY.split('/')[1];

// 🔱 2. Firebase Initialize
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

async function executeDeepSwarmProtocol() {
    try {
        const startTime = Date.now();
        
        // 🔱 3. Listen to Core & Collect Intelligence
        const coreUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${CORE_REPO}/main/instruction.json`;
        const { data: instruction } = await axios.get(coreUrl);
        const latency = Date.now() - startTime;

        // GitHub API Limit စစ်ဆေးခြင်း (Deep Intelligence)
        const { data: rateData } = await octokit.rateLimit.get();
        const remaining = rateData.rate.remaining;

        console.log(`📡 Signal Received: ${instruction.command} | API Left: ${remaining}`);

        // 🔱 4. Report Deep Intelligence to Firebase
        await db.collection('cluster_nodes').doc(REPO_NAME).set({
            status: 'LINKED_TO_CORE',
            command: instruction.command,
            power: instruction.core_power || 0,
            latency: `${latency}ms`,
            api_remaining: remaining,
            replicate_mode: instruction.replicate || false,
            last_ping: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // 🔱 5. Auto-Replication (Recursive Evolution Logic - မင်းရဲ့ Code ဟောင်းမှ)
        if (instruction.replicate === true) {
            let currentNum = 0;
            if (REPO_NAME.includes('swarm-node-')) {
                currentNum = parseInt(REPO_NAME.replace('swarm-node-', ''));
            }
            
            const nextNum = currentNum + 1;
            const nextNodeName = `swarm-node-${String(nextNum).padStart(7, '0')}`;

            try {
                // နောက်ထပ် Node ရှိပြီးသားလား စစ်ဆေးခြင်း
                await octokit.repos.get({ owner: REPO_OWNER, repo: nextNodeName });
                console.log(`✅ Unit ${nextNodeName} is already in the swarm.`);
            } catch (e) {
                console.log(`🧬 Evolution Triggered: Spawning ${nextNodeName}...`);
                
                try {
                    // Organization အတွက် ဆောက်ရန် ကြိုးစားခြင်း
                    await octokit.repos.createInOrg({
                        org: REPO_OWNER,
                        name: nextNodeName,
                        auto_init: true
                    });
                } catch (orgErr) {
                    // User Account အတွက် ဆောက်ခြင်း (Screenshot အရ GOA-neurons အတွက်)
                    await octokit.repos.createForAuthenticatedUser({
                        name: nextNodeName,
                        auto_init: true
                    });
                }
                console.log(`🚀 ${nextNodeName} born into the Natural Order.`);
            }
        }

        console.log(`🏁 Cycle Complete. Latency: ${latency}ms. Swarm is Synchronized.`);
    } catch (err) {
        console.error("❌ Swarm Unit Error:", err.message);
    }
}

executeDeepSwarmProtocol();
