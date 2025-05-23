import { Singleton } from '../utils/singleton';
import { NotificationMetrics } from '@/types/monitoring';

class FeedingNotificationMonitor extends Singleton<FeedingNotificationMonitor> {
    private metrics: NotificationMetrics;
    private readonly MAX_ERROR_HISTORY = 100;
    private readonly MAX_TIMING_HISTORY = 1000;

    public constructor() {
        super();
        this.metrics = {
            totalChecks: 0,
            totalNotificationsCreated: 0,
            totalNotificationsFailed: 0,
            totalCatsProcessed: 0,
            skippedNoInterval: 0,
            skippedNoHousehold: 0,
            skippedNoLogs: 0,
            skippedDuplicate: 0,
            averageProcessingTime: 0,
            lastCheckTimestamp: new Date(),
            errors: [],
            timings: [],
        };
    }

    public startCheck(): void {
        this.metrics.totalChecks++;
        this.metrics.lastCheckTimestamp = new Date();
    }

    public recordTiming(operation: string, duration: number): void {
        this.metrics.timings.push({
            operation,
            duration,
            timestamp: new Date(),
        });

        // Keep only the most recent timing entries
        if (this.metrics.timings.length > this.MAX_TIMING_HISTORY) {
            this.metrics.timings = this.metrics.timings.slice(-this.MAX_TIMING_HISTORY);
        }

        // Update average processing time for certain operations
        if (operation === 'total_check_duration') {
            const recentChecks = this.metrics.timings
                .filter(t => t.operation === 'total_check_duration')
                .slice(-10); // Consider last 10 checks for average
            
            const sum = recentChecks.reduce((acc, curr) => acc + curr.duration, 0);
            this.metrics.averageProcessingTime = sum / recentChecks.length;
        }
    }

    public recordError(error: Error, context?: Record<string, any>): void {
        this.metrics.errors.push({
            timestamp: new Date(),
            error: error.message,
            context,
        });

        // Keep only the most recent error entries
        if (this.metrics.errors.length > this.MAX_ERROR_HISTORY) {
            this.metrics.errors = this.metrics.errors.slice(-this.MAX_ERROR_HISTORY);
        }
    }

    public recordNotificationCreated(): void {
        this.metrics.totalNotificationsCreated++;
    }

    public recordNotificationFailed(): void {
        this.metrics.totalNotificationsFailed++;
    }

    public recordCatProcessed(skipReason?: 'no_interval' | 'no_household' | 'no_logs' | 'duplicate'): void {
        this.metrics.totalCatsProcessed++;
        
        if (skipReason) {
            switch (skipReason) {
                case 'no_interval':
                    this.metrics.skippedNoInterval++;
                    break;
                case 'no_household':
                    this.metrics.skippedNoHousehold++;
                    break;
                case 'no_logs':
                    this.metrics.skippedNoLogs++;
                    break;
                case 'duplicate':
                    this.metrics.skippedDuplicate++;
                    break;
            }
        }
    }

    public getMetrics(): NotificationMetrics {
        return { ...this.metrics }; // Return a copy to prevent external modification
    }

    public getSuccessRate(): number {
        const total = this.metrics.totalNotificationsCreated + this.metrics.totalNotificationsFailed;
        return total === 0 ? 100 : (this.metrics.totalNotificationsCreated / total) * 100;
    }

    public getRecentErrors(limit: number = 10): Array<{ timestamp: Date; error: string; context?: Record<string, any> }> {
        return [...this.metrics.errors].slice(-limit);
    }

    public getAverageTimingFor(operation: string, lastN: number = 10): number {
        const relevantTimings = this.metrics.timings
            .filter(t => t.operation === operation)
            .slice(-lastN);

        if (relevantTimings.length === 0) return 0;

        const sum = relevantTimings.reduce((acc, curr) => acc + curr.duration, 0);
        return sum / relevantTimings.length;
    }

    public getMetricsSummary(): string {
        const successRate = this.getSuccessRate();
        return `
Feeding Notification Metrics Summary:
-----------------------------------
Total Checks Run: ${this.metrics.totalChecks}
Last Check: ${this.metrics.lastCheckTimestamp.toISOString()}
Average Processing Time: ${this.metrics.averageProcessingTime.toFixed(2)}ms

Notification Stats:
- Created: ${this.metrics.totalNotificationsCreated}
- Failed: ${this.metrics.totalNotificationsFailed}
- Success Rate: ${successRate.toFixed(2)}%

Cats Processed: ${this.metrics.totalCatsProcessed}
Skipped:
- No Interval: ${this.metrics.skippedNoInterval}
- No Household: ${this.metrics.skippedNoHousehold}
- No Logs: ${this.metrics.skippedNoLogs}
- Duplicate: ${this.metrics.skippedDuplicate}

Recent Errors: ${this.metrics.errors.length > 0 ? '\n' + this.getRecentErrors(3).map(e => 
    `  ${e.timestamp.toISOString()}: ${e.error}`
).join('\n') : 'None'}
`;
    }
}

// Export a default instance
export const feedingNotificationMonitor = FeedingNotificationMonitor.getInstance(); 