"use client";

import { useAPI, useAuthToken } from "./use-api";
import { api } from "@/lib/api-client";
import { mutate } from "swr";
import type { WalletTransaction } from "@/lib/types";

// Real API shape from /api/wallet
interface WalletAPIResponse {
  id: string;
  name: string;
  email: string;
  walletBalance: number;
  totalSales: number;
  rank: string;
  earnings: {
    commission: number;
    achievements: number;
    salary: number;
    total: number;
  };
}

// Real API shape from /api/wallet/history
interface WalletHistoryAPIResponse {
  history: WalletTransaction[];
  total: number;
  deposits: number;
  transfers: number;
  withdrawals: number;
  purchases: number;
}

export function useWallet() {
  const { data, error, isLoading } = useAPI<WalletAPIResponse>("/wallet");
  // Normalize to the shape used in the UI
  const wallet = data
    ? {
        balance: data.walletBalance ?? 0,
        totalEarnings: data.earnings?.total ?? 0,
        totalWithdrawals: data.earnings ? 0 : 0,
        pendingWithdrawals: 0,
        rank: data.rank,
        name: data.name,
        totalSales: data.totalSales,
        earnings: data.earnings,
      }
    : null;
  return { wallet, error, isLoading };
}

export function useWalletTransactions(skip = 0, take = 20) {
  const { data, error, isLoading } = useAPI<WalletHistoryAPIResponse | WalletTransaction[]>(
    `/wallet/history?skip=${skip}&take=${take}`
  );
  // Normalize: backend returns { history: [], total } not a plain array
  const transactions: WalletTransaction[] = Array.isArray(data)
    ? data
    : (data as WalletHistoryAPIResponse)?.history ?? [];
  return { data: transactions, error, isLoading };
}

export function useWalletActions() {
  const getToken = useAuthToken();

  const transfer = async (toReferralCode: string, amount: number, tPin: string) => {
    const token = await getToken();
    const result = await api.post(
      "/wallet/transfer",
      { toReferralCode, amount, tPin },
      token
    );
    mutate("/wallet");
    mutate(`/wallet/history?skip=0&take=20`);
    return result;
  };

  const deposit = async (amount: number, paymentMethod = "UPI", transactionId?: string) => {
    const token = await getToken();
    const result = await api.post(
      "/wallet/deposit",
      { amount, paymentMethod, transactionId },
      token
    );
    mutate("/wallet");
    return result;
  };

  const withdraw = async (amount: number, bankAccount: string, bankIFSC: string, accountHolder: string) => {
    const token = await getToken();
    const result = await api.post(
      "/wallet/withdraw",
      { amount, bankAccount, bankIFSC, accountHolder },
      token
    );
    mutate("/wallet");
    return result;
  };

  const sendTPin = async () => {
    const token = await getToken();
    return api.post("/wallet/send-tpin", {}, token);
  };

  return { transfer, deposit, withdraw, sendTPin };
}
