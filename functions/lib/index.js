"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkInnerfaceDecay = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
// --- Logic ---
exports.checkInnerfaceDecay = functions.pubsub.schedule('every 24 hours').onRun(async () => {
    var _a, _b;
    console.log('Running Innerface Decay Check');
    // Query all Innerfaces with decay enabled
    const querySnapshot = await db.collectionGroup('innerfaces')
        .where('decaySettings.enabled', '==', true)
        .get();
    console.log(`Found ${querySnapshot.size} innerfaces with decay enabled.`);
    let batch = db.batch();
    let batchCount = 0;
    const MAX_BATCH_SIZE = 450;
    const now = new Date();
    for (const doc of querySnapshot.docs) {
        const innerface = doc.data();
        const decaySettings = innerface.decaySettings;
        if (!decaySettings || !decaySettings.enabled)
            continue;
        const lastActivityDateStr = innerface.lastCheckInDate || decaySettings.lastDecayDate || null;
        if (!lastActivityDateStr)
            continue;
        const lastActivityDate = new Date(lastActivityDateStr);
        const MS_PER_DAY = 1000 * 60 * 60 * 24;
        const diffMs = now.getTime() - lastActivityDate.getTime();
        const diffDays = diffMs / MS_PER_DAY;
        // Backward compatible: default interval to 1 if not set
        const interval = decaySettings.interval || 1;
        let shouldDecay = false;
        switch (decaySettings.frequency) {
            case 'day':
                shouldDecay = diffDays >= (interval * 1);
                break;
            case 'week':
                shouldDecay = diffDays >= (interval * 7);
                break;
            case 'month':
                // Approximation: 30 days per month used for decay logic
                shouldDecay = diffDays >= (interval * 30);
                break;
        }
        if (shouldDecay) {
            console.log(`Decaying Innerface ${doc.id} (${innerface.name}). Days inactive: ${diffDays.toFixed(1)}`);
            const decayAmount = decaySettings.amount;
            const currentScore = (_b = (_a = innerface.currentScore) !== null && _a !== void 0 ? _a : innerface.initialScore) !== null && _b !== void 0 ? _b : 0;
            const newScore = Math.max(0, currentScore - decayAmount);
            if (currentScore === newScore && currentScore === 0)
                continue; // Already at 0
            // 1. Update Innerface
            const innerfaceRef = doc.ref;
            batch.update(innerfaceRef, {
                currentScore: newScore,
                'decaySettings.lastDecayDate': now.toISOString()
            });
            // 2. Add History Entry
            const personalityRef = innerfaceRef.parent.parent;
            if (personalityRef) {
                const historyCollection = personalityRef.collection('history');
                const newHistoryRef = historyCollection.doc();
                const historyRecord = {
                    type: 'decay',
                    protocolId: 'system-decay',
                    protocolName: 'Inactivity Decay',
                    protocolIcon: 'hourglass-half',
                    timestamp: now.toISOString(),
                    weight: -decayAmount,
                    targets: [doc.id],
                    changes: { [doc.id]: -decayAmount },
                    serverTimestamp: admin.firestore.FieldValue.serverTimestamp()
                };
                batch.set(newHistoryRef, historyRecord);
            }
            batchCount++;
            if (batchCount >= MAX_BATCH_SIZE) {
                await batch.commit();
                batch = db.batch(); // Create NEW batch
                batchCount = 0;
            }
        }
    }
    if (batchCount > 0) {
        await batch.commit();
        console.log(`Final commit: ${batchCount} updates.`);
    }
    return null;
});
//# sourceMappingURL=index.js.map