"use client";

import { useEffect, useState } from "react";
import { Box, Button, VStack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
}

export default function SelectUserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data: User[] = await response.json();

      setUsers(data);
    };

    fetchUsers();
  }, []);

  const handleSelectUser = (userId: number) => {
    router.push(`/chat/${userId}`);
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
        <Text fontSize="2xl">Select user:</Text>
        {users.map((user) => (
          <Button key={user.id} onClick={() => handleSelectUser(user.id)}>
            {user.email}
          </Button>
        ))}

        <Button
          colorScheme="blue"
          onClick={() => {
            router.push("/profile");
          }}
        >
          Back to profile
        </Button>
      </VStack>
    </Box>
  );
}
