import { useCallback, useEffect, useState } from "react";
import Surface from "../Shared/ui/Surface";
import Button from "../Shared/ui/Button";
import LoadingState from "../Shared/ui/LoadingState";
import ErrorState from "../Shared/ui/ErrorState";
import {
  createCoinCheckoutSession,
  fetchWallet,
  fetchWalletLedger,
} from "../Api/monetization.api";
import "../features/monetization/monetization.css";

function formatMoneyFromCoins(coins = 0) {
  return `$${(Number(coins || 0) / 100).toFixed(2)}`;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [buying, setBuying] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [walletData, ledgerData] = await Promise.all([
        fetchWallet(),
        fetchWalletLedger(),
      ]);
      setWallet(walletData);
      setLedger(Array.isArray(ledgerData) ? ledgerData : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load wallet.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const buyPack = async (packCode) => {
    setBuying(packCode);
    setError("");
    try {
      await createCoinCheckoutSession(packCode);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not complete coin purchase.");
    } finally {
      setBuying("");
    }
  };

  if (loading) return <LoadingState text="Loading wallet..." />;
  if (error && !wallet) return <ErrorState title="Wallet unavailable" subtitle={error} onRetry={load} />;

  return (
    <main className="monetization-page">
      <section className="monetization-hero">
        <span className="monetization-eyebrow">InkVerse Wallet</span>
        <h1>Coins for reading, AI services, and creator tools.</h1>
        <p>
          Local checkout is running in mock mode for now, so purchases credit the
          wallet immediately while the real provider adapter stays replaceable.
        </p>
      </section>

      {error ? <div className="monetization-alert">{error}</div> : null}

      <div className="monetization-grid">
        <Surface className="monetization-panel">
          <span className="monetization-eyebrow">Balance</span>
          <strong className="monetization-balance">{wallet?.coinBalance ?? 0}</strong>
          <p>{formatMoneyFromCoins(wallet?.coinBalance)} available as reader coins.</p>
          <p>{wallet?.creditBalance ?? 0} author credits available.</p>
        </Surface>

        <Surface className="monetization-panel monetization-panel--wide">
          <span className="monetization-eyebrow">Coin packs</span>
          <div className="monetization-pack-grid">
            {(wallet?.packs ?? []).map((pack) => (
              <button
                type="button"
                key={pack.code}
                className="monetization-pack"
                disabled={Boolean(buying)}
                onClick={() => buyPack(pack.code)}
              >
                <strong>{pack.coins} coins</strong>
                <span>{pack.label}</span>
                <em>{buying === pack.code ? "Adding..." : "Buy"}</em>
              </button>
            ))}
          </div>
        </Surface>
      </div>

      <Surface className="monetization-panel">
        <div className="monetization-panel-head">
          <div>
            <span className="monetization-eyebrow">Ledger</span>
            <h2>Recent activity</h2>
          </div>
          <Button type="button" variant="outline" onClick={load}>Refresh</Button>
        </div>

        <div className="monetization-ledger">
          {ledger.length ? ledger.map((entry) => (
            <div className="monetization-ledger-row" key={entry.id}>
              <div>
                <strong>{entry.description || entry.entryType}</strong>
                <span>{new Date(entry.createdAt).toLocaleString()}</span>
              </div>
              <em className={entry.amountCoins >= 0 ? "is-positive" : "is-negative"}>
                {entry.amountCoins >= 0 ? "+" : ""}{entry.amountCoins} coins
              </em>
            </div>
          )) : <p className="monetization-muted">No wallet activity yet.</p>}
        </div>
      </Surface>
    </main>
  );
}
