"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Input, Text, VStack } from "@chakra-ui/react";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  if (isAuthenticated) {
    router.push("/profile");
  }

  const handleSubmit = async () => {
    const url = isLogin ? "/auth/login" : "/auth/register";
    const response = await fetch(`http://localhost:3001${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const { message } = await response.json();
      setError(message);
    } else {
      if (isLogin) {
        const data = await response.json();
        localStorage.setItem("token", data.access_token);
      }
      router.push("/profile");
    }
  };

  return (
    <Box
      w="100%"
      h="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack spacing={4} align="center">
        <Text fontSize="2xl">{isLogin ? "Login" : "Register"}</Text>
        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button colorScheme="teal" onClick={handleSubmit}>
          {isLogin ? "Login" : "Register"}
        </Button>
        <Button variant="link" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Register" : "Login"}
        </Button>
        {error && <Text color="red.500">{error}</Text>}
      </VStack>
    </Box>
  );
}
