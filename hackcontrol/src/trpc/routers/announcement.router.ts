import { z } from "zod";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "..";

// Schemas:
import {
  newAnnouncementSchema,
  updateAnnouncementSchema,
  deleteAnnouncementSchema,
} from "@/schema/announcement";

export const announcementRouter = createTRPCRouter({
  //------
  // Get all announcements for a hackathon (public) =>
  getByHackathon: publicProcedure
    .input(z.object({ hackathonId: z.string() }))
    .query(async ({ ctx, input }) => {
      const announcements = await ctx.prisma.announcement.findMany({
        where: {
          hackathonId: input.hackathonId,
        },
        orderBy: [{ important: "desc" }, { createdAt: "desc" }],
      });

      return announcements;
    }),

  //------
  // Get announcements by hackathon URL (public) =>
  getByHackathonUrl: publicProcedure
    .input(z.object({ url: z.string() }))
    .query(async ({ ctx, input }) => {
      const hackathon = await ctx.prisma.hackathon.findUnique({
        where: {
          url: input.url,
        },
        select: {
          id: true,
        },
      });

      if (!hackathon) {
        return [];
      }

      const announcements = await ctx.prisma.announcement.findMany({
        where: {
          hackathonId: hackathon.id,
        },
        orderBy: [{ important: "desc" }, { createdAt: "desc" }],
      });

      return announcements;
    }),

  //------
  // Create announcement (ADMIN only, must be hackathon creator) =>
  create: adminProcedure
    .input(newAnnouncementSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify the user owns this hackathon
      const hackathon = await ctx.prisma.hackathon.findFirst({
        where: {
          id: input.hackathonId,
          creatorId: ctx.session.user.id,
        },
      });

      if (!hackathon) {
        throw new Error(
          "Hackathon not found or you don't have permission to add announcements",
        );
      }

      const announcement = await ctx.prisma.announcement.create({
        data: {
          title: input.title,
          content: input.content,
          important: input.important || false,
          hackathonId: input.hackathonId,
        },
      });

      return announcement;
    }),

  //------
  // Update announcement (ADMIN only, must be hackathon creator) =>
  update: adminProcedure
    .input(updateAnnouncementSchema)
    .mutation(async ({ ctx, input }) => {
      // First get the announcement to check the hackathon
      const existingAnnouncement = await ctx.prisma.announcement.findUnique({
        where: {
          id: input.id,
        },
        include: {
          hackathon: {
            select: {
              creatorId: true,
            },
          },
        },
      });

      if (!existingAnnouncement) {
        throw new Error("Announcement not found");
      }

      if (existingAnnouncement.hackathon.creatorId !== ctx.session.user.id) {
        throw new Error(
          "You don't have permission to update this announcement",
        );
      }

      const announcement = await ctx.prisma.announcement.update({
        where: {
          id: input.id,
        },
        data: {
          ...(input.title && { title: input.title }),
          ...(input.content && { content: input.content }),
          ...(input.important !== undefined && { important: input.important }),
        },
      });

      return announcement;
    }),

  //------
  // Delete announcement (ADMIN only, must be hackathon creator) =>
  delete: adminProcedure
    .input(deleteAnnouncementSchema)
    .mutation(async ({ ctx, input }) => {
      // First get the announcement to check the hackathon
      const existingAnnouncement = await ctx.prisma.announcement.findUnique({
        where: {
          id: input.id,
        },
        include: {
          hackathon: {
            select: {
              creatorId: true,
            },
          },
        },
      });

      if (!existingAnnouncement) {
        throw new Error("Announcement not found");
      }

      if (existingAnnouncement.hackathon.creatorId !== ctx.session.user.id) {
        throw new Error(
          "You don't have permission to delete this announcement",
        );
      }

      await ctx.prisma.announcement.delete({
        where: {
          id: input.id,
        },
      });

      return { success: true };
    }),
});
