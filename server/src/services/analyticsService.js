// server/src/services/analyticsService.js
const logger = require('../utils/logger');

class AnalyticsService {
  constructor() {
    this.events = [];
  }

  /**
   * Track user event
   */
  async trackEvent(event) {
    try {
      const eventData = {
        ...event,
        timestamp: new Date(),
        id: Date.now() + Math.random()
      };

      this.events.push(eventData);
      
      // Keep only last 1000 events in memory
      if (this.events.length > 1000) {
        this.events = this.events.slice(-1000);
      }

      logger.info('Event tracked', eventData);
      return eventData;

    } catch (error) {
      logger.error('Error tracking event', { error: error.message, event });
      throw error;
    }
  }

  /**
   * Get analytics data
   */
  async getAnalytics(options = {}) {
    try {
      const { startDate, endDate, eventType, userId } = options;
      
      let filteredEvents = [...this.events];

      // Filter by date range
      if (startDate || endDate) {
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.timestamp);
          if (startDate && eventDate < new Date(startDate)) return false;
          if (endDate && eventDate > new Date(endDate)) return false;
          return true;
        });
      }

      // Filter by event type
      if (eventType) {
        filteredEvents = filteredEvents.filter(event => event.type === eventType);
      }

      // Filter by user
      if (userId) {
        filteredEvents = filteredEvents.filter(event => event.userId === userId);
      }

      return {
        events: filteredEvents,
        total: filteredEvents.length,
        summary: this.generateSummary(filteredEvents)
      };

    } catch (error) {
      logger.error('Error getting analytics', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate analytics summary
   */
  generateSummary(events) {
    try {
      const summary = {
        totalEvents: events.length,
        eventTypes: {},
        userCount: new Set(),
        timeRange: {
          start: null,
          end: null
        }
      };

      events.forEach(event => {
        // Count event types
        summary.eventTypes[event.type] = (summary.eventTypes[event.type] || 0) + 1;
        
        // Track unique users
        if (event.userId) {
          summary.userCount.add(event.userId);
        }

        // Track time range
        const eventTime = new Date(event.timestamp);
        if (!summary.timeRange.start || eventTime < summary.timeRange.start) {
          summary.timeRange.start = eventTime;
        }
        if (!summary.timeRange.end || eventTime > summary.timeRange.end) {
          summary.timeRange.end = eventTime;
        }
      });

      summary.uniqueUsers = summary.userCount.size;
      delete summary.userCount;

      return summary;

    } catch (error) {
      logger.error('Error generating summary', { error: error.message });
      return {};
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(userId) {
    try {
      return await this.getAnalytics({ userId });
    } catch (error) {
      logger.error('Error getting user analytics', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics() {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [last24HoursData, last7DaysData, allTimeData] = await Promise.all([
        this.getAnalytics({ startDate: last24Hours }),
        this.getAnalytics({ startDate: last7Days }),
        this.getAnalytics()
      ]);

      return {
        last24Hours: last24HoursData.summary,
        last7Days: last7DaysData.summary,
        allTime: allTimeData.summary,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      };

    } catch (error) {
      logger.error('Error getting system metrics', { error: error.message });
      throw error;
    }
  }

  /**
   * Clear old events
   */
  async clearOldEvents(olderThanDays = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const initialLength = this.events.length;
      this.events = this.events.filter(event => new Date(event.timestamp) > cutoffDate);
      
      const removedCount = initialLength - this.events.length;
      
      logger.info('Cleared old events', { 
        removed: removedCount, 
        remaining: this.events.length,
        cutoffDate 
      });
      
      return removedCount;

    } catch (error) {
      logger.error('Error clearing old events', { error: error.message });
      throw error;
    }
  }
}

module.exports = new AnalyticsService();