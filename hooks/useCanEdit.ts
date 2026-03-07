"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { canEditSpace } from "@/lib/arkiv/collaborators";

export function useCanEdit(spaceId: string, ownerAddress: string) {
  const { address } = useAccount();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (!address) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    console.log("useCanEdit debug:", {
      spaceId,
      ownerAddress,
      userAddress: address,
      ownerMatch: address.toLowerCase() === ownerAddress.toLowerCase()
    });

    setLoading(true);
    canEditSpace(spaceId, address, ownerAddress)
      .then((result) => {
        if (isMounted) {
          console.log("canEditSpace result:", result);
          setAllowed(result);
        }
      })
      .catch((error) => {
        if (isMounted) {
          console.error("canEditSpace error:", error);
          setAllowed(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [address, spaceId, ownerAddress]);

  return { allowed, loading };
}