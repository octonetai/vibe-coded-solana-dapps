import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Game from './components/Game';

export default function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Solana Chess</h1>
        <WalletMultiButton />
      </header>
      <main className="app-main">
        <div className="content-wrapper">
          <Game />
        </div>
      </main>
    </div>
  );
}
