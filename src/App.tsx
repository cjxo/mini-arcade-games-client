import { useState } from 'react';
import Breakout from './games/Breakout';
import Snake from './games/Snake';

type ArcadeGame = "Breakout" | "Snake";

const App = () => {
  const [currentGame, setCurrentGame] = useState<ArcadeGame | null>(null);
  
  const handleGameSelect = (game: ArcadeGame) => {
    return () => setCurrentGame(game);
  };

  return (
    <>
      {currentGame === null ? (
        <div>
          <h1>Mini Arcade Games</h1>
          <button onClick={handleGameSelect("Breakout")}>Play Breakout</button>
          <button onClick={handleGameSelect("Snake")}>Play Snake</button>
        </div>
      ) : currentGame === "Breakout" ? (
        <Breakout />
      ) : (
        <Snake />
      )}
    </>
  );
}

export default App;
