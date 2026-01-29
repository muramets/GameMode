import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

// --- Types (Mirrored from Frontend) ---

interface DecaySettings {
    enabled: boolean;
    amount: number;
    frequency: 'day' | 'week' | 'month';
    interval?: number; // NEW: multiplier for frequency (defaults to 1)
    lastDecayDate?: string;
}

interface Innerface {
    id: string | number;
    name: string;
    currentScore?: number;
    initialScore: number;
    decaySettings?: DecaySettings;
    lastCheckInDate?: string;
    createdAt?: string;
}

interface HistoryRecord {
    type: 'decay';
    protocolId: string;
    protocolName: string;
    protocolIcon: string;
    timestamp: string;
    weight: number;
    targets: (string | number)[];
    changes: Record<string | number, number>;
    serverTimestamp: admin.firestore.FieldValue;
}

// --- Logic ---

export const checkInnerfaceDecay = functions.pubsub.schedule('every 24 hours').onRun(async () => {
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
        const innerface = doc.data() as Innerface;
        const decaySettings = innerface.decaySettings;

        if (!decaySettings || !decaySettings.enabled) continue;

        const lastActivityDateStr = innerface.lastCheckInDate || decaySettings.lastDecayDate || innerface.createdAt || null;

        if (!lastActivityDateStr) continue;

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
            const currentScore = innerface.currentScore ?? innerface.initialScore ?? 0;
            const newScore = Math.max(0, currentScore - decayAmount);

            if (currentScore === newScore && currentScore === 0) continue; // Already at 0

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

                const historyRecord: HistoryRecord = {
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


