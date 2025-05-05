import { Server as SocketIO } from "socket.io";
import openSocket from "socket.io-client";
import { isObject } from "lodash";
import { Server } from "http";
import { prisma } from "./prisma";
import { logger } from "./logger";

let io: SocketIO;

export function socketConnection(params) {
  let userId = null;
  if (localStorage.getItem("userId")) {
    userId = localStorage.getItem("userId");
  }
  return openSocket(process.env.REACT_APP_BACKEND_URL, {
    transports: ["websocket", "polling", "flashsocket"],
    timeout: 18000,
    query: isObject(params) ? { ...params } : { userId: params.userId },
  });
}

export const initIO = (httpServer: Server): SocketIO => {
  try {
    io = new SocketIO(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "*",
      }
    });

    io.on("connection", async socket => {
      logger.info("Client Connected", { socketId: socket.id });
      const { userId } = socket.handshake.query;

      if (userId && userId !== "undefined" && userId !== "null" && !isNaN(parseInt(userId as string))) {
        try {
          // Buscar o usuário
          const user = await prisma.users.findFirst({
            where: {
              id: parseInt(userId as string)
            }
          });

          if (user) {
            // Atualizar o status online
            await prisma.users.update({
              where: {
                id: user.id
              },
              data: {
                online: true
              }
            });
            logger.info(`User ${user.id} is now online`);
          }
        } catch (error) {
          logger.error("Failed to update user online status:", error);
        }
      }

      socket.on("joinChatBox", (ticketId: string) => {
        logger.info("A client joined a ticket channel");
        socket.join(ticketId);
      });

      socket.on("joinNotification", () => {
        logger.info("A client joined notification channel");
        socket.join("notification");
      });

      socket.on("joinTickets", (status: string) => {
        logger.info(`A client joined to ${status} tickets channel.`);
        socket.join(status);
      });

      socket.on("disconnect", async () => {
        if (userId && userId !== "undefined" && userId !== "null") {
          try {
            await prisma.users.update({
              where: {
                id: parseInt(userId as string)
              },
              data: {
                online: false
              }
            });
            logger.info(`User ${userId} is now offline`);
          } catch (error) {
            logger.error("Failed to update user offline status:", error);
          }
        }
      });
    });
    return io;
  } catch (error) {
    logger.error("Failed to initialize socket.io", { error });
    throw new Error("Socket initialization failed");
  }
};

export const getIO = (): SocketIO => {
  if (!io) {
    throw new Error("Socket IO not initialized");
  }
  return io;
};
