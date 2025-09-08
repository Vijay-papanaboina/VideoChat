import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { db } from "../db.js";
import { callSessions, roomParticipants, userFavorites } from "../schema.js";

class CallHistory {
  constructor(data) {
    this.id = data.id;
    this.roomId = data.roomId;
    this.userId = data.userId;
    this.duration = data.duration;
    this.startedAt = data.startedAt;
    this.endedAt = data.endedAt;
    this.isActive = data.isActive;
    this.callQuality = data.callQuality;
    this.participantsCount = data.participantsCount;
    this.connectionType = data.connectionType;
  }

  // Start a new call session
  static async startCall(userId, roomId, username, participantsCount = 1) {
    try {
      // Create call session
      const [callSession] = await db
        .insert(callSessions)
        .values({
          userId,
          roomId,
          participantsCount,
          isActive: true,
        })
        .returning();

      // Add room participant
      await db.insert(roomParticipants).values({
        userId,
        roomId,
        username,
        isActive: true,
      });

      return new CallHistory(callSession);
    } catch (error) {
      throw error;
    }
  }

  // End a call session
  static async endCall(userId, roomId, duration = 0, callQuality = 0) {
    try {
      // Update call session
      const [updatedSession] = await db
        .update(callSessions)
        .set({
          endedAt: new Date(),
          duration,
          callQuality,
          isActive: false,
        })
        .where(
          and(
            eq(callSessions.userId, userId),
            eq(callSessions.roomId, roomId),
            eq(callSessions.isActive, true)
          )
        )
        .returning();

      // Update room participant
      await db
        .update(roomParticipants)
        .set({
          leftAt: new Date(),
          isActive: false,
        })
        .where(
          and(
            eq(roomParticipants.userId, userId),
            eq(roomParticipants.roomId, roomId),
            eq(roomParticipants.isActive, true)
          )
        );

      return updatedSession ? new CallHistory(updatedSession) : null;
    } catch (error) {
      throw error;
    }
  }

  // Get user's call history
  static async getUserCallHistory(userId, limit = 50, offset = 0) {
    try {
      const calls = await db
        .select()
        .from(callSessions)
        .where(eq(callSessions.userId, userId))
        .orderBy(desc(callSessions.startedAt))
        .limit(limit)
        .offset(offset);

      return calls.map(call => new CallHistory(call));
    } catch (error) {
      throw error;
    }
  }

  // Get call statistics for user
  static async getUserCallStats(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await db
        .select({
          totalCalls: sql`COUNT(*)`,
          totalDuration: sql`SUM(${callSessions.duration})`,
          avgDuration: sql`AVG(${callSessions.duration})`,
          avgQuality: sql`AVG(${callSessions.callQuality})`,
          totalParticipants: sql`SUM(${callSessions.participantsCount})`,
        })
        .from(callSessions)
        .where(
          and(
            eq(callSessions.userId, userId),
            gte(callSessions.startedAt, startDate)
          )
        );

      return stats[0] || {
        totalCalls: 0,
        totalDuration: 0,
        avgDuration: 0,
        avgQuality: 0,
        totalParticipants: 0,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get recent rooms for user
  static async getRecentRooms(userId, limit = 10) {
    try {
      const recentRooms = await db
        .select({
          roomId: roomParticipants.roomId,
          username: roomParticipants.username,
          lastJoined: sql`MAX(${roomParticipants.joinedAt})`,
          joinCount: sql`COUNT(*)`,
        })
        .from(roomParticipants)
        .where(eq(roomParticipants.userId, userId))
        .groupBy(roomParticipants.roomId, roomParticipants.username)
        .orderBy(desc(sql`MAX(${roomParticipants.joinedAt})`))
        .limit(limit);

      return recentRooms;
    } catch (error) {
      throw error;
    }
  }

  // Add room to favorites
  static async addToFavorites(userId, roomId, roomName = null) {
    try {
      const [favorite] = await db
        .insert(userFavorites)
        .values({
          userId,
          roomId,
          roomName,
        })
        .returning();

      return favorite;
    } catch (error) {
      // Handle duplicate key error
      if (error.code === "23505") {
        throw new Error("Room already in favorites");
      }
      throw error;
    }
  }

  // Remove room from favorites
  static async removeFromFavorites(userId, roomId) {
    try {
      await db
        .delete(userFavorites)
        .where(
          and(
            eq(userFavorites.userId, userId),
            eq(userFavorites.roomId, roomId)
          )
        );

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get user's favorite rooms
  static async getFavoriteRooms(userId) {
    try {
      const favorites = await db
        .select()
        .from(userFavorites)
        .where(eq(userFavorites.userId, userId))
        .orderBy(desc(userFavorites.addedAt));

      return favorites;
    } catch (error) {
      throw error;
    }
  }

  // Get call analytics for dashboard
  static async getCallAnalytics(userId, period = "week") {
    try {
      let startDate = new Date();
      
      switch (period) {
        case "day":
          startDate.setDate(startDate.getDate() - 1);
          break;
        case "week":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      const analytics = await db
        .select({
          date: sql`DATE(${callSessions.startedAt})`,
          callsCount: sql`COUNT(*)`,
          totalDuration: sql`SUM(${callSessions.duration})`,
          avgQuality: sql`AVG(${callSessions.callQuality})`,
        })
        .from(callSessions)
        .where(
          and(
            eq(callSessions.userId, userId),
            gte(callSessions.startedAt, startDate)
          )
        )
        .groupBy(sql`DATE(${callSessions.startedAt})`)
        .orderBy(sql`DATE(${callSessions.startedAt})`);

      return analytics;
    } catch (error) {
      throw error;
    }
  }
}

export default CallHistory;
