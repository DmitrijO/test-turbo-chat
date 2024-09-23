"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

interface Subscription {
  plan: string;
}

interface Profile {
  email: string;
  subscription?: Subscription | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<Profile>({
    email: "",
    subscription: null,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: Profile = await response.json();
        setProfile(data);
      } else {
        console.error("Fetch profile error");
      }
    };

    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  const handleNavigateChat = () => {
    router.push("/chat/users");
  };

  const handleNavigateSubscriptions = () => {
    router.push("/subscriptions");
  };

  const handleLogOut = () => {
    localStorage.removeItem("token");
    router.push("/");
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
        <Text fontSize="2xl">Profile</Text>
        <Text>Email: {profile.email}</Text>
        <Text>Subscription: {profile.subscription?.plan || "-"}</Text>
        <HStack spacing={4} align="center">
          <Button colorScheme="blue" onClick={handleNavigateChat}>
            Chat users
          </Button>
          <Button colorScheme="blue" onClick={handleNavigateSubscriptions}>
            Subscriptions
          </Button>
          <Button colorScheme="red" onClick={handleLogOut}>
            Log out
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
