import "./styles/game.css";
import { Game } from "./game/game";

const root = document.getElementById("app");
if (!root) throw new Error("#app root missing");

root.classList.add("egg-intro-open");
const game = new Game(root);
game.start();

if (import.meta.hot) {
  import.meta.hot.dispose(() => game.destroy());
}
