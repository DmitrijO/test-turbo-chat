"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  VStack,
  Text,
  SimpleGrid,
  HStack,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "",
);

interface Subscription {
  id: number;
  plan: string;
  startDate: string;
  endDate: string | null;
  status: string;
}

function SubscriptionPage() {
  const router = useRouter();
  const [activeSubscription, setActiveSubscription] =
    useState<Subscription | null>(null);
  const [selectedSubscriptionPlan, setSelectedSubscriptionPlan] =
    useState<string>("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    const fetchSubscriptions = async () => {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/subscriptions/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data: Subscription[] = await response.json();

      const activeSub = data.find((sub) => sub.status === "active");
      if (activeSub) {
        setActiveSubscription(activeSub);
      }
    };

    fetchSubscriptions();
  }, []);

  const handleCreateSubscription = async (plan: string) => {
    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:3001/subscriptions/create-session",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      },
    );

    const { clientSecret } = await response.json();
    setClientSecret(clientSecret);
    setSelectedSubscriptionPlan(plan);
  };

  const handleCancelSubscription = async () => {
    if (!activeSubscription) return;

    const token = localStorage.getItem("token");
    await fetch(`http://localhost:3001/subscriptions/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    setActiveSubscription(null);
  };

  const handlePayment = async () => {
    if (!stripe || !elements) return;

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: elements.getElement(CardElement)!,
    });

    if (error) {
      console.error(error.message);
    } else {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:3001/subscriptions/create",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan: selectedSubscriptionPlan,
            paymentMethodId: paymentMethod.id,
          }),
        },
      );
      const data = await response.json();
      setActiveSubscription(data);
    }
  };

  const handleBack = () => {
    router.push("/profile");
  };

  return (
    <Box
      w="100%"
      h="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={5}
    >
      <VStack spacing={6}>
        <SimpleGrid columns={[1, null, 3]} spacing={10}>
          <Box
            border="1px"
            borderColor="gray.200"
            p={5}
            rounded="md"
            textAlign="center"
          >
            <Text fontSize="xl" fontWeight="bold">
              Basic Plan
            </Text>
            <Text>$10/month</Text>
            <Button
              colorScheme="teal"
              onClick={() => handleCreateSubscription("Basic")}
              isDisabled={activeSubscription?.plan === "Basic"}
            >
              Subscribe
            </Button>
          </Box>

          <Box
            border="1px"
            borderColor="gray.200"
            p={5}
            rounded="md"
            textAlign="center"
          >
            <Text fontSize="xl" fontWeight="bold">
              Standard Plan
            </Text>
            <Text>$20/month</Text>
            <Button
              colorScheme="teal"
              onClick={() => handleCreateSubscription("Standard")}
              isDisabled={activeSubscription?.plan === "Standard"}
            >
              Subscribe
            </Button>
          </Box>

          <Box
            border="1px"
            borderColor="gray.200"
            p={5}
            rounded="md"
            textAlign="center"
          >
            <Text fontSize="xl" fontWeight="bold">
              Premium Plan
            </Text>
            <Text>$30/month</Text>
            <Button
              colorScheme="teal"
              onClick={() => handleCreateSubscription("Premium")}
              isDisabled={activeSubscription?.plan === "Premium"}
            >
              Subscribe
            </Button>
          </Box>
        </SimpleGrid>

        {clientSecret && (
          <Box w="50%" mt={8}>
            <CardElement />
            <Button
              mt={4}
              colorScheme="teal"
              onClick={handlePayment}
              isDisabled={!stripe || !elements}
            >
              Confirm Payment
            </Button>
          </Box>
        )}

        <HStack spacing={4}>
          <Button onClick={handleBack} colorScheme="blue">
            Back
          </Button>
          {activeSubscription && (
            <Button
              onClick={handleCancelSubscription}
              colorScheme="red"
              isDisabled={!activeSubscription}
            >
              Cancel Subscription
            </Button>
          )}
        </HStack>
      </VStack>
    </Box>
  );
}

export default function SubscriptionPageWrapper() {
  return (
    <Elements stripe={stripePromise}>
      <SubscriptionPage />
    </Elements>
  );
}
