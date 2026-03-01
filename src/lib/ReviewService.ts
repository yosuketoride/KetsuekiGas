import { Preferences } from '@capacitor/preferences';
import { InAppReview } from '@capacitor-community/in-app-review';
import { Capacitor } from '@capacitor/core';

const REVIEW_DATA_KEY = 'review_prompt_data';

interface ReviewData {
    evaluationsCount: number;
    hasReviewed: boolean;
    lastPromptedAt?: string;
}

export class ReviewService {
    /**
     * Increment the evaluation count and prompt for a review if thresholds are met.
     */
    static async handleEvaluationCompleted() {
        if (!Capacitor.isNativePlatform()) {
            return; // In-app review is only available on iOS/Android native
        }

        try {
            const data = await this.getReviewData();

            if (data.hasReviewed) {
                return; // Already reviewed
            }

            data.evaluationsCount += 1;
            await this.saveReviewData(data);

            // Prompt on the 3rd, 10th, and 30th evaluations
            if ([3, 10, 30].includes(data.evaluationsCount)) {
                await this.promptForReview(data);
            }
        } catch (error) {
            console.error('Failed to handle review flow', error);
        }
    }

    private static async promptForReview(data: ReviewData) {
        try {
            await InAppReview.requestReview();

            // Assume they reviewed (or chose 'not now'). We don't want to nag them constantly,
            // but the OS rate limits the prompt anyway. We just mark it so we don't spam.
            data.lastPromptedAt = new Date().toISOString();

            // Note: InAppReview doesn't tell us if they actually left a review, 
            // but setting hasReviewed = true might be too aggressive if they declined.
            // We just let the counter thresholds handle the next prompt.
            await this.saveReviewData(data);
        } catch (error) {
            console.error('Error requesting in-app review', error);
        }
    }

    private static async getReviewData(): Promise<ReviewData> {
        const result = await Preferences.get({ key: REVIEW_DATA_KEY });
        if (result.value) {
            return JSON.parse(result.value) as ReviewData;
        }
        return { evaluationsCount: 0, hasReviewed: false };
    }

    private static async saveReviewData(data: ReviewData) {
        await Preferences.set({
            key: REVIEW_DATA_KEY,
            value: JSON.stringify(data),
        });
    }
}
