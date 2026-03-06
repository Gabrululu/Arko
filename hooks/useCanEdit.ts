"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { canEditSpace } from "@/lib/arkiv/collaborators";

export function useCanEdit(spaceId: string, ownerAddress: string) {
  const { address } = useAccount();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    canEditSpace(spaceId, address, ownerAddress)
      .then(setAllowed)
      .catch(() => setAllowed(false))
      .finally(() => setLoading(false));
  }, [address, spaceId, ownerAddress]);

  return { allowed, loading };
}