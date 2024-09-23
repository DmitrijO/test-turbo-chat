"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Button, Input, VStack, Text, HStack } from "@chakra-ui/react";
import io from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "@/hooks/useAuth";

const socket = io("http://localhost:3001");

interface Message {
  id: number;
  content: string;
  sender: {
    id: string;
    email: string;
  };
  receiver: {
    id: string;
    email: string;
  };
  timestamp: string;
}

interface DecodedToken {
  sub: string;
}

export default function ChatWithUserPage() {
  useAuth();
  const router = useRouter();
  const { userId } = useParams();
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded: DecodedToken = jwtDecode(token);

      if (decoded?.sub) {
        setCurrentUserId(decoded?.sub);
      }
    }

    if (currentUserId) {
      socket.emit("joinChat", { userId: currentUserId });

      const loadChatHistory = async () => {
        const response = await fetch(
          `http://localhost:3001/chat/history?userId1=${currentUserId}&userId2=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data: Message[] = await response.json();

        setMessages(data);
      };

      loadChatHistory();

      socket.on("receiveMessage", (msg: Message) => {
        setMessages((prevMessages) => [...prevMessages, msg]);
      });

      return () => {
        socket.off("receiveMessage");
      };
    }
  }, [currentUserId, userId]);

  const sendMessage = () => {
    if (!currentUserId) {
      return;
    }

    socket.emit("sendMessage", {
      senderId: currentUserId,
      receiverId: userId,
      content: message,
    });
    setMessage("");
  };

  const handleBack = () => {
    router.push("/chat/users");
  };

  return (
    <Box
      w="100%"
      h="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack spacing={4}>
        <HStack justifyContent="space-between" w="100%">
          <Text fontSize="2xl">Chat:</Text>
          <Button onClick={handleBack} colorScheme="blue">
            Back
          </Button>
        </HStack>
        <Box w="100%" h="300px" bg="gray.100" p={4} overflowY="scroll">
          {messages.map((msg, index) => (
            <HStack
              key={index}
              justify={
                msg?.sender?.id === currentUserId ? "flex-end" : "flex-start"
              }
              w="100%"
              p={2}
            >
              <Box
                bg={msg?.sender?.id === currentUserId ? "teal.100" : "gray.300"}
                p={3}
                borderRadius="lg"
                maxW="60%"
                textAlign={msg?.sender?.id === currentUserId ? "right" : "left"}
              >
                {msg.sender && <Text fontSize="sm">{msg.sender.email}</Text>}
                <Text>{msg.content}</Text>
                <Text fontSize="xs" color="gray.500">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Text>
              </Box>
            </HStack>
          ))}
        </Box>
        <HStack w="100%">
          <Input
            placeholder="Send message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button
            disabled={!message.trim()}
            onClick={sendMessage}
            colorScheme="teal"
          >
            Send
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
